import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import { db } from './config';

// ==================== USER PROFILE ====================

export async function createUserProfile(uid, data) {
    await setDoc(doc(db, 'users', uid), {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
    await updateDoc(doc(db, 'users', uid), data);
}

// ==================== HOUSEHOLDS ====================

export async function createHousehold(name, adminUid) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ref = await addDoc(collection(db, 'households'), {
        name,
        adminUid,
        members: [adminUid],
        inviteCode,
        createdAt: serverTimestamp(),
    });
    await updateUserProfile(adminUid, { householdId: ref.id, role: 'admin' });
    return { id: ref.id, inviteCode };
}

export async function joinHousehold(inviteCode, uid) {
    const q = query(
        collection(db, 'households'),
        where('inviteCode', '==', inviteCode.toUpperCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Invalid invite code');
    const householdDoc = snap.docs[0];
    const data = householdDoc.data();
    if (data.members.includes(uid)) throw new Error('Already a member');
    await updateDoc(householdDoc.ref, {
        members: [...data.members, uid],
    });
    await updateUserProfile(uid, { householdId: householdDoc.id, role: 'member' });
    return { id: householdDoc.id, name: data.name };
}

export async function getHousehold(householdId) {
    const snap = await getDoc(doc(db, 'households', householdId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function onHouseholdChange(householdId, callback) {
    return onSnapshot(doc(db, 'households', householdId), (snap) => {
        if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    });
}

// ==================== CLOTH TYPES ====================

export async function addClothType(householdId, data) {
    return addDoc(collection(db, 'households', householdId, 'clothTypes'), {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function updateClothType(householdId, clothTypeId, data) {
    await updateDoc(
        doc(db, 'households', householdId, 'clothTypes', clothTypeId),
        data
    );
}

export async function deleteClothType(householdId, clothTypeId) {
    await deleteDoc(
        doc(db, 'households', householdId, 'clothTypes', clothTypeId)
    );
}

export function onClothTypesChange(householdId, callback) {
    const q = query(
        collection(db, 'households', householdId, 'clothTypes'),
        orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
        const types = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(types);
    });
}

// ==================== LAUNDRY ENTRIES ====================

export async function addLaundryEntry(householdId, data) {
    return addDoc(collection(db, 'households', householdId, 'entries'), {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function updateLaundryEntry(householdId, entryId, data) {
    await updateDoc(
        doc(db, 'households', householdId, 'entries', entryId),
        data
    );
}

export async function deleteLaundryEntry(householdId, entryId) {
    await deleteDoc(doc(db, 'households', householdId, 'entries', entryId));
}

export async function getLaundryEntry(householdId, entryId) {
    const snap = await getDoc(
        doc(db, 'households', householdId, 'entries', entryId)
    );
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function onEntriesChange(householdId, callback) {
    const q = query(
        collection(db, 'households', householdId, 'entries'),
        orderBy('pickupDate', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(entries);
    });
}

// ==================== HOUSEHOLD MEMBERS ====================

export async function getHouseholdMembers(memberUids) {
    const members = [];
    for (const uid of memberUids) {
        const profile = await getUserProfile(uid);
        if (profile) members.push(profile);
    }
    return members;
}
