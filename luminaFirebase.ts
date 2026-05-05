// Conexão secundária ao Firebase do projeto Lumina
// As variáveis de ambiente devem ser definidas na Vercel com o prefixo VITE_LUMINA_
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const env = (import.meta as any).env;

const luminaFirebaseConfig = {
    apiKey: env?.VITE_LUMINA_FIREBASE_API_KEY,
    authDomain: env?.VITE_LUMINA_FIREBASE_AUTH_DOMAIN,
    projectId: env?.VITE_LUMINA_FIREBASE_PROJECT_ID,
    storageBucket: env?.VITE_LUMINA_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env?.VITE_LUMINA_FIREBASE_MESSAGING_SENDER_ID,
    appId: env?.VITE_LUMINA_FIREBASE_APP_ID,
};

let luminaDb: Firestore | null = null;
let luminaStorage: FirebaseStorage | null = null;

const isLuminaConfigured = !!luminaFirebaseConfig.apiKey;

if (isLuminaConfigured) {
    try {
        const APP_NAME = 'luminaApp';
        let luminaApp: FirebaseApp;

        const existing = getApps().find(a => a.name === APP_NAME);
        if (existing) {
            luminaApp = existing;
        } else {
            luminaApp = initializeApp(luminaFirebaseConfig, APP_NAME);
        }

        luminaDb = getFirestore(luminaApp);
        luminaStorage = getStorage(luminaApp);

        // Autenticar anonimamente para poder ler/escrever nas regras do Lumina
        const luminaAuth = getAuth(luminaApp);
        signInAnonymously(luminaAuth).catch(e => console.warn('[Lumina] Autenticação anônima falhou:', e));
    } catch (e) {
        console.error('[Lumina] Erro ao inicializar Firebase do Lumina:', e);
        luminaDb = null;
        luminaStorage = null;
    }
}

export { luminaDb, luminaStorage, isLuminaConfigured };
