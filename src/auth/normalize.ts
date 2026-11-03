export type FieldResult = { value: string; error: string };

const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

function stripApiPath(value: string): string {
  return value.replace(/\/+api\/app(?:\/[^?#]*)?$/i, '');
}
export function normalizeBaseUrl(input: string): FieldResult {
  const raw = input.trim();
  if (!raw) {
    return { value: '', error: 'Falta la URL del servidor.' };
  }
  let value = raw.replace(/\s+/g, '');
  if (!SCHEME.test(value)) {
    value = `https://${value.replace(/^\/+/, '')}`;
  }
  value = stripApiPath(value).replace(/\/+$/, '');
  if (!/^https?:\/\/[^/?#\s]+/i.test(value)) {
    return { value, error: 'URL invalida: usa https://dominio o https://dominio/ruta' };
  }
  return { value, error: '' };
}

/** Un `value` vacio es valido: el correo es opcional. */
export function normalizeEmail(input: string): FieldResult {
  const value = input.trim();
  if (!value) {
    return { value: '', error: '' };
  }
  if (value.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return { value, error: 'Correo invalido.' };
  }
  return { value, error: '' };
}
export function normalizePhone(input: string): FieldResult {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (!digits) {
    return { value: '', error: 'Falta el telefono.' };
  }
  if (digits.length < 8) {
    return { value: digits, error: 'Telefono incompleto: incluye el codigo de pais (ej. 59168964000).' };
  }
  if (digits.length > 15) {
    return { value: digits, error: 'Telefono demasiado largo: maximo 15 digitos.' };
  }
  if (digits.startsWith('0')) {
    return { value: digits, error: 'Quita el 0 inicial y escribe el codigo de pais (591...).' };
  }
  return { value: digits, error: '' };
}

export function normalizeName(input: string): FieldResult {
  const value = input.replace(/\s+/g, ' ').trim();
  if (!value) {
    return { value: '', error: 'Falta el nombre.' };
  }
  if (value.length < 3) {
    return { value, error: 'Nombre demasiado corto.' };
  }
  return { value, error: '' };
}

export function normalizePin(input: string): FieldResult {
  const value = input.replace(/\D/g, '').slice(0, 4);
  if (value.length !== 4) {
    return { value, error: 'El PIN tiene 4 digitos.' };
  }
  return { value, error: '' };
}

export function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
