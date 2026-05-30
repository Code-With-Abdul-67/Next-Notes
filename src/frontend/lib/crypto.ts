/**
 * AES-256-GCM encryption utilities using the Web Crypto API.
 * Key derivation: PBKDF2 with SHA-256, 100,000 iterations.
 *
 * Encrypted payload format (all concatenated, then base64-encoded):
 *   [16 bytes salt][12 bytes IV][N bytes ciphertext]
 *
 * This is entirely client-side — the vault password never leaves the browser
 * for encryption/decryption purposes.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12;   // bytes — standard for AES-GCM

/** Derive an AES-256-GCM CryptoKey from a password + salt using PBKDF2. */
async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Convert a Uint8Array to a base64 string. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert a base64 string to a Uint8Array<ArrayBuffer>. */
function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns a base64-encoded string containing salt + IV + ciphertext.
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH)) as Uint8Array<ArrayBuffer>;
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as Uint8Array<ArrayBuffer>;
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  // Concatenate: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return toBase64(combined);
}

/**
 * Decrypt a base64-encoded AES-256-GCM payload.
 * Returns the original plaintext string, or throws on wrong password / tampered data.
 */
export async function decrypt(encryptedBase64: string, password: string): Promise<string> {
  const combined = fromBase64(encryptedBase64);

  const salt = combined.slice(0, SALT_LENGTH) as Uint8Array<ArrayBuffer>;
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH) as Uint8Array<ArrayBuffer>;
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH) as Uint8Array<ArrayBuffer>;

  const key = await deriveKey(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Encrypt both title and content of a note into a single JSON payload.
 * Returns the base64-encoded encrypted string.
 */
export async function encryptNote(
  title: string,
  content: string,
  password: string
): Promise<string> {
  const payload = JSON.stringify({ title, content });
  return encrypt(payload, password);
}

/**
 * Decrypt a note payload back into title and content.
 * Throws if the password is wrong or data is corrupted.
 */
export async function decryptNote(
  encryptedData: string,
  password: string
): Promise<{ title: string; content: string }> {
  const payload = await decrypt(encryptedData, password);
  return JSON.parse(payload) as { title: string; content: string };
}
