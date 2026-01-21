
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let auth: any = null;
let db: any = null;

export const checkFirebaseStatus = () => {
  const isForcedDemo = localStorage.getItem('ecocash_force_demo') === 'true';
  const hasValidKey = firebaseConfig.apiKey && 
                      firebaseConfig.apiKey.length > 10 && 
                      !firebaseConfig.apiKey.startsWith("AIzaSy_PLACEHOLDER");
  
  const enabled = hasValidKey && !isForcedDemo;

  if (enabled && !auth) {
    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log("EcoCash: Firebase inicializado.");
    } catch (e) {
      console.error("EcoCash: Falha ao inicializar Firebase.");
      return { auth: null, db: null, enabled: false };
    }
  }

  return { auth, db, enabled };
};

// Exportamos as instâncias iniciais e a flag para compatibilidade
const initial = checkFirebaseStatus();
export const isFirebaseEnabled = initial.enabled;
export { auth, db };
