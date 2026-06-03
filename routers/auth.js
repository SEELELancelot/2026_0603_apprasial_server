const express = require("express");
const {Login} = require("../controller/LoginController");
const {verifyLogin,updateUserData} = require("../middleware/authmiddleware");

const authRouter = express.Router();

authRouter.post("/", updateUserData,verifyLogin, Login);

module.exports = authRouter;