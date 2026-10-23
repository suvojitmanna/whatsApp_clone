import { webcrypto } from "crypto";
const { subtle } = webcrypto;

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function base64ToArrayBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

async function testECDH() {
  const kp1 = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
  const kp2 = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const pk1Jwk = await subtle.exportKey('jwk', kp1.publicKey);
  const pk2Jwk = await subtle.exportKey('jwk', kp2.publicKey);

  const importedPk2 = await subtle.importKey('jwk', pk2Jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  const aesKey1 = await subtle.deriveKey(
    { name: 'ECDH', public: importedPk2 },
    kp1.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = Buffer.from('123456789012');
  const plainText = 'hi';
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey1,
    Buffer.from(plainText)
  );
  const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);
  const ivBase64 = arrayBufferToBase64(iv);
  console.log('Encrypted:', { ciphertextBase64, ivBase64 });

  const importedPk1 = await subtle.importKey('jwk', pk1Jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  const aesKey2 = await subtle.deriveKey(
    { name: 'ECDH', public: importedPk1 },
    kp2.privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(ivBase64) },
    aesKey2,
    base64ToArrayBuffer(ciphertextBase64)
  );
  const decryptedText = Buffer.from(decryptedBuffer).toString('utf-8');
  console.log('Decrypted successfully:', decryptedText);
}

testECDH().catch(console.error);
