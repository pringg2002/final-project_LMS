const authService = require("../services/authService");
const {success, created} = require("..utils/response");

exports.register = async(req, res) => {
    const data = await authService.login(req.body);
    success(res, data, "Login Sucessfull");
};

exports.me = async(req, res) => {
    const user = await authService.me (req.user.user_id);
    success(res, user, "Current user retrieved successfully");
}