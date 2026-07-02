import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Aplica las reglas de marcación nacional de cada país (quitar el 0 inicial
// en Venezuela, insertar el 9 móvil y quitar el 15 en Argentina, etc.) y
// devuelve el número en formato E.164 listo para Firebase Phone Auth.
export function normalizePhone(phone, iso) {
  const parsed = phone ? parsePhoneNumberFromString(phone, iso) : null;
  const isValid = !!parsed?.isValid();
  return { isValid, e164: isValid ? parsed.number : null };
}
