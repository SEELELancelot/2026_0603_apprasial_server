const {getYear,getDisableExcel} = require("../Service/DropDownService");

class DropDownController{
    async getYear(req,res,next){
        const result = await getYear(req);
        res.json(result);
    }
    async getDisableExcel(req,res,next){
        const result=await getDisableExcel(req);
        res.json(result);
    }
}

module.exports = new DropDownController();