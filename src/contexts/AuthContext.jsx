import { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile, getUserProfile } from '../firebase/services';

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const profile = await getUserProfile(firebaseUser.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    async function signup(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await createUserProfile(cred.user.uid, {
            email,
            displayName,
            householdId: null,
            role: null,
        });
        const profile = await getUserProfile(cred.user.uid);
        setUserProfile(profile);
        return cred.user;
    }

    async function login(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(cred.user.uid);
        setUserProfile(profile);
        return cred.user;
    }

    async function logout() {
        await signOut(auth);
        setUserProfile(null);
    }

    async function refreshProfile() {
        if (user) {
            const profile = await getUserProfile(user.uid);
            setUserProfile(profile);
        }
    }

    const value = {
        user,
        userProfile,
        loading,
        signup,
        login,
        logout,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
