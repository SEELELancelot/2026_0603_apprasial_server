const express = require("express");
const {verifymyToken} = require("../middleware/authmiddleware");
const {employeeAppraisalExcelMiddleware,getEmployeeManagerDataMiddleware}=require("../middleware/userMiddleware");
const {fetchBonusEelZongSalesMiddleware}=require("../middleware/fetchBonusEelZongSalesMiddleware");
const {exportExcel,AppraisalRecordExcel,getAppraisalTable,getExcelNameById,deleteExcelById,AppraisalYearRecordExcel,
    updateExcelSendById,checkAppraisalRecordError,mergeAppraisalExcel,exportYearFinalExcel,getYearAppraisalTableFetch,checkYearAppraisalRecordError,mergeYearAppraisalExcel,
    deleteYearExcelById,exportBonusExcel,AppraisalBonusExcelCallBack,getBonusTableFetch,deleteBonusById,mergeBonusExcel,exportBonusAutExcel,getAutBonusTableFetch,AppraisalAutExcelCallBack,
    deleteAutBonusById,mergeAutBonusExcel,getExcelFileVersions,getExcelFileVersionById

}=require("../controller/OfficeController");
const officeRouter = express.Router();

officeRouter.post("/exportExcel",verifymyToken,employeeAppraisalExcelMiddleware,exportExcel);
officeRouter.post("/mergeAppraisalExcel",verifymyToken,mergeAppraisalExcel);
// 合併年終總表
officeRouter.post("/mergeYearAppraisalExcel",verifymyToken,mergeYearAppraisalExcel);
// 合併發放獎金調查
officeRouter.post("/mergeBonusExcel",verifymyToken,mergeBonusExcel);
officeRouter.post("/mergeAutBonusExcel",verifymyToken,mergeAutBonusExcel);

officeRouter.post("/AppraisalRecordExcelCallback",AppraisalRecordExcel);
officeRouter.post("/AppraisalYearRecordExcelCallback",AppraisalYearRecordExcel);
officeRouter.post("/AppraisalBonusExcelCallBack",AppraisalBonusExcelCallBack); //假日發放callback
officeRouter.post("/AppraisalAutExcelCallBack",AppraisalAutExcelCallBack);

officeRouter.post("/checkAppraisalRecordError",getEmployeeManagerDataMiddleware,checkAppraisalRecordError);
officeRouter.get("/getAppraisalTable",verifymyToken,getAppraisalTable);
officeRouter.post("/getExcelNameById",verifymyToken,getExcelNameById);
officeRouter.post("/deleteExcelById",verifymyToken,deleteExcelById);

officeRouter.post("/deleteYearExcelById",verifymyToken,deleteYearExcelById);
officeRouter.post("/deleteBonusById",verifymyToken,deleteBonusById); //刪除端午
officeRouter.post("/deleteAutBonusById",verifymyToken,deleteAutBonusById);

officeRouter.patch("/updateExcelSend",verifymyToken,updateExcelSendById);
officeRouter.get("/getYearAppraisalTableFetch",verifymyToken,getYearAppraisalTableFetch);
officeRouter.get("/getBonusTableFetch",verifymyToken,getBonusTableFetch); //得到獎金發放調查表
officeRouter.get("/getBonusAutTableFetch",verifymyToken,getAutBonusTableFetch) ;//得到中秋發放調查表

officeRouter.post("/exportYearFinalExcel",verifymyToken,employeeAppraisalExcelMiddleware,exportYearFinalExcel);  //新建年終考核
officeRouter.post("/checkYearAppraisalRecordError",getEmployeeManagerDataMiddleware,checkYearAppraisalRecordError);

officeRouter.post("/exportBonusExcel",verifymyToken,employeeAppraisalExcelMiddleware,fetchBonusEelZongSalesMiddleware,exportBonusExcel); //端午
officeRouter.post("/exportBonusAutExcel",verifymyToken,employeeAppraisalExcelMiddleware,exportBonusAutExcel);
officeRouter.post("/getExcelFileVersions", verifymyToken, getExcelFileVersions);
officeRouter.post("/getExcelFileVersionById", verifymyToken, getExcelFileVersionById);

module.exports = officeRouter;