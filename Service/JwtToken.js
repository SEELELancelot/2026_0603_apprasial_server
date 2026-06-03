const fs=require("fs");
const jwt=require("jsonwebtoken");
const privateKey=fs.readFileSync("./keys/private.key"); //以index.js 所在目錄
const publicKey=fs.readFileSync("./keys/public.key");
const errorType=require("../constants/errorType");
// console.log(privateKey);

class JwtToken {
    signToken=(data)=>{
            const token=jwt.sign(data,privateKey,{
                // expiresIn: "12h", //不會過期 就移除 設12小時候過期
                algorithm:"RS256"
            });
            return token;
    }
    verifyToken=(token,next)=>{
        try {
            const result=jwt.verify(token,publicKey,{
                algorithm:["RS256"]
            });
            return result;
        }catch (e){
            console.log(e.message);
            return next(new Error(errorType.TOKEN_VERIFY_ERROR));
        }
    }
}

module.exports=new JwtToken();