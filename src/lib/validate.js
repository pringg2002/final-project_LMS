const AppError = require('../utils/AppError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmail = (v) => typeof v === 'string' && EMAIL_RE.test(v.trim());

function requireFields(body, fields) {
  const missing = fields.filter(
    (f) => body?.[f] === undefined || body[f] === null || String(body[f]).trim() === ''
  );
  if (missing.length) {
    throw new AppError(`Missing required field(s): ${missing.join(', ')}`, 400, { missing });
  }
}

function parseId(value, label = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`Invalid ${label}`, 400);
  return n;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError('Password must be at least 8 characters and include a letter and a number', 400);
  }
}

function assertEnum(value, allowed, label) {
  if (value === undefined || value === null) return;
  if (!allowed.includes(value)) throw new AppError(`${label} must be one of: ${allowed.join(', ')}`, 400);
}

function assertNumber(value, label, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (value === undefined || value === null) return;
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new AppError(`${label} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}`, 400);
  }
}
function assertHttpUrl(url, label = 'url') {
  if (typeof url !== 'string' || url.length > 500 || !/^(https?:\/\/|\/)/i.test(url.trim())) {
    throw new AppError(`${label} must start with http://, https:// or / (max 500 chars)`, 400);
  }
}

module.exports = { 
    isEmail,
    requireFields, 
    parseId, 
    validatePassword, 
    assertEnum, 
    assertNumber, 
    assertHttpUrl 
};
