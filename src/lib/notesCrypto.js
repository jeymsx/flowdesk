/**
 * Client-side AES-GCM encryption for notes.
 *
 * The encryption key is derived from the user's ID via PBKDF2.
 * Nothing is stored — the same userId always produces the same key,
 * so notes are readable on any device the user logs into.
 *
 * Encrypted values are prefixed with "enc:" so legacy plaintext notes
 * are displayed as-is without error.
 */

const ALGO = { name: 'AES-GCM', length: 256 };

// Cache derived keys in memory for the session (PBKDF2 is intentionally slow)
const keyCache = new Map();

async function deriveKey(userId) {
  if (keyCache.has(userId)) return keyCache.get(userId);

  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Fixed app-level salt — combined with the userId this makes the key
  // unique per user and non-trivial to reverse without knowing both values
  const salt = encoder.encode('flowdesk-notes-encryption-v1');

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    ALGO,
    false, // not extractable — key stays inside the browser's crypto engine
    ['encrypt', 'decrypt']
  );

  keyCache.set(userId, key);
  return key;
}

async function encryptField(key, text) {
  if (!text) return text;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(12 + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), 12);
  return 'enc:' + btoa(String.fromCharCode(...combined));
}

async function decryptField(key, value) {
  if (!value || !value.startsWith('enc:')) return value; // legacy plaintext fallback
  try {
    const combined = Uint8Array.from(atob(value.slice(4)), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    return value; // if data is corrupted, show raw rather than crash
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function encryptNote(userId, { title, content, tags }) {
  const key = await deriveKey(userId);
  const [encTitle, encContent] = await Promise.all([
    encryptField(key, title),
    encryptField(key, content),
  ]);
  // Encrypt tags as a JSON string stored as a single-element array
  const encTags = tags?.length
    ? [await encryptField(key, JSON.stringify(tags))]
    : [];
  return { title: encTitle, content: encContent, tags: encTags };
}

export async function decryptNote(userId, note) {
  const key = await deriveKey(userId);
  const [title, content] = await Promise.all([
    decryptField(key, note.title),
    decryptField(key, note.content),
  ]);
  let tags = note.tags || [];
  if (tags.length === 1 && tags[0]?.startsWith('enc:')) {
    try {
      tags = JSON.parse(await decryptField(key, tags[0]));
    } catch {
      tags = [];
    }
  }
  return { ...note, title, content, tags };
}

export async function decryptNotes(userId, notes) {
  return Promise.all(notes.map((n) => decryptNote(userId, n)));
}
