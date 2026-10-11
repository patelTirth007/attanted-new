# Smart College Attendance System 🎓📍

An automated college attendance application featuring dynamic QR code scanning, GPS geofencing validation, face biometric verification, and cloud synchronization with **Firebase Firestore**.

---

## 💻 Required Software Downloads

Before running the project on your computer, download and install the following software:

1. **Visual Studio Code (VS Code)**
   - Download: [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - Recommended extensions in VS Code:
     - *Tailwind CSS IntelliSense*
     - *ESLint*
     - *Prettier - Code formatter*

2. **Node.js (LTS Version 18 or 20+)**
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Includes `npm` (Node Package Manager).
   - Verify installation in your terminal:
     ```bash
     node -v
     npm -v
     ```

3. **Git (Optional but recommended)**
   - Download: [https://git-scm.com/](https://git-scm.com/)

---

## 🚀 Step-by-Step Guide to Run in VS Code

### Step 1: Open the Project in VS Code
1. Launch **VS Code**.
2. Click **File** > **Open Folder...** (or press `Ctrl+K Ctrl+O` on Windows / `Cmd+O` on Mac).
3. Select this project's folder.

### Step 2: Open the Integrated Terminal
- Press `Ctrl + ` `~` (backtick) or go to **Terminal** > **New Terminal** in the top menu.

### Step 3: Install Project Dependencies
Run the following command in the terminal to install all required packages (`react`, `firebase`, `lucide-react`, `vite`, etc.):
```bash
npm install
```

### Step 4: Verify the Firebase Configuration File
Ensure the file `firebase-applet-config.json` is present in the root folder of the project. It should look like this:
```json
{
  "projectId": "gen-lang-client-0942837761",
  "appId": "1:254210265351:web:97ec6b45af2a44958cf5a2",
  "apiKey": "AIzaSyD7OmvIJQ5I755vOVujyyBbs4KLTPlTC-A",
  "authDomain": "gen-lang-client-0942837761.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-attantednew-2c7a8a13-c4bd-44ad-9d46-9a98c23829d7",
  "storageBucket": "gen-lang-client-0942837761.firebasestorage.app",
  "messagingSenderId": "254210265351",
  "measurementId": "",
  "oAuthClientId": "254210265351-7pmolom4l6v5g11s1jf8tpoda4o0c9g3.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
}
```

### Step 5: Start the Local Development Server
Run:
```bash
npm run dev
```

### Step 6: View the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

---

## 🔥 Firebase Settings (Custom Project Setup)

If you wish to link your own Firebase project instead of the pre-configured database:

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click **Add project** and give it a name.
2. **Register a Web App**:
   - Under Project Overview, click the **Web icon (`</>`)**.
   - Register your app and copy the `firebaseConfig` keys into `firebase-applet-config.json`.
3. **Enable Cloud Firestore**:
   - In the Firebase sidebar, go to **Build** > **Firestore Database**.
   - Click **Create database** (select your preferred region, e.g., `asia-east1` or `us-central1`).
   - If using named database, ensure `firestoreDatabaseId` in `firebase-applet-config.json` matches your database ID (default is `(default)`).
4. **Deploy Security Rules**:
   - In Firestore Database, go to the **Rules** tab.
   - Paste the rules from the included `firestore.rules` file and click **Publish**.
5. **Enable Authentication**:
   - In the sidebar, go to **Build** > **Authentication**.
   - Click **Get Started** and enable **Email/Password** and/or **Google**.
