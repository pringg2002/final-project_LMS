const { fail } = require('../utils/response');

const MYSQL_ERRORS = {
  ER_DUP_ENTRY: [409, 'A record with the same unique value already exists'],
  ER_NO_REFERENCED_ROW_2: [400, 'Referenced record does not exist'],
  ER_ROW_IS_REFERENCED_2: [409, 'Record is still referenced by other data and cannot be deleted'],
  ER_BAD_NULL_ERROR: [400, 'A required value is missing'],
  ER_CHECK_CONSTRAINT_VIOLATED: [400, 'A value violates a database constraint'],
};

module.exports = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return fail(res, 'Invalid JSON body', 400);

  if (err.statusCode) return fail(res, err.message, err.statusCode, err.errors);

  if (err.code && MYSQL_ERRORS[err.code]) {
    const [status, message] = MYSQL_ERRORS[err.code];
    return fail(res, message, status);
  }

  console.error('[error]', err);
  return fail(res, 'Internal server error', 500);
};
