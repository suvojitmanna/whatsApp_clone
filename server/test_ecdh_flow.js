const { subtle } = require('crypto').webcrypto;

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function base64ToArrayBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

async function testECDH() {
  // Generate keypair 1
  const kp1 = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  // Generate keypair 2
  const kp2 = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // Export public keys as JWK
  const pk1Jwk = await subtle.exportKey('jwk', kp1.publicKey);
  const pk2Jwk = await subtle.exportKey('jwk', kp2.publicKey);

  // User 1 imports user 2's public key
  const importedPk2 = await subtle.importKey('jwk', pk2Jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  // User 1 derives AES-GCM key
  const aesKey1 = await subtle.deriveKey(
    { name: 'ECDH', public: importedPk2 },
    kp1.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // User 1 encrypts "hi"
  const iv = Buffer.from('123456789012'); // 12 bytes
  const plainText = 'hi';
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey1,
    Buffer.from(plainText)
  );
  const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);
  const ivBase64 = arrayBufferToBase64(iv);
  console.log('Encrypted:', { ciphertextBase64, ivBase64 });

  // User 2 imports user 1's public key
  const importedPk1 = await subtle.importKey('jwk', pk1Jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  // User 2 derives AES-GCM key
  const aesKey2 = await subtle.deriveKey(
    { name: 'ECDH', public: importedPk1 },
    kp2.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // User 2 decrypts
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(ivBase64) },
    aesKey2,
    base64ToArrayBuffer(ciphertextBase64)
  );
  const decryptedText = Buffer.from(decryptedBuffer).toString('utf-8');
  console.log('Decrypted successfully:', decryptedText);
}

testECDH().catch(console.error);
