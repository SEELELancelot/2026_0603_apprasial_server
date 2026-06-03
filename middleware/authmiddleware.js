const {getLoginDataByAccount,updateUserDataByAcs}=require("../Service/authService");
const {verifyToken}=require("../Service/JwtToken");
const errorType = require("../constants/errorType");
const verifyLogin=async (req,res,next)=>{
    const {account,password}=req.body;
    // console.log(account,password);
    const result=await getLoginDataByAccount(account);
    if(result.length===0){
        console.log(result);
         return next(new Error(errorType.Account_IS_NOT_EXIST));
    }
     console.log(result.length);
    const {USER_ID,carManagerLength,LOGIN_PWD,USER_NAME,MISS_ID,MISS_NAME,BRANCH_ID,BRANCH_NAME,admin_type}=result[0];
    // console.log(USER_ID,LOGIN_PWD,USER_NAME,MISS_ID,MISS_NAME,BRANCH_ID,BRANCH_NAME);
    if(password!==LOGIN_PWD){
        return next(new Error(errorType.PASSWORD_IS_NOT_SAME));
    }
    req.mydata={USER_ID,USER_NAME,MISS_ID,MISS_NAME,BRANCH_ID,BRANCH_NAME,admin_type,carManagerLength};

    await next();
}

const updateUserData=async (req,res,next)=>{
    const {account}=req.body;
    const updateResult=await updateUserDataByAcs(account);
    console.log(updateResult);
    await next();
}


const verifymyToken=async (req,res,next)=>{
    const authorization=req.headers.authorization;
    if(!authorization){
        return next(new Error(errorType.TOKEN_VERIFY_ERROR)); //沒有攜帶 token 情況
    }
    const token=authorization.replace("Bearer ","");
    const result=verifyToken(token,next);
    req.mydata=result;
     await next();
}

module.exports= {verifyLogin,updateUserData,verifymyToken};