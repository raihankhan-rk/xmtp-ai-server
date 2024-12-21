import { webcrypto } from 'crypto';

// Server-side encryption key (will be derived from a shared secret)
let encryptionKey;

// Initialize encryption with a fixed key for demo purposes
// In production, this should be securely managed and rotated
const ENCRYPTION_KEY = 'YOUR-32-BYTE-SECRET-KEY-HERE12345';

async function initializeEncryption() {
    try {
        // Convert the secret to a crypto key
        const keyMaterial = await webcrypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(ENCRYPTION_KEY),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        // Derive the actual encryption key
        encryptionKey = await webcrypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode("xmtp-salt"),
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    } catch (error) {
        console.error('Encryption initialization error:', error);
        throw new Error('Failed to initialize encryption');
    }
}

function arrayBufferToBase64(buffer) {
    return Buffer.from(buffer).toString('base64');
}

function base64ToArrayBuffer(base64) {
    const buffer = Buffer.from(base64, 'base64');
    return buffer;
}

async function encryptResponse(message, clientIV) {
    try {
        const encoder = new TextEncoder();
        const encodedMessage = encoder.encode(message);
        const iv = base64ToArrayBuffer(clientIV);

        const encryptedData = await webcrypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv
            },
            encryptionKey,
            encodedMessage
        );

        return arrayBufferToBase64(encryptedData);
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt response');
    }
}

async function decryptMessage(encryptedMessage, iv) {
    try {
        const encryptedBuffer = base64ToArrayBuffer(encryptedMessage);
        const ivBuffer = base64ToArrayBuffer(iv);

        const decryptedData = await webcrypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: ivBuffer
            },
            encryptionKey,
            encryptedBuffer
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt message');
    }
}

// Initialize encryption on module load
await initializeEncryption();

export {
    encryptResponse,
    decryptMessage,
    ENCRYPTION_KEY  // Export for client use
}; 