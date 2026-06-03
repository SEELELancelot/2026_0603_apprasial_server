const {
    exportOffice,
    getAppraisalTableFetch,
    getExcelNameByIdFetch,
    deleteExcelFileById,
    updateExcelSend,
    checkAppraisalRecord,
    mergeAppraisalExcelAction,
    exportYearFinalOffice,
    getYearAppraisalTableFetch,
    checkYearAppraisalRecord,
    mergeYearAppraisalExcelAction,
    deleteYearExcelFileById,
    exportBonusOffice,
    getBonusTableFetchService,
    deleteBonusByIdService,
    mergeBonusExcelAction,
    exportBonusAutExcelOffice,
    getBonusAutTableFetchService,
    deleteAutBonusByIdService,
    mergeAutBonusExcelAction
} = require("../Service/officeService");

const fs = require("fs");
const syncRequest = require("sync-request");
const path = require("path");

class OfficeController {
    async exportExcel(req, res, next) {
        const result = await exportOffice(req);
        res.json(result);
    }
    async exportYearFinalExcel(req,res,next){
        const result=await exportYearFinalOffice(req);
        res.json(result);
    }
    async exportBonusExcel(req,res,next){
        const result=await exportBonusOffice(req);
        res.json(result);
    }
    // 中秋
    async exportBonusAutExcel(req,res,next){
        const result=await exportBonusAutExcelOffice(req);
        res.json(result);
    }

    async mergeAppraisalExcel(req,res,next){
        const result=await mergeAppraisalExcelAction(req);
        res.json(result);
    }
    async mergeYearAppraisalExcel(req,res,next){
        const result=await mergeYearAppraisalExcelAction(req);
        res.json(result);
    }
    async mergeBonusExcel(req,res,next){
        const result=await mergeBonusExcelAction(req);
        res.json(result);
    }
    async mergeAutBonusExcel(req,res,next){
        const result=await mergeAutBonusExcelAction(req);
        res.json(result);
    }

    async getAppraisalTable(req, res, next) {
        const result = await getAppraisalTableFetch(req);
        res.json(result);
    }

    async getExcelNameById(req, res, next) {
        const result = await getExcelNameByIdFetch(req);
        res.json(result);
    }

    async deleteExcelById(req, res, next) {
        const result = await deleteExcelFileById(req);
        res.json(result);
    }
    async deleteYearExcelById(req,res,next){
        const result = await deleteYearExcelFileById(req);
        res.json(result);
    }
    async deleteBonusById(req,res,next){
        const result=await deleteBonusByIdService(req);
        res.json(result);
    }
    async deleteAutBonusById(req,res,next){
        const result=await deleteAutBonusByIdService(req);
        res.json(result);
    }

    async updateExcelSendById(req, res, next) {
        const result = await updateExcelSend(req);
        res.json(result);
    }

    // 檢查員工考核未填
    async checkAppraisalRecordError(req, res, next) {
        const result = await checkAppraisalRecord(req);
        res.json(result);
    }
    //檢查年末員工考核
    async checkYearAppraisalRecordError(req,res,next){
        const result = await checkYearAppraisalRecord(req);
        res.json(result);
    }

    async getYearAppraisalTableFetch(req,res,next){
        const result=await getYearAppraisalTableFetch(req);
        res.json(result);
    }
    async getBonusTableFetch(req,res,next){
        const result=await getBonusTableFetchService(req);
        res.json(result);
    }
    async getAutBonusTableFetch(req,res,next){
        const result=await getBonusAutTableFetchService(req);
        res.json(result);
    }

    async AppraisalRecordExcel(req, res, next) {
        const documentName = req?.query?.documentName;

        const pathForSave = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelManager", documentName);
        const updateFile = function (response, body, path) {
            if (body?.status == 2) {
                const file = syncRequest("GET", body.url);
                fs.writeFileSync(path, file.getBody());
            }

            res.json({error: 0});

        }
        const readbody = function (request, response, path) {
            let content = "";
            request.on("data", function (data) {
                content += data;
            });
            request.on("end", function () {
                try {
                    let body = JSON.parse(content);
                    updateFile(response, body, path);
                } catch (e) {
                    console.log(e);
                    res.json({success: -1});
                }
            });
        }
        if (req.body.hasOwnProperty("status")) {
            // console.log(req.body);
            updateFile(res, req.body, pathForSave);
        } else {
            readbody(req, res, pathForSave)
        }
    }
    // 更新年末考核表
    async AppraisalYearRecordExcel(req, res, next) {
        const documentName = req?.query?.documentName;

        const pathForSave = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelYear", documentName);
        const updateFile = function (response, body, path) {
            if (body?.status == 2) {
                const file = syncRequest("GET", body.url);
                fs.writeFileSync(path, file.getBody());
            }

            res.json({error: 0});

        }
        const readbody = function (request, response, path) {
            let content = "";
            request.on("data", function (data) {
                content += data;
            });
            request.on("end", function () {
                try {
                    let body = JSON.parse(content);
                    updateFile(response, body, path);
                } catch (e) {
                    console.log(e);
                    res.json({success: -1});
                }
            });
        }
        if (req.body.hasOwnProperty("status")) {
            // console.log(req.body);
            updateFile(res, req.body, pathForSave);
        } else {
            readbody(req, res, pathForSave)
        }
    }

    async AppraisalBonusExcelCallBack(req,res,next){
        const documentName = req?.query?.documentName;

        const pathForSave = path.resolve(__dirname, "../public", "office", "excel", "EmployeeBonusExcel", documentName);
        const updateFile = function (response, body, path) {
            if (body?.status == 2) {
                const file = syncRequest("GET", body.url);
                fs.writeFileSync(path, file.getBody());
            }
            res.json({error: 0});

        }
        const readbody = function (request, response, path) {
            let content = "";
            request.on("data", function (data) {
                content += data;
            });
            request.on("end", function () {
                try {
                    let body = JSON.parse(content);
                    updateFile(response, body, path);
                } catch (e) {
                    console.log(e);
                    res.json({success: -1});
                }
            });
        }
        if (req.body.hasOwnProperty("status")) {
            // console.log(req.body);
            updateFile(res, req.body, pathForSave);
        } else {
            readbody(req, res, pathForSave)
        }
    }
    async AppraisalAutExcelCallBack(req,res,next){
        const documentName = req?.query?.documentName;
        console.log(documentName);
        const pathForSave = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAutExcel", documentName);
        const updateFile = function (response, body, path) {
            if (body?.status == 2) {
                const file = syncRequest("GET", body.url);
                fs.writeFileSync(path, file.getBody());
            }
            res.json({error: 0});

        }
        const readbody = function (request, response, path) {
            let content = "";
            request.on("data", function (data) {
                content += data;
            });
            request.on("end", function () {
                try {
                    let body = JSON.parse(content);
                    updateFile(response, body, path);
                } catch (e) {
                    console.log(e);
                    res.json({success: -1});
                }
            });
        }
        if (req.body.hasOwnProperty("status")) {
            // console.log(req.body);
            updateFile(res, req.body, pathForSave);
        } else {
            readbody(req, res, pathForSave)
        }
    }
}

module.exports = new OfficeController();