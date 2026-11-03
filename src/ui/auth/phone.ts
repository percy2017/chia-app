/**
 * Paises para el input de telefono: catalogo, banderas y formato.
 * Todo sale de libphonenumber-js (codigos de marcado) e i18n-iso-countries
 * (nombres en espanol): no hay tabla escrita a mano.
 */
import countries from 'i18n-iso-countries';
import es from 'i18n-iso-countries/langs/es.json';
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';

countries.registerLocale(es);

export type Country = {
  /** ISO2 en mayusculas. */
  code: string;
  name: string;
  dial: string;
  flag: string;
};

/** Bandera emoji a partir del ISO2 (BO -> bandera de Bolivia). */
export function flagOf(code: string): string {
  const iso = code.trim().toUpperCase();
  if (iso.length !== 2) {
    return '🌐';
  }
  return String.fromCodePoint(
    ...iso.split('').map(char => 0x1f1e6 + char.charCodeAt(0) - 65),
  );
}

let cached: Country[] | null = null;

/** Catalogo de paises ordenado por nombre en espanol. */
export function allCountries(): Country[] {
  if (!cached) {
    cached = getCountries()
      .filter(code => !code.startsWith('001'))
      .map(code => ({
        code,
        name: countries.getName(code, 'es') || code,
        dial: getCountryCallingCode(code),
        flag: flagOf(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }
  return cached;
}

export function findCountry(code: string): Country | undefined {
  const iso = code.trim().toUpperCase();
  return allCountries().find(item => item.code === iso);
}

/** Pais deducido de un telefono ya escrito (el prefijo mas largo que coincida). */
export function guessCountry(phone: string): Country | undefined {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return undefined;
  }
  return allCountries()
    .filter(item => digits.startsWith(item.dial))
    .sort((a, b) => b.dial.length - a.dial.length)[0];
}

/** Numero nacional a partir del telefono completo guardado. */
export function nationalOf(phone: string, country: Country): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith(country.dial) ? digits.slice(country.dial.length) : digits;
}

/** Agrupa el numero nacional como lo haria el teclado telefonico. */
export function formatNational(code: string, digits: string): string {
  if (!digits) {
    return '';
  }
  return new AsYouType(code.toUpperCase() as never).input(digits);
}

/** Valido segun libphonenumber para ese pais (no reemplaza a normalizePhone). */
export function isValidFor(phone: string): boolean {
  const parsed = parsePhoneNumberFromString(phone.startsWith('+') ? phone : `+${phone}`);
  return parsed?.isValid() ?? false;
}
