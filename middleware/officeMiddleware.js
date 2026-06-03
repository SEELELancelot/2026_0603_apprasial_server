const {getUserLenderReturnRecordExcelFetch,getAdminLenderReturnRecordExcelFetch,getCarManagerLenderReturnRecordExcelFetch} = require("../Service/CarService");

const getUserRecordExcelMiddleWare=async (req,res,next) => {
    const result = await getUserLenderReturnRecordExcelFetch(req);
    req.getUserExcelRecord=result?.message;
    await next();
}
const getAdminRecordExcelMiddleWare=async (req,res,next)=>{
    const result=await getAdminLenderReturnRecordExcelFetch();
    req.getAdminExcelRecord=result?.message;
    await next();
}
const getCarManagerRecordExcelMiddleWare=async (req,res,next)=>{
    const result=await getCarManagerLenderReturnRecordExcelFetch(req);
    req.getCarManagerExcelRecord=result?.message;
    await next();
}
module.exports = {getUserRecordExcelMiddleWare,getAdminRecordExcelMiddleWare,getCarManagerRecordExcelMiddleWare};