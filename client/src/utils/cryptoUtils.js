const derivedKeyCache = new Map();
const keyPairMemoryCache = new Map();

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function isCryptoSupported() {
  return (
    typeof window !== "undefined" &&
    window.crypto &&
    Boolean(window.crypto.subtle)
  );
}

export async function getOrCreateUserKeyPair(userId) {
  if (!isCryptoSupported() || !userId) return null;

  if (keyPairMemoryCache.has(userId)) {
    return keyPairMemoryCache.get(userId);
  }

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

      const result = {
        privateKey,
        publicKey,
        publicKeyJwk: pkJwk,
        publicKeyStr: storedPk,
      };
      keyPairMemoryCache.set(userId, result);
      return result;
    }
  } catch (error) {
    console.warn("Error reading stored E2EE keys, generating new ones:", error);
  }

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

    const result = {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      publicKeyJwk: pkJwk,
      publicKeyStr,
    };
    keyPairMemoryCache.set(userId, result);
    return result;
  } catch (err) {
    console.error("Failed to generate E2EE key pair:", err);
    return null;
  }
}

export async function getSharedAesKey(peerUserId, peerPublicKeyStr, myUserId) {
  if (!isCryptoSupported() || !peerPublicKeyStr || !peerUserId || !myUserId) {
    return null;
  }

  const peerKeyStr =
    typeof peerPublicKeyStr === "string"
      ? peerPublicKeyStr
      : JSON.stringify(peerPublicKeyStr);

  const cacheKey = `${myUserId}_${peerUserId}_${peerKeyStr}`;
  if (derivedKeyCache.has(cacheKey)) {
    return derivedKeyCache.get(cacheKey);
  }

  try {
    const myKeys = await getOrCreateUserKeyPair(myUserId);
    if (!myKeys?.privateKey) return null;

    const peerJwk =
      typeof peerPublicKeyStr === "object" && peerPublicKeyStr !== null
        ? peerPublicKeyStr
        : JSON.parse(peerKeyStr);

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

export function clearSharedKeyCache(userId = null) {
  if (!userId) {
    derivedKeyCache.clear();
    return;
  }
  const strId = String(userId);
  for (const key of derivedKeyCache.keys()) {
    if (key.includes(strId)) {
      derivedKeyCache.delete(key);
    }
  }
}

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
    console.warn("AES-GCM decryption failed (key or IV mismatch):", error);
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

export async function ensureUserKeysSynced(user, axiosInstance) {
  if (!user?._id || !isCryptoSupported()) return;

  try {
    const keys = await getOrCreateUserKeyPair(user._id);
    if (!keys?.publicKeyStr) return;

    await axiosInstance.put("/auth/update-public-key", {
      publicKey: keys.publicKeyStr,
    });
    user.publicKey = keys.publicKeyStr;
  } catch (error) {
    console.warn("Failed to sync E2EE public key with server:", error);
  }
}

export async function batchDecryptMessages(
  messages,
  currentUserId,
  peerUserId,
  peerPublicKeyStr,
  getStore = null,
) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  // Pre-derive a shared key if peer info is provided
  let defaultSharedKey = null;
  if (peerUserId && peerPublicKeyStr && currentUserId) {
    try {
      defaultSharedKey = await getSharedAesKey(
        peerUserId,
        peerPublicKeyStr,
        currentUserId,
      );
    } catch (e) {
      console.warn("Shared key batch derivation failed:", e);
    }
  }

  return Promise.all(
    messages.map(async (msg) => {
      if (
        !msg ||
        !msg.isEncrypted ||
        !msg.content ||
        !msg.iv ||
        msg._isDecrypted
      ) {
        return msg;
      }

      // Try with default shared key first
      if (defaultSharedKey) {
        try {
          const decrypted = await decryptText(msg.content, msg.iv, defaultSharedKey);
          if (decrypted !== null) {
            return {
              ...msg,
              content: decrypted,
              _isDecrypted: true,
            };
          }
        } catch (e) {}
      }

      // If default key wasn't available or failed, resolve keys per message
      const sId = (msg.sender?._id || msg.sender)?.toString();
      const rId = (msg.receiver?._id || msg.receiver)?.toString();
      const myId = currentUserId?.toString();
      const isSentByMe = sId === myId;

      const targetPeerId = isSentByMe ? rId : sId || peerUserId;
      let targetPubKey = isSentByMe
        ? msg.receiver?.publicKey || peerPublicKeyStr
        : msg.sender?.publicKey || peerPublicKeyStr;

      if (!targetPubKey && targetPeerId && getStore) {
        const userList = getStore()?.users || [];
        const found = userList.find((u) => u._id?.toString() === targetPeerId);
        if (found?.publicKey) {
          targetPubKey = found.publicKey;
        }
      }

      if (targetPeerId && targetPubKey && myId) {
        try {
          const perMsgKey = await getSharedAesKey(
            targetPeerId,
            targetPubKey,
            myId,
          );
          if (perMsgKey) {
            const decrypted = await decryptText(msg.content, msg.iv, perMsgKey);
            if (decrypted !== null) {
              return {
                ...msg,
                content: decrypted,
                _isDecrypted: true,
              };
            }
          }
        } catch (e) {
          console.warn("Failed per-message batch decryption:", e);
        }
      }

      return msg;
    }),
  );
}
