const success = (res, data = null,
    message = 'OK',
    status = 200) => res.status(status).json({
    success: true,
    message, data 
});

const created = (res, data, message = 'Created successfully') => success(res, data, message, 201);

const fail = (res, message = 'Something went wrong', status = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};

module.exports = { success, created, fail };