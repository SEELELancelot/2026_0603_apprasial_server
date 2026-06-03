const {signToken}=require("../Service/JwtToken");

Login=async (req,res,next)=>{
    console.log(req.mydata); //裝進token 的資料
    const token=signToken(req.mydata);
    res.json({success:1,token:token});
 }


module.exports= {Login};