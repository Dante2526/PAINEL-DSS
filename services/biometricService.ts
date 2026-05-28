/**
 * Serviço de Autenticação Biométrica Local (WebAuthn)
 * Permite que administradores registrem e utilizem a digital do celular
 * para login rápido e seguro no Painel DSS.
 */

// Chaves usadas para o armazenamento local das credenciais biométricas
const KEYS = {
  EMAIL: 'dss_bio_email',
  CRED_ID: 'dss_bio_cred_id',
  REGISTERED: 'dss_bio_registered'
};

/**
 * Verifica se a biometria nativa está disponível e ativa no dispositivo.
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    // 1. Verifica se o navegador suporta WebAuthn
    if (!window.PublicKeyCredential) return false;

    // 2. Verifica se o dispositivo tem suporte a biometria local (TouchID/FaceID/Digital)
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return isAvailable;
  } catch (error) {
    console.error("Erro ao verificar biometria:", error);
    return false;
  }
};

/**
 * Verifica se o usuário atual é considerado um dispositivo celular
 * com biometria ativa (excluindo PCs e Tablets grandes).
 */
export const isMobileCellularWithBiometrics = async (): Promise<boolean> => {
  // Toque na tela (touch device)
  const isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  // Tamanho típico de celular (largura de tela menor que 768px - iPads/Tablets são >= 768px)
  const isCellularWidth = window.innerWidth < 768;
  
  if (!isTouchDevice || !isCellularWidth) return false;

  const hasBiometrics = await isBiometricAvailable();
  return hasBiometrics;
};

/**
 * Verifica se o dispositivo já possui biometria registrada e configurada.
 */
export const hasRegisteredBiometrics = (): boolean => {
  const registered = localStorage.getItem(KEYS.REGISTERED) === 'true';
  const email = localStorage.getItem(KEYS.EMAIL);
  const credId = localStorage.getItem(KEYS.CRED_ID);
  return registered && !!email && !!credId;
};


/**
 * Desativa e limpa as credenciais biométricas deste dispositivo.
 */
export const clearBiometricData = () => {
  localStorage.removeItem(KEYS.EMAIL);
  localStorage.removeItem(KEYS.CRED_ID);
  localStorage.removeItem(KEYS.REGISTERED);
};

/**
 * Solicita ao celular a impressão digital para registrar a biometria do administrador.
 */
export const registerBiometricAdmin = async (email: string): Promise<boolean> => {
  try {
    // Gerar um desafio criptográfico aleatório
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    // Gerar um ID de usuário aleatório
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Painel DSS",
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: email,
        displayName: email
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "required",
        requireResidentKey: true
      },
      timeout: 60000,
      attestation: "none"
    };

    const credential = await navigator.credentials.create({
      publicKey: creationOptions
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error("O celular não gerou a credencial biométrica.");
    }

    // Converter o ID bruto do credential para string base64 para armazenar no localStorage
    const rawId = credential.rawId;
    const base64Id = btoa(String.fromCharCode(...new Uint8Array(rawId)));

    // Grava as informações locais com segurança para logins futuros
    localStorage.setItem(KEYS.EMAIL, email);
    localStorage.setItem(KEYS.CRED_ID, base64Id);
    localStorage.setItem(KEYS.REGISTERED, 'true');

    return true;
  } catch (error) {
    console.error("Falha ao registrar biometria:", error);
    throw error;
  }
};

/**
 * Solicita a biometria nativa do celular e retorna o e-mail do administrador autenticado.
 */
export const authenticateBiometricAdmin = async (): Promise<string> => {
  try {
    const email = localStorage.getItem(KEYS.EMAIL);
    const base64Id = localStorage.getItem(KEYS.CRED_ID);
    const isRegistered = localStorage.getItem(KEYS.REGISTERED) === 'true';

    if (!isRegistered || !email || !base64Id) {
      throw new Error("Nenhuma biometria cadastrada neste aparelho.");
    }

    // Reconverter a credencial em base64 de volta para ArrayBuffer / Uint8Array
    const rawId = new Uint8Array(
      atob(base64Id)
        .split("")
        .map(c => c.charCodeAt(0))
    );

    // Desafio de validação temporário
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: rawId,
          type: "public-key"
        }
      ],
      timeout: 60000,
      userVerification: "required"
    };

    const assertion = await navigator.credentials.get({
      publicKey: requestOptions
    });

    if (!assertion) {
      throw new Error("Autenticação biométrica falhou no celular.");
    }

    // Retorna o e-mail do administrador autenticado
    return email;
  } catch (error) {
    console.error("Falha ao autenticar biometria:", error);
    throw error;
  }
};
