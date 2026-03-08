# LaundryLog

A modern, mobile-first Progressive Web App (PWA) for managing household laundry — track pickups, items, pricing, payments, and balances across all family members.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Firebase](https://console.firebase.google.com) project (free tier)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create a project**
2. Enable **Authentication** → Sign-in method → **Email/Password** ✅
3. Create **Firestore Database** → Start in **test mode**
4. Go to **Project Settings** → **General** → Add a **Web App** → Copy the config values

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Firebase config values:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Install as App (PWA)

- **iOS**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Open in Chrome → Menu → "Add to home screen"

---

## 📱 Features

| Feature | Description |
|---------|-------------|
| **Multi-user Auth** | Email/password login for all household members |
| **Household System** | Create a household or join one via invite code |
| **Cloth Types** | Configure garment types (shirt, pants, etc.) with per-item pricing |
| **Laundry Entries** | Log pickups with date, items, quantities, and auto-calculated totals |
| **Payment Tracking** | Mark entries as paid, partially paid, or unpaid |
| **Balance Dashboard** | See outstanding balance, monthly spend, and pending entries |
| **History** | Filter entries by status (all / unpaid / partial / paid) |
| **Real-time Sync** | All household members see updates instantly via Firestore |
| **PWA** | Installable on home screen, works offline for cached pages |

---

## 🏗 Tech Stack

- **React** (Vite) — Fast, modern frontend
- **Firebase Auth** — User authentication
- **Cloud Firestore** — Real-time NoSQL database
- **Vanilla CSS** — Custom dark glassmorphism design system
- **vite-plugin-pwa** — PWA support with service workers

---

## 📂 Project Structure

```
src/
├── App.jsx                  # Routes & auth guards
├── main.jsx                 # Entry point
├── index.css                # Design system
├── firebase/
│   ├── config.js            # Firebase initialization
│   └── services.js          # Firestore CRUD operations
├── contexts/
│   └── AuthContext.jsx      # Auth state management
├── pages/
│   ├── LoginPage.jsx        # Login / signup
│   ├── JoinHouseholdPage.jsx # Create / join household
│   ├── DashboardPage.jsx    # Summary stats & recent entries
│   ├── NewEntryPage.jsx     # Log new laundry pickup
│   ├── EntryDetailPage.jsx  # View entry & manage payments
│   ├── HistoryPage.jsx      # All entries with filters
│   └── SettingsPage.jsx     # Cloth types, household, account
└── components/
    └── Navbar.jsx           # Bottom navigation bar
```

---

## 🔒 Firestore Security Rules (Recommended)

Once you're comfortable with the app, update your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /households/{householdId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      match /clothTypes/{typeId} {
        allow read, write: if request.auth != null;
      }
      match /entries/{entryId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

---

## 📄 License

MIT
