const jwt = require('jsonwebtoken');
const config = require('./config');

const signToken = (user) =>
  jwt.sign({ user_id: user.user_id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

const verifyToken = (token) => jwt.verify(token, config.jwt.secret);

module.exports = { 
    signToken, 
    verifyToken 
};
