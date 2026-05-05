// Conexão secundária ao Firebase do projeto Lumina
// As variáveis de ambiente devem ser definidas na Vercel com sufixo _LUMINA
import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const env = (import.meta as any).env;

const luminaFirebaseConfig = {
    apiKey: env?.VITE_FIREBASE_API_KEY_LUMINA,
    authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN_LUMINA,
    projectId: env?.VITE_FIREBASE_PROJECT_ID_LUMINA,
    storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET_LUMINA,
    messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID_LUMINA,
    appId: env?.VITE_FIREBASE_APP_ID_LUMINA,
};

let luminaDb: Firestore | null = null;

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

        // Autenticar anonimamente para poder ler/escrever nas regras do Lumina
        const luminaAuth = getAuth(luminaApp);
        signInAnonymously(luminaAuth).catch(e => console.warn('[Lumina] Autenticação anônima falhou:', e));
    } catch (e) {
        console.error('[Lumina] Erro ao inicializar Firebase do Lumina:', e);
        luminaDb = null;
    }
}

export { luminaDb, isLuminaConfigured };
