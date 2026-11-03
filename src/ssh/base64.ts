const ALPHABET
  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8Bytes(value: string): number[] {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    let code = value.charCodeAt(index);
    if (code >= 0xD800 && code <= 0xDBFF && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        code = ((code - 0xD800) << 10) + (next - 0xDC00) + 0x10000;
        index += 1;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    }
    else if (code < 0x800) {
      bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
    }
    else if (code < 0x10000) {
      bytes.push(
        0xE0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3F),
        0x80 | (code & 0x3F),
      );
    }
    else {
      bytes.push(
        0xF0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3F),
        0x80 | ((code >> 6) & 0x3F),
        0x80 | (code & 0x3F),
      );
    }
  }
  return bytes;
}

export function base64EncodeUtf8(value: string): string {
  const bytes = utf8Bytes(value);
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;
    output += ALPHABET[(chunk >> 18) & 0x3F];
    output += ALPHABET[(chunk >> 12) & 0x3F];
    output += index + 1 < bytes.length
      ? ALPHABET[(chunk >> 6) & 0x3F]
      : '=';
    output += index + 2 < bytes.length ? ALPHABET[chunk & 0x3F] : '=';
  }
  return output;
}

const SEXTETS: Record<string, number> = {};
for (let index = 0; index < ALPHABET.length; index += 1) {
  SEXTETS[ALPHABET[index]] = index;
}

/** Bytes crudos de un base64 (sin padding/espacios, tolerante a saltos). */
export function base64DecodeBytes(value: string): number[] {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let index = 0; index < value.length; index += 1) {
    const sextet = SEXTETS[value[index]];
    if (sextet === undefined) {
      continue; // '=', '\n', '\r' o basura: se ignora
    }
    buffer = (buffer << 6) | sextet;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xFF);
    }
  }
  return bytes;
}

/**
 * Texto UTF-8 de un base64 (lo que devuelve `readFile` de SFTP).
 * Los bytes invalidos se sustituyen por U+FFFD en vez de romper la edicion.
 */
export function base64DecodeUtf8(value: string): string {
  const bytes = base64DecodeBytes(value);
  let output = '';
  let index = 0;
  while (index < bytes.length) {
    const first = bytes[index];
    let code = 0xFFFD;
    let size = 1;
    if (first < 0x80) {
      code = first;
    }
    else if ((first & 0xE0) === 0xC0) {
      code = first & 0x1F;
      size = 2;
    }
    else if ((first & 0xF0) === 0xE0) {
      code = first & 0x0F;
      size = 3;
    }
    else if ((first & 0xF8) === 0xF0) {
      code = first & 0x07;
      size = 4;
    }
    if (size > 1) {
      let valid = index + size <= bytes.length;
      for (let offset = 1; valid && offset < size; offset += 1) {
        const next = bytes[index + offset];
        if ((next & 0xC0) !== 0x80) {
          valid = false;
        }
        else {
          code = (code << 6) | (next & 0x3F);
        }
      }
      if (!valid) {
        code = 0xFFFD;
        size = 1;
      }
    }
    output += String.fromCodePoint(code);
    index += size;
  }
  return output;
}
