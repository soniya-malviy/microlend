// Format-only KYC. No UIDAI / NSDL call — we only check ID structure.

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function passesVerhoeff(digits) {
  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i += 1) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][Number(reversed[i])]];
  }
  return c === 0;
}

function normalizeAadhaar(value) {
  return String(value ?? '').replace(/\s|-/g, '');
}

function normalizePan(value) {
  return String(value ?? '').replace(/\s/g, '').toUpperCase();
}

function validateAadhaar(id_number) {
  const digits = normalizeAadhaar(id_number);
  if (!/^[2-9][0-9]{11}$/.test(digits)) {
    return {
      ok: false,
      error: 'Aadhaar must be 12 digits and cannot start with 0 or 1',
    };
  }
  if (!passesVerhoeff(digits)) {
    return {
      ok: false,
      error: 'Aadhaar checksum is invalid. Check the number and try again',
    };
  }
  return { ok: true, id_number: digits };
}

function validatePan(id_number) {
  const pan = normalizePan(id_number);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return {
      ok: false,
      error: 'PAN must be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCPE1234F)',
    };
  }
  // 4th character is the holder type. P = individual (this product lends to people).
  if (pan[3] !== 'P') {
    return {
      ok: false,
      error: 'PAN 4th character must be P for an individual applicant',
    };
  }
  return { ok: true, id_number: pan };
}

function validateId(id_type, id_number) {
  const type = String(id_type ?? '').trim().toLowerCase();
  if (type === 'aadhaar' || type === 'aadhar') {
    return { ...validateAadhaar(id_number), id_type: 'aadhaar' };
  }
  if (type === 'pan') {
    return { ...validatePan(id_number), id_type: 'pan' };
  }
  return {
    ok: false,
    error: 'id_type must be aadhaar or pan',
  };
}

function verifyIdentity(id_type, id_number) {
  const result = validateId(id_type, id_number);
  if (!result.ok) {
    return { verified: false, ...result };
  }
  return {
    ok: true,
    verified: true,
    id_type: result.id_type,
    id_number: result.id_number,
  };
}

module.exports = {
  verifyIdentity,
  validateId,
  normalizeAadhaar,
  normalizePan,
};
