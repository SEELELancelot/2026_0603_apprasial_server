const {getManagerEmployeeData,getEmployeeManagerData} = require("../Service/UserService");
const employeeAppraisalExcelMiddleware = async (req, res, next) => {
    const result = await getManagerEmployeeData(req);
    req.getExcelManagerEmployeeData=result?.message?.data;

    await next();
}

const getEmployeeManagerDataMiddleware=async (req,res,next)=>{
    const result = await getEmployeeManagerData(req);
    req.getEmployeeManagerData=result?.message;
    await next();
}

module.exports = {employeeAppraisalExcelMiddleware,getEmployeeManagerDataMiddleware};