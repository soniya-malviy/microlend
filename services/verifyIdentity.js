// Mock identity check. Deterministic so tests can force pass/fail:
// verified=true unless id_number ends with '0' (~90% pass if last digit is 0–9).
function verifyIdentity(id_type, id_number) {
  const number = String(id_number ?? '');
  const verified = number.length > 0 && !number.endsWith('0');
  return { verified };
}

module.exports = { verifyIdentity };
