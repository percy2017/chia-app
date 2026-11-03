const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** base64 (sin dependencias) -> bytes. Ignora saltos de linea y relleno. */
export function decodeBase64(value: string): Uint8Array {
  const out = new Uint8Array(Math.floor((value.length * 3) / 4) + 3);
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === '=') {
      break;
    }
    const sextet = ALPHABET.indexOf(char);
    if (sextet < 0) {
      continue;
    }
    buffer = (buffer << 6) | sextet;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index] = (buffer >> bits) & 0xff;
      index += 1;
      buffer &= (1 << bits) - 1;
    }
  }
  return out.subarray(0, index);
}

export function encodeBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += ALPHABET[(triple >> 18) & 63];
    out += ALPHABET[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? ALPHABET[(triple >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? ALPHABET[triple & 63] : '=';
  }
  return out;
}

/** float32 little-endian en base64 (lo que devuelve /embed) -> vector. */
export function decodeVector(base64: string): Float32Array {
  const bytes = decodeBase64(base64);
  const count = bytes.byteLength >> 2;
  const vector = new Float32Array(count);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < count; i += 1) {
    vector[i] = view.getFloat32(i * 4, true);
  }
  return vector;
}

/** Coseno = producto punto: los vectores de nomic ya vienen normalizados. */
export function dot(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  let total = 0;
  for (let i = 0; i < length; i += 1) {
    total += a[i] * b[i];
  }
  return total;
}
