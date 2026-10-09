const derivedKeyCache = new Map();
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert base64 string to Uint8Array
export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Check if Web Crypto API is supported
export function isCryptoSupported() {
  return (
    typeof window !== "undefined" &&
    window.crypto &&
    Boolean(window.crypto.subtle)
  );
}

export async function getOrCreateUserKeyPair(userId) {
  if (!isCryptoSupported() || !userId) return null;

  const skStorageKey = `e2ee_sk_${userId}`;
  const pkStorageKey = `e2ee_pk_${userId}`;

  try {
    const storedSk = localStorage.getItem(skStorageKey);
    const storedPk = localStorage.getItem(pkStorageKey);

    if (storedSk && storedPk) {
      const skJwk = JSON.parse(storedSk);
      const pkJwk = JSON.parse(storedPk);

      const privateKey = await window.crypto.subtle.importKey(
        "jwk",
        skJwk,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"],
      );

      const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        pkJwk,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        [],
      );

      return {
        privateKey,
        publicKey,
        publicKeyJwk: pkJwk,
        publicKeyStr: storedPk,
      };
    }
  } catch (error) {
    console.warn("Error reading stored E2EE keys, generating new ones:", error);
  }

  // Generate new ECDH P-256 keypair
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"],
    );

    const skJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey,
    );
    const pkJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey,
    );

    const publicKeyStr = JSON.stringify(pkJwk);
    localStorage.setItem(skStorageKey, JSON.stringify(skJwk));
    localStorage.setItem(pkStorageKey, publicKeyStr);

    return {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      publicKeyJwk: pkJwk,
      publicKeyStr,
    };
  } catch (err) {
    console.error("Failed to generate E2EE key pair:", err);
    return null;
  }
}

export async function getSharedAesKey(peerUserId, peerPublicKeyStr, myUserId) {
  if (!isCryptoSupported() || !peerPublicKeyStr || !peerUserId || !myUserId) {
    return null;
  }

  const cacheKey = `${myUserId}_${peerUserId}_${peerPublicKeyStr.slice(0, 32)}`;
  if (derivedKeyCache.has(cacheKey)) {
    return derivedKeyCache.get(cacheKey);
  }

  try {
    const myKeys = await getOrCreateUserKeyPair(myUserId);
    if (!myKeys?.privateKey) return null;

    const peerJwk =
      typeof peerPublicKeyStr === "string"
        ? JSON.parse(peerPublicKeyStr)
        : peerPublicKeyStr;

    const importedPeerPublicKey = await window.crypto.subtle.importKey(
      "jwk",
      peerJwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      [],
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: importedPeerPublicKey,
      },
      myKeys.privateKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"],
    );

    derivedKeyCache.set(cacheKey, aesKey);
    return aesKey;
  } catch (error) {
    console.error("Error deriving shared ECDH AES key:", error);
    return null;
  }
}

export async function encryptText(plainText, sharedAesKey) {
  if (!isCryptoSupported() || !sharedAesKey) return null;

  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedAesKey,
      encoded,
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error("Error encrypting text:", error);
    return null;
  }
}

// Decrypt ciphertext base64 string using AES-256-GCM
export async function decryptText(ciphertextBase64, ivBase64, sharedAesKey) {
  if (!isCryptoSupported() || !sharedAesKey || !ciphertextBase64 || !ivBase64) {
    return null;
  }

  try {
    const ciphertextBytes = base64ToArrayBuffer(ciphertextBase64);
    const ivBytes = base64ToArrayBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      sharedAesKey,
      ciphertextBytes,
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    return null;
  }
}

export async function generateSafetyNumber(myPubKeyStr, peerPubKeyStr) {
  if (!isCryptoSupported() || !myPubKeyStr || !peerPubKeyStr) {
    return {
      blocks: Array(12).fill("00000"),
      fullNumber: "00000 ".repeat(12).trim(),
    };
  }

  try {
    const sorted = [myPubKeyStr, peerPubKeyStr].sort().join(":::");
    const hashBuffer = await window.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(sorted),
    );
    const hashBytes = new Uint8Array(hashBuffer);
    const blocks = [];
    for (let i = 0; i < 12; i++) {
      const byte1 = hashBytes[(i * 2) % hashBytes.length];
      const byte2 = hashBytes[(i * 2 + 1) % hashBytes.length];
      const num = ((byte1 << 8) | byte2) % 100000;
      blocks.push(num.toString().padStart(5, "0"));
    }

    return {
      blocks,
      fullNumber: blocks.join(" "),
    };
  } catch (error) {
    console.error("Error generating safety number:", error);
    return {
      blocks: Array(12).fill("00000"),
      fullNumber: "00000 ".repeat(12).trim(),
    };
  }
}

// Ensure user's E2EE keys are created locally and synced with the backend server
export async function ensureUserKeysSynced(user, axiosInstance) {
  if (!user?._id || !isCryptoSupported()) return;

  try {
    const keys = await getOrCreateUserKeyPair(user._id);
    if (!keys?.publicKeyStr) return;

    if (!user.publicKey || user.publicKey !== keys.publicKeyStr) {
      await axiosInstance.put("/auth/update-public-key", {
        publicKey: keys.publicKeyStr,
      });
      user.publicKey = keys.publicKeyStr;
    }
  } catch (error) {
    console.warn("Failed to sync E2EE public key with server:", error);
  }
}
