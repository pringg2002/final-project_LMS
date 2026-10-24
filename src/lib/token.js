const jwt = require("jsonwebtoken");
const config = require("./config");

function generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret);
}

function verifyToken(token) {
    return jwt.verify(token, config.jwt.secret);
}

module.exports = {
    generateToken,
    verifyToken
};