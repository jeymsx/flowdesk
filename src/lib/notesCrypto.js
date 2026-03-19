/**
 * Client-side AES-GCM encryption for notes.
 *
 * A 256-bit key is generated once per user and stored in localStorage.
 * The key never leaves the device — Supabase only ever stores ciphertext.
 *
 * Encrypted values are prefixed with "enc:" so legacy plaintext notes
 * (stored before encryption was added) are displayed as-is without error.
 */

const ALGO = { name: 'AES-GCM', length: 256 };

function storageKey(userId) {
  return `fd_nk_${userId}`;
}

async function getOrCreateKey(userId) {
  const stored = localStorage.getItem(storageKey(userId));
  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, ALGO, true, ['encrypt', 'decrypt']);
  }
  const key = await crypto.subtle.generateKey(ALGO, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('raw', key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(storageKey(userId), b64);
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
    return value; // if key changed or data corrupted, show raw rather than crash
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function encryptNote(userId, { title, content, tags }) {
  const key = await getOrCreateKey(userId);
  const [encTitle, encContent] = await Promise.all([
    encryptField(key, title),
    encryptField(key, content),
  ]);
  // Encrypt tags as a JSON string, stored as single-element array
  const encTags = tags?.length
    ? [await encryptField(key, JSON.stringify(tags))]
    : [];
  return { title: encTitle, content: encContent, tags: encTags };
}

export async function decryptNote(userId, note) {
  const key = await getOrCreateKey(userId);
  const [title, content] = await Promise.all([
    decryptField(key, note.title),
    decryptField(key, note.content),
  ]);
  // Decrypt tags: if single encrypted element, parse back to array
  let tags = note.tags || [];
  if (tags.length === 1 && tags[0]?.startsWith('enc:')) {
    try {
      const raw = await decryptField(key, tags[0]);
      tags = JSON.parse(raw);
    } catch {
      tags = [];
    }
  }
  return { ...note, title, content, tags };
}

export async function decryptNotes(userId, notes) {
  return Promise.all(notes.map((n) => decryptNote(userId, n)));
}
