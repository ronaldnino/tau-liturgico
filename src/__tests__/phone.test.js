import { normalizePhone } from '../utils/phone';

describe('normalizePhone', () => {
  it('Venezuela: quita el 0 inicial de marcación nacional', () => {
    expect(normalizePhone('0416-1234567', 'VE')).toEqual({
      isValid: true,
      e164: '+584161234567',
    });
  });

  it('Argentina: inserta el 9 móvil y quita el 15', () => {
    expect(normalizePhone('011 15-1234-5678', 'AR')).toEqual({
      isValid: true,
      e164: '+5491112345678',
    });
  });

  it('España: 9 dígitos sin prefijo de marcación nacional', () => {
    expect(normalizePhone('612 345 678', 'ES')).toEqual({
      isValid: true,
      e164: '+34612345678',
    });
  });

  it('Colombia: número móvil de 10 dígitos', () => {
    expect(normalizePhone('300 123 4567', 'CO')).toEqual({
      isValid: true,
      e164: '+573001234567',
    });
  });

  it('México: número móvil sin el 1 histórico', () => {
    expect(normalizePhone('55 1234 5678', 'MX')).toEqual({
      isValid: true,
      e164: '+525512345678',
    });
  });

  it('Perú: número móvil de 9 dígitos', () => {
    expect(normalizePhone('987 654 321', 'PE')).toEqual({
      isValid: true,
      e164: '+51987654321',
    });
  });

  it('EE.UU.: número válido de 10 dígitos', () => {
    expect(normalizePhone('(212) 555-0134', 'US')).toEqual({
      isValid: true,
      e164: '+12125550134',
    });
  });

  it('rechaza un número demasiado corto', () => {
    expect(normalizePhone('123', 'VE')).toEqual({ isValid: false, e164: null });
  });

  it('rechaza un área ficticia inválida (EE.UU. 555)', () => {
    expect(normalizePhone('(555) 123-4567', 'US')).toEqual({
      isValid: false,
      e164: null,
    });
  });

  it('rechaza cadena vacía sin invocar el parser', () => {
    expect(normalizePhone('', 'VE')).toEqual({ isValid: false, e164: null });
  });
});
