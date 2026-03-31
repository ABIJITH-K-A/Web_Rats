import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// Key storage in IndexedDB
const KEY_STORE = 'tnwebrats_keys';

const getDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(KEY_STORE, 1);
  req.onupgradeneeded = (e) => e.target.result.createObjectStore('keys');
  req.onsuccess = (e) => resolve(e.target.result);
  req.onerror = reject;
});

const storePrivateKey = async (uid, key) => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('keys', 'readwrite');
    tx.objectStore('keys').put(key, uid);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
};

const loadPrivateKey = async (uid) => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('keys', 'readonly');
    const req = tx.objectStore('keys').get(uid);
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
};

export const useChatCrypto = (recipientId) => {
  const { user } = useAuth();
  const [keyPair, setKeyPair] = useState(null);
  const [recipientPublicKey, setRecipientPublicKey] = useState(null);
  const [ready, setReady] = useState(false);

  const initKeys = async () => {
    const uid = user.uid;

    // Try loading existing private key from IndexedDB
    let privateKey = await loadPrivateKey(uid);
    let publicKey;

    if (!privateKey) {
      // Generate new keypair for this user
      const pair = await window.crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256' },
        true,
        ['encrypt', 'decrypt']
      );

      // Export and store public key in Firestore
      const exportedPublic = await window.crypto.subtle.exportKey('spki', pair.publicKey);
      const publicKeyB64 = btoa(String.fromCharCode(...new Uint8Array(exportedPublic)));

      await setDoc(doc(db, 'users', uid), { publicKey: publicKeyB64 }, { merge: true });
      await storePrivateKey(uid, pair.privateKey);

      privateKey = pair.privateKey;
      publicKey = pair.publicKey;
    } else {
      // Load public key from Firestore
      const userSnap = await getDoc(doc(db, 'users', uid));
      const publicKeyB64 = userSnap.data()?.publicKey;
      if (publicKeyB64) {
        const binary = Uint8Array.from(atob(publicKeyB64), c => c.charCodeAt(0));
        publicKey = await window.crypto.subtle.importKey(
          'spki', binary, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']
        );
      }
    }

    setKeyPair({ privateKey, publicKey });

    // Load recipient public key
    const recipientSnap = await getDoc(doc(db, 'users', recipientId));
    const recipientKeyB64 = recipientSnap.data()?.publicKey;
    if (recipientKeyB64) {
      const binary = Uint8Array.from(atob(recipientKeyB64), c => c.charCodeAt(0));
      const recipKey = await window.crypto.subtle.importKey(
        'spki', binary, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']
      );
      setRecipientPublicKey(recipKey);
    }

    setReady(true);
  };

  useEffect(() => {
    if (!user?.uid || !recipientId) return;
    initKeys();
  }, [user?.uid, recipientId]);

  const encryptMessage = async (text) => {
    if (!recipientPublicKey || !keyPair?.publicKey) return null;

    // Generate random AES key for this message
    const aesKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    // Encrypt message with AES
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, aesKey, encoded
    );

    // Export AES key
    const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

    // Encrypt AES key for recipient AND sender (so both can read)
    const encryptedKeyForRecipient = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' }, recipientPublicKey, rawAesKey
    );
    const encryptedKeyForSender = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' }, keyPair.publicKey, rawAesKey
    );

    return {
      senderId: user.uid,
      senderRole: user.role || 'client',
      encryptedContent: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
      encryptedKeyForRecipient: btoa(String.fromCharCode(...new Uint8Array(encryptedKeyForRecipient))),
      encryptedKeyForSender: btoa(String.fromCharCode(...new Uint8Array(encryptedKeyForSender))),
      iv: btoa(String.fromCharCode(...iv)),
    };
  };

  const decryptMessage = async (data) => {
    if (!keyPair?.privateKey) return null;

    const isSender = data.senderId === user.uid;
    const encryptedKeyB64 = isSender
      ? data.encryptedKeyForSender
      : data.encryptedKeyForRecipient;

    if (!encryptedKeyB64) return '[Unable to decrypt]';

    try {
      // Decrypt AES key using own private key
      const encryptedKeyBytes = Uint8Array.from(atob(encryptedKeyB64), c => c.charCodeAt(0));
      const rawAesKey = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' }, keyPair.privateKey, encryptedKeyBytes
      );

      // Import AES key
      const aesKey = await window.crypto.subtle.importKey(
        'raw', rawAesKey, { name: 'AES-GCM' }, false, ['decrypt']
      );

      // Decrypt message
      const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0));
      const encryptedContent = Uint8Array.from(atob(data.encryptedContent), c => c.charCodeAt(0));
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, aesKey, encryptedContent
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      return '[Encrypted message]';
    }
  };

  return { encryptMessage, decryptMessage, ready };
};

export default useChatCrypto;
