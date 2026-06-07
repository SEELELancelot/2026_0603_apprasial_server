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
    mergeAutBonusExcelAction,
} = require("../Service/officeService");

const pool = require("../connect/connect");
const OfficeFileVersionService = require("../Service/officeFileVersionService");

const fs = require("fs");
const syncRequest = require("sync-request");
const path = require("path");

/**
 * ✅ 建立資料夾
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * ✅ 避免 Windows 檔名不合法字元
 */
function getSafeFileName(fileName) {
    return String(fileName || "")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * ✅ 避免 documentName 帶路徑穿越
 */
function getOnlyFileName(documentName) {
    return path.basename(String(documentName || ""));
}

/**
 * ✅ 從 OnlyOffice callbackUrl query 取得編輯者資訊
 */
function getEditorUserFromRequest(req) {
    return {
        USER_ID: req?.query?.editorUserId || null,
        USER_NAME: req?.query?.editorUserName || null,
        MISS_NAME: req?.query?.editorMissName || null,
        BRANCH_NAME: req?.query?.editorBranchName || null,
    };
}

/**
 * ✅ 建立同一階段版本唯一 key
 *
 * 目的：
 * 同一個人、同一個簽核階段，多次修改只更新同一筆歷史版本。
 *
 * 範例：
 * approval:10:round:step_3:user:0035
 * approval:10:round:return_1:user:0029
 */
function buildVersionKey({
                             approvalId,
                             approvalStepId,
                             editorUserId,
                             editRoundKey,
                         }) {
    const safeApprovalId = approvalId || "no_approval";
    const safeEditorUserId = editorUserId || "unknown_user";

    if (editRoundKey) {
        return `approval:${safeApprovalId}:round:${editRoundKey}:user:${safeEditorUserId}`;
    }

    return `approval:${safeApprovalId}:step:${approvalStepId || "no_step"}:user:${safeEditorUserId}`;
}

/**
 * ✅ 建立穩定版歷史檔名
 *
 * 同一個 version_key 重複修改時，會覆蓋同一個檔案。
 *
 * 範例：
 * xxx_V002_郭式雄.xlsx
 */
function buildStableVersionFileName({
                                        originalFileName,
                                        versionNo,
                                        editorUser,
                                    }) {
    const ext = path.extname(originalFileName) || ".xlsx";
    const baseName = path.basename(originalFileName, ext);
    const safeBaseName = getSafeFileName(baseName);
    const editorName = getSafeFileName(editorUser?.USER_NAME || "unknown");

    return `${safeBaseName}_V${String(versionNo).padStart(3, "0")}_${editorName}${ext}`;
}

/**
 * ✅ 下載 OnlyOffice 回傳的新檔案
 */
function downloadOnlyOfficeFileToPath(body, savePath) {
    const file = syncRequest("GET", body.url);
    fs.writeFileSync(savePath, file.getBody());
}

/**
 * ✅ 讀取 OnlyOffice callback body
 */
function readOnlyOfficeBody(req) {
    return new Promise((resolve, reject) => {
        let content = "";

        req.on("data", function (data) {
            content += data;
        });

        req.on("end", function () {
            try {
                resolve(JSON.parse(content));
            } catch (e) {
                reject(e);
            }
        });

        req.on("error", reject);
    });
}

/**
 * ✅ 將目前正式檔存成「目前階段的最新歷史版本」
 *
 * 重點：
 * - 同一個 version_key 已存在：覆蓋同一份歷史 Excel，更新同一筆 DB
 * - version_key 不存在：新增新的 V001 / V002 / V003
 */
async function saveOrUpdateHistoryVersionFromCurrentFile({
                                                             conn,
                                                             excelId,
                                                             approvalId,
                                                             approvalStepId,
                                                             editRoundKey,
                                                             editorUser,
                                                             currentFilePath,
                                                             historyDirPath,
                                                             historyRelativeDir,
                                                             originalFileName,
                                                             versionType,
                                                             remark,
                                                         }) {
    if (!excelId) {
        return null;
    }

    if (!currentFilePath || !fs.existsSync(currentFilePath)) {
        return null;
    }

    ensureDir(historyDirPath);

    const versionKey = buildVersionKey({
        approvalId,
        approvalStepId,
        editorUserId: editorUser?.USER_ID,
        editRoundKey,
    });

    const oldVersion = await OfficeFileVersionService.getExcelFileVersionByKey(
        conn,
        excelId,
        versionKey
    );

    const versionNo =
        oldVersion?.version_no ||
        (await OfficeFileVersionService.getNextExcelFileVersionNo(conn, excelId));

    const versionFileName =
        oldVersion?.version_file_name ||
        buildStableVersionFileName({
            originalFileName,
            versionNo,
            editorUser,
        });

    const fullVersionFilePath = path.join(historyDirPath, versionFileName);

    /**
     * ✅ DB 存相對路徑
     *
     * 因為 app.use(express.static(__dirname + '/public'));
     * 前端下載可用：
     * ${mybaseUrl}/${versionFilePath}
     */
    const versionRelativePath = `${historyRelativeDir}/${versionFileName}`;

    /**
     * ✅ 同一個 version_key 重複修改：
     * 覆蓋同一份歷史 Excel
     */
    fs.copyFileSync(currentFilePath, fullVersionFilePath);

    const result =
        await OfficeFileVersionService.createOrUpdateExcelFileVersionRecordWithConn(
            conn,
            {
                excelId,
                approvalId,
                approvalStepId,
                versionKey,
                versionType,
                editorUser,
                originalFileName,
                versionFileName,
                versionFilePath: versionRelativePath,
                remark,
            }
        );

    return {
        ...result,
        versionKey,
        versionNo,
        versionFileName,
        versionFilePath: versionRelativePath,
    };
}

/**
 * ✅ 通用 OnlyOffice callback + 歷史版本
 *
 * 新版流程：
 * 1. OnlyOffice status == 2
 * 2. 下載 OnlyOffice 新檔，覆蓋正式檔
 * 3. 把覆蓋後的正式檔存成目前階段的最新歷史版本
 *
 * 不再做：
 * - 覆蓋前存一份
 * - 覆蓋後再存一份
 *
 * 因為那樣同一個人改很多次會產生很多不必要的版本。
 */
async function handleOnlyOfficeCallbackWithHistory({
                                                       req,
                                                       res,
                                                       documentName,
                                                       currentDirPath,
                                                       historyDirPath,
                                                       historyRelativeDir,
                                                   }) {
    const safeDocumentName = getOnlyFileName(documentName);

    if (!safeDocumentName) {
        return res.json({
            error: 1,
            message: "缺少 documentName",
        });
    }

    const excelId = req?.query?.excelId || null;
    const approvalId = req?.query?.approvalId || null;
    const approvalStepId = req?.query?.approvalStepId || null;

    /**
     * ✅ editRoundKey 用來區分流程回合
     *
     * 前端建議傳：
     * - step_3
     * - return_1
     * - submit_2
     *
     * 如果前端沒傳，會退回用 approvalStepId。
     */
    const editRoundKey = req?.query?.editRoundKey || null;

    const editorUser = getEditorUserFromRequest(req);
    const currentFilePath = path.resolve(currentDirPath, safeDocumentName);

    let conn = null;

    try {
        const body =
            req.body && req.body.hasOwnProperty("status")
                ? req.body
                : await readOnlyOfficeBody(req);

        /**
         * ✅ status != 2 不需要儲存
         * OnlyOffice 仍要求回傳 { error: 0 }
         */
        if (body?.status != 2) {
            return res.json({ error: 0 });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        /**
         * ✅ 1. 下載 OnlyOffice 新檔，覆蓋正式檔
         */
        downloadOnlyOfficeFileToPath(body, currentFilePath);

        /**
         * ✅ 2. 把最新正式檔存成目前階段的歷史版本
         *
         * 同一個人同一個階段多次修改：
         * 只更新同一筆 version_key，不新增版本。
         */
        await saveOrUpdateHistoryVersionFromCurrentFile({
            conn,
            excelId,
            approvalId,
            approvalStepId,
            editRoundKey,
            editorUser,
            currentFilePath,
            historyDirPath,
            historyRelativeDir,
            originalFileName: safeDocumentName,
            versionType: "edit_snapshot",
            remark: "OnlyOffice 修改後最新版本",
        });

        await conn.commit();

        return res.json({ error: 0 });
    } catch (e) {
        if (conn) {
            await conn.rollback();
        }

        console.error("handleOnlyOfficeCallbackWithHistory error:", e);

        return res.json({
            error: 1,
            message: e.message || "OnlyOffice callback 儲存失敗",
        });
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

/**
 * ✅ 通用舊版 OnlyOffice callback
 *
 * 平時考核、年度考核目前先維持原本邏輯。
 */
function handleSimpleOnlyOfficeCallback(req, res, savePath) {
    const updateFile = function (response, body, pathForSave) {
        if (body?.status == 2) {
            const file = syncRequest("GET", body.url);
            fs.writeFileSync(pathForSave, file.getBody());
        }

        response.json({ error: 0 });
    };

    const readbody = function (request, response, pathForSave) {
        let content = "";

        request.on("data", function (data) {
            content += data;
        });

        request.on("end", function () {
            try {
                const body = JSON.parse(content);
                updateFile(response, body, pathForSave);
            } catch (e) {
                console.log(e);
                response.json({ success: -1 });
            }
        });
    };

    if (req.body.hasOwnProperty("status")) {
        updateFile(res, req.body, savePath);
    } else {
        readbody(req, res, savePath);
    }
}

class OfficeController {
    async exportExcel(req, res, next) {
        const result = await exportOffice(req);
        res.json(result);
    }

    async exportYearFinalExcel(req, res, next) {
        const result = await exportYearFinalOffice(req);
        res.json(result);
    }

    async exportBonusExcel(req, res, next) {
        const result = await exportBonusOffice(req);
        res.json(result);
    }

    // 中秋
    async exportBonusAutExcel(req, res, next) {
        const result = await exportBonusAutExcelOffice(req);
        res.json(result);
    }

    async mergeAppraisalExcel(req, res, next) {
        const result = await mergeAppraisalExcelAction(req);
        res.json(result);
    }

    async mergeYearAppraisalExcel(req, res, next) {
        const result = await mergeYearAppraisalExcelAction(req);
        res.json(result);
    }

    async mergeBonusExcel(req, res, next) {
        const result = await mergeBonusExcelAction(req);
        res.json(result);
    }

    async mergeAutBonusExcel(req, res, next) {
        const result = await mergeAutBonusExcelAction(req);
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

    async deleteYearExcelById(req, res, next) {
        const result = await deleteYearExcelFileById(req);
        res.json(result);
    }

    async deleteBonusById(req, res, next) {
        const result = await deleteBonusByIdService(req);
        res.json(result);
    }

    async deleteAutBonusById(req, res, next) {
        const result = await deleteAutBonusByIdService(req);
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

    // 檢查年末員工考核
    async checkYearAppraisalRecordError(req, res, next) {
        const result = await checkYearAppraisalRecord(req);
        res.json(result);
    }

    async getYearAppraisalTableFetch(req, res, next) {
        const result = await getYearAppraisalTableFetch(req);
        res.json(result);
    }

    async getBonusTableFetch(req, res, next) {
        const result = await getBonusTableFetchService(req);
        res.json(result);
    }

    async getAutBonusTableFetch(req, res, next) {
        const result = await getBonusAutTableFetchService(req);
        res.json(result);
    }

    /**
     * ✅ 平時考核 callback
     *
     * 目前先維持原本覆蓋邏輯。
     * 若之後平時考核也要歷史版本，可以比照端午 / 中秋改。
     */
    async AppraisalRecordExcel(req, res, next) {
        const documentName = getOnlyFileName(req?.query?.documentName);

        const pathForSave = path.resolve(
            __dirname,
            "../public",
            "office",
            "excel",
            "EmployeeAppraisalExcelManager",
            documentName
        );

        handleSimpleOnlyOfficeCallback(req, res, pathForSave);
    }

    /**
     * ✅ 年度考核 callback
     *
     * 目前先維持原本覆蓋邏輯。
     */
    async AppraisalYearRecordExcel(req, res, next) {
        const documentName = getOnlyFileName(req?.query?.documentName);

        const pathForSave = path.resolve(
            __dirname,
            "../public",
            "office",
            "excel",
            "EmployeeAppraisalExcelYear",
            documentName
        );

        handleSimpleOnlyOfficeCallback(req, res, pathForSave);
    }

    /**
     * ✅ 端午獎金 callback
     *
     * 正式檔：
     * public/office/excel/EmployeeBonusExcel
     *
     * 歷史檔：
     * public/office/excel/history/EmployeeBonusExcelHistory
     */
    async AppraisalBonusExcelCallBack(req, res, next) {
        const documentName = req?.query?.documentName;

        const currentDirPath = path.resolve(
            __dirname,
            "../public",
            "office",
            "excel",
            "EmployeeBonusExcel"
        );

        const historyDirPath = path.resolve(
            __dirname,
            "../public",
            "office",
            "excel",
            "history",
            "EmployeeBonusExcelHistory"
        );

        const historyRelativeDir =
            "office/excel/history/EmployeeBonusExcelHistory";

        await handleOnlyOfficeCallbackWithHistory({
            req,
            res,
            documentName,
            currentDirPath,
            historyDirPath,
            historyRelativeDir,
        });
    }

    /**
     * ✅ 中秋獎金 callback
     *
     * 正式檔：
     * public/office/excel/EmployeeAutExcel
     *
     * 歷史檔：
     * public/office/excel/history/EmployeeAutExcelHistory
     */
    async AppraisalAutExcelCallBack(req, res, next) {
        const documentName = req?.query?.documentName;

        const currentDirPath = path.resolve(
            __dirname,
            "../public",
            "office",
            "excel",
            "EmployeeAutExcel"
        );

        const historyDirPath = path.resolve(
            __dirname,
            "../public",
            "office",
            "excel",
            "history",
            "EmployeeAutExcelHistory"
        );

        const historyRelativeDir =
            "office/excel/history/EmployeeAutExcelHistory";

        await handleOnlyOfficeCallbackWithHistory({
            req,
            res,
            documentName,
            currentDirPath,
            historyDirPath,
            historyRelativeDir,
        });
    }

    /**
     * ✅ 查詢某份 Excel 的所有歷史版本
     */
    async getExcelFileVersions(req, res, next) {
        try {
            const { excelId } = req.body;

            if (!excelId) {
                return res.json({
                    success: -1,
                    message: "缺少 excelId",
                });
            }

            const result =
                await OfficeFileVersionService.getExcelFileVersionsByExcelId(
                    excelId
                );

            return res.json(result);
        } catch (e) {
            next(e);
        }
    }

    // OfficeController.js
    async getExcelFileVersionById(req, res, next) {
        try {
            const { excelId, historyVersionId } = req.body;

            if (!excelId) {
                return res.json({
                    success: -1,
                    message: "缺少 excelId",
                });
            }

            if (!historyVersionId) {
                return res.json({
                    success: -1,
                    message: "缺少 historyVersionId",
                });
            }

            const result = await OfficeFileVersionService.getExcelFileVersionById({
                excelId,
                historyVersionId,
            });

            return res.json(result);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new OfficeController();