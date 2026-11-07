const { verifyToken } = require('../lib/token');
const userModel = require('../models/user.models');
const AppError = require('../utils/AppError');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(
        'Authentication required',
        401
      );
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch (err) {
      throw new AppError(
        err.name === 'TokenExpiredError'
          ? 'Token expired'
          : 'Invalid token',
        401
      );
    }

    const user = await userModel.findById(
      payload.user_id
    );

    if (!user || user.status !== 'active') {
      throw new AppError(
        'User no longer exists or is inactive',
        401
      );
    }

    const state = await userModel.findTokenState(
      user.user_id
    );

    if (
      !state ||
      payload.token_version !== state.token_version
    ) {
      throw new AppError(
        'Session expired. Please log in again.',
        401
      );
    }

    const allowedDuringPasswordChange =
      req.baseUrl === '/api/auth' &&
      ['/change-password', '/me'].includes(req.path);

    if (
      state.must_change_password &&
      !allowedDuringPasswordChange
    ) {
      throw new AppError(
        'Password change required before continuing',
        403
      );
    }

    req.user = {
      user_id: user.user_id,
      role: user.role,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      must_change_password: Boolean(
        state.must_change_password
      )
    };

    next();

  } catch (err) {
    next(err);
  }
};