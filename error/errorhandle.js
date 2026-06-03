const errorType = require("../constants/errorType");
const e = require("express");
const errorHandle = (error, req, res, next) => {
    let status, message;
    console.log(error.message);
    switch (error.message) {
        case errorType.TOKEN_VERIFY_ERROR:
            status = 200;
            message = "token 驗證失敗";
            break;
        case errorType.Account_IS_NOT_EXIST:
            status = 200;
            message = "帳號或密碼錯誤";
            break;
        case errorType.PASSWORD_IS_NOT_SAME:
            status = 200;
            message = "帳號或密碼錯誤";
            break;
        default:
            status = 404;
            message = "not found";
    }
    res.status(status);
    res.json({
        success: -1,
        message: message
    });
}

module.exports = errorHandle;