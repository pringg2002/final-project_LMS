const { verifyToken } = require("../lib/token");
const userModel = require('../models/user.models');
const AppError = require('../utils/AppError');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError('Authentication required', 401);

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw new AppError(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token', 401);
    }

    const user = await userModel.findById(payload.user_id);
    if (!user || user.status !== 'active') {
      throw new AppError('User no longer exists or is inactive', 401);
    }

    req.user = {
      user_id: user.user_id,
      role: user.role,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    next();
  } catch (err) {
    next(err);
  }
};