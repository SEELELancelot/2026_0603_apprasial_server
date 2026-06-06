const XlsxPopulate = require('xlsx-populate');
const ExcelJS = require('exceljs');

const moment = require('moment');
const pool = require("../connect/connect");
const {v4: uuidv4} = require('uuid');

const path = require("path");
const fs = require("fs");
const {EXCEL_PASSWORD} = require("../constants/excelPassword/excelPassword");
const OfficeUtils = require("../utils/OfficeUtils");
const {DateUtils} = require("../utils/DateUtils");

class OfficeService {
    deleteExcelFile = async (name) => {
        const writePath = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelManager", name);
        console.log(writePath);

        try {
            fs.unlink(writePath, (error) => {
                if (error) {
                    console.log(error);
                    return false;
                }
                console.log('刪除檔案成功');
            });
        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "刪除檔案失敗"
            }
        }
    }
    deleteYearExcelFile = async (name) => {
        const writePath = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelYear", name);
        console.log(writePath);

        try {
            fs.unlink(writePath, (error) => {
                if (error) {
                    console.log(error);
                    return false;
                }
                console.log('刪除檔案成功');
            });
        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "刪除檔案失敗"
            }
        }
    }

    deleteBonusFile = async (name) => {
        const writePath = path.resolve(__dirname, "../public", "office", "excel", "EmployeeBonusExcel", name);
        console.log(writePath);

        try {
            fs.unlink(writePath, (error) => {
                if (error) {
                    console.log(error);
                    return false;
                }
                console.log('刪除檔案成功');
            });
        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "刪除檔案失敗"
            }
        }
    }

    deleteAutBonusFile = async (name) => {
        const writePath = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAutExcel", name);

        try {
            fs.unlink(writePath, (error) => {
                if (error) {
                    console.log(error);
                    return false;
                }
                console.log('刪除檔案成功');
            });
        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "刪除檔案失敗"
            }
        }
    }

    writeOfficeData = async (req, fileName, date) => {
        const {USER_ID} = req.mydata;
        const createTime = moment(date).format("YYYY-MM-DD HH:mm:ss");
        const year=DateUtils.getCurrentTaiwanYear();

        const sql = `INSERT INTO appraisal_excel (excel_id, create_userId, excel_Name, create_time,create_year_tw)
                     VALUES (?, ?, ?, ?,?)`;
        const result = await pool.execute(sql, [uuidv4(), USER_ID, fileName, createTime,year]);
    }

    writeYearOfficeData = async (req, fileName, date) => {
        const {USER_ID} = req.mydata;
        const createTime = moment(date).format("YYYY-MM-DD HH:mm:ss");
        const year=DateUtils.getCurrentTaiwanYear();

        const sql = `INSERT INTO appraisal_excel (excel_id, create_userId, excel_Name, type, create_time,create_year_tw)
                     VALUES (?, ?, ?, ?, ?,?)`;

        const result = await pool.execute(sql, [uuidv4(), USER_ID, fileName, '2', createTime,year]);
    }

    writeBonusData = async (req, fileName, date) => {
        const {USER_ID} = req.mydata;
        const createTime = moment(date).format("YYYY-MM-DD HH:mm:ss");

        const year=DateUtils.getCurrentTaiwanYear();
        const sql = `INSERT INTO appraisal_excel (excel_id, create_userId, excel_Name, type, create_time,create_year_tw)
                     VALUES (?, ?, ?, ?, ?,?)`;

        const result = await pool.execute(sql, [uuidv4(), USER_ID, fileName, '3', createTime,year]);
    }

    writeAutBonusData = async (req, fileName, date) => {
        const {USER_ID} = req.mydata;
        const createTime = moment(date).format("YYYY-MM-DD HH:mm:ss");

        const year=DateUtils.getCurrentTaiwanYear();
        const sql = `INSERT INTO appraisal_excel (excel_id, create_userId, excel_Name, type, create_time,create_year_tw)
                     VALUES (?, ?, ?, ?, ?,?)`;

        const result = await pool.execute(sql, [uuidv4(), USER_ID, fileName, '4', createTime,year]);
    }

    deleteExcelFileById = async (req) => {
        const {deleteDocumentId} = req.body;
        const selectSql = `select excel_Name
                           from appraisal_excel
                           where excel_id = ?`;
        const deleteSql = `delete
                           from appraisal_excel
                           where excel_id = ?`;
        const result = await pool.execute(selectSql, [deleteDocumentId]);
        const excel_Name = result[0][0]?.excel_Name;
        if (excel_Name) {
            await pool.execute(deleteSql, [deleteDocumentId]); //刪除database data
            this.deleteExcelFile(excel_Name);
            return {
                success: 1,
                message: "刪除檔案成功"
            }
        } else {
            return {
                success: -1,
                message: "檔案不存在"
            }
        }
    }

    deleteYearExcelFileById = async (req) => {
        const {deleteDocumentId} = req.body;
        const selectSql = `select excel_Name
                           from appraisal_excel
                           where excel_id = ?`;
        const deleteSql = `delete
                           from appraisal_excel
                           where excel_id = ?`;
        const result = await pool.execute(selectSql, [deleteDocumentId]);
        const excel_Name = result[0][0]?.excel_Name;
        if (excel_Name) {
            await pool.execute(deleteSql, [deleteDocumentId]); //刪除database data
            this.deleteYearExcelFile(excel_Name);
            return {
                success: 1,
                message: "刪除檔案成功"
            }
        } else {
            return {
                success: -1,
                message: "檔案不存在"
            }
        }
    }
    deleteBonusByIdService = async (req) => {
        const {deleteDocumentId} = req.body;
        const selectSql = `select excel_Name
                           from appraisal_excel
                           where excel_id = ?`;
        const deleteSql = `delete
                           from appraisal_excel
                           where excel_id = ?`;
        const result = await pool.execute(selectSql, [deleteDocumentId]);
        const excel_Name = result[0][0]?.excel_Name;
        if (excel_Name) {
            await pool.execute(deleteSql, [deleteDocumentId]); //刪除database data
            this.deleteBonusFile(excel_Name);
            return {
                success: 1,
                message: "刪除檔案成功"
            }
        } else {
            return {
                success: -1,
                message: "檔案不存在"
            }
        }
    }
    deleteAutBonusByIdService=async (req)=>{
        const {deleteDocumentId} = req.body;
        const selectSql = `select excel_Name
                           from appraisal_excel
                           where excel_id = ?`;
        const deleteSql = `delete
                           from appraisal_excel
                           where excel_id = ?`;
        const result = await pool.execute(selectSql, [deleteDocumentId]);
        const excel_Name = result[0][0]?.excel_Name;
        if (excel_Name) {
            await pool.execute(deleteSql, [deleteDocumentId]); //刪除database data
            this.deleteAutBonusFile(excel_Name);
            return {
                success: 1,
                message: "刪除檔案成功"
            }
        } else {
            return {
                success: -1,
                message: "檔案不存在"
            }
        }
    }

    updateExcelSend = async (req) => {
        const {DocumentId} = req.body;
        const updateSql = `update appraisal_excel
                           set excel_Send=?
                           where excel_id = ?`;
        try {
            const result = await pool.execute(updateSql, ['1', DocumentId]);
            return {
                success: 1,
                message: "送出成功"
            }
        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "修改失敗"
            }
        }
    }
    getExcelNameByIdFetch = async (req) => {
        const {documentId} = req.body;
        const selectSql = `select excel_id, create_userId, excel_Name, excel_Send
                           from appraisal_excel
                           where excel_id = ?`;

        try {
            const result = await pool.execute(selectSql, [documentId]);
            return {
                success: 1,
                message: result[0][0]
            }
        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "查詢失敗"
            }
        }
    }
    getAppraisalTableFetch = async (req) => {
        const {USER_ID, admin_type} = req.mydata;
        let {year} = req.query;  // 前端傳來的年份

        // 若前端沒帶 year，則默認今年（民國年）
        if (!year) {
            year = (new Date().getFullYear() - 1911).toString();
        }

        // 動態年份篩選條件
        let yearCondition = '';
        let yearParams = [];

        if (year !== 'ALL') {
            yearCondition = ' AND create_year_tw = ? ';
            yearParams = [year];
        }

        try {
            let sql = '';
            let result = null;

            if (admin_type === '0') {
                sql = `
                    SELECT excel_id, excel_Name, excel_Send, create_time
                    FROM appraisal_excel
                    WHERE create_userId = ?
                      AND type = ? ${yearCondition}
                    ORDER BY create_time DESC
                `;
                result = await pool.execute(sql, [USER_ID, '1', ...yearParams]);

            } else if (admin_type === '1') {
                sql = `
                    SELECT U.USER_NAME, AE.excel_id, AE.excel_Name, AE.excel_Send, AE.create_time
                    FROM appraisal_excel AE
                             JOIN user_data U ON AE.create_userId = U.USER_ID
                    WHERE (
                              (AE.excel_Send = '1' AND AE.type = ?)
                                  OR (AE.create_userId = '6868' AND AE.type = ?)
                              )
                        ${yearCondition}
                    ORDER BY AE.create_time DESC
                `;
                result = await pool.execute(sql, ['1', '1', ...yearParams]);
            }

            return {
                success: 1,
                message: result[0]
            };

        } catch (e) {
            console.error('getAppraisalTableFetch error:', e);
            return {
                success: -1,
                message: '查詢失敗'
            };
        }
    }


    getYearAppraisalTableFetch = async (req) => {
        const {USER_ID, admin_type} = req.mydata;
        let {year} = req.query;

        // 預設為今年的民國年
        if (!year) {
            year = (new Date().getFullYear() - 1911).toString();
        }

        let yearCondition = '';
        let yearParams = [];

        if (year !== 'ALL') {
            yearCondition = ' AND AE.create_year_tw = ? ';
            yearParams = [year];
        }

        try {
            let sql = '';
            let result = null;

            if (admin_type === '0') {
                sql = `
                    SELECT excel_id, excel_Name, excel_Send, create_time
                    FROM appraisal_excel AE
                    WHERE create_userId = ?
                      AND type = ? ${yearCondition}
                    ORDER BY create_time DESC
                `;
                result = await pool.execute(sql, [USER_ID, '2', ...yearParams]);

            } else if (admin_type === '1') {
                sql = `
                    SELECT U.USER_NAME, AE.excel_id, AE.excel_Name, AE.excel_Send, AE.create_time
                    FROM appraisal_excel AE
                             JOIN user_data U ON AE.create_userId = U.USER_ID
                    WHERE (
                              (AE.excel_Send = '1' AND AE.type = ?)
                                  OR (AE.create_userId = '6868' AND AE.type = ?)
                              )
                        ${yearCondition}
                    ORDER BY AE.create_time DESC
                `;
                result = await pool.execute(sql, ['2', '2', ...yearParams]);
            }

            return {
                success: 1,
                message: result[0]
            };
        } catch (e) {
            console.error('getYearAppraisalTableFetch error:', e);
            return {
                success: -1,
                message: '查詢失敗'
            };
        }
    };

    getBonusTableFetchService = async (req) => {
        const { USER_ID, admin_type } = req.mydata;
        let { year, statusMode = 'all' } = req.query;

        // 預設為今年民國年
        if (!year) {
            year = (new Date().getFullYear() - 1911).toString();
        }

        // 動態年度條件
        let yearCondition = '';
        let yearParams = [];

        if (year !== 'ALL') {
            yearCondition = ' AND AE.create_year_tw = ? ';
            yearParams = [year];
        }

        try {
            let sql = '';
            let params = [];

            /**
             * type = 3 端午
             *
             * 重點：
             * 1. 一定要 LEFT JOIN approval_instance
             * 2. 一定要 LEFT JOIN approval_instance_step
             * 3. 要回傳 approval_status、current_approver_user_id
             * 4. 抽單 withdrawn 不 join，讓它回到未送出
             */
            const baseSelect = `
                SELECT
                    U.USER_NAME,

                    AE.excel_id,
                    AE.excel_Name,
                    AE.excel_Send,
                    AE.create_time,
                    AE.create_year_tw,
                    AE.type,
                    AE.create_userId AS create_user,

                    A.approval_id AS approval_id,
                    A.applicant_user_id AS applicant_user_id,
                    A.status AS approval_status,
                    A.current_step_no AS current_step_no,

                    S.step_name AS current_step_name,
                    S.approver_user_id AS current_approver_user_id,
                    S.approver_name AS current_approver_name,
                    S.status AS current_step_status

                FROM appraisal_excel AE

                         LEFT JOIN user_data U
                                   ON AE.create_userId = U.USER_ID

                         LEFT JOIN approval_instance A
                                   ON A.business_table = 'appraisal_excel'
                                       AND A.business_id = AE.excel_id
                                       AND A.status <> 'withdrawn'

                         LEFT JOIN approval_instance_step S
                                   ON S.approval_id = A.approval_id
                                       AND S.step_no = A.current_step_no
                                       AND S.status = 'pending'
            `;

            /**
             * ✅ 一般使用者
             *
             * 要看到：
             * 1. 自己建立的文件
             * 2. 別人送給自己簽核的文件
             */
            if (admin_type === '0') {
                sql = `
                ${baseSelect}
                WHERE AE.type = ?
                  AND (
                        AE.create_userId = ?
                        OR (
                            A.status = 'pending'
                            AND S.approver_user_id = ?
                        )
                  )
                  ${yearCondition}
                ORDER BY AE.create_time DESC
            `;

                params = [
                    '3',
                    USER_ID,
                    USER_ID,
                    ...yearParams,
                ];
            }

            /**
             * ✅ 管理者 / 主管
             *
             * 要看到：
             * 1. 已送出的文件
             * 2. 自己建立的文件
             * 3. 別人送給自己簽核的文件
             *
             * 這樣郭秘書 / 總幹事才會看到別人送來的。
             */
            else if (admin_type === '1') {
                sql = `
                ${baseSelect}
                WHERE AE.type = ?
                  AND (
                        AE.excel_Send = '1'
                        OR AE.create_userId = ?
                        OR (
                            A.status = 'pending'
                            AND S.approver_user_id = ?
                        )
                  )
                  ${yearCondition}
                ORDER BY AE.create_time DESC
            `;

                params = [
                    '3',
                    USER_ID,
                    USER_ID,
                    ...yearParams,
                ];
            }

            /**
             * ✅ 可選：只看待我簽核
             */
            if (statusMode === 'pendingMine') {
                sql = `
                ${baseSelect}
                WHERE AE.type = ?
                  AND A.status = 'pending'
                  AND S.approver_user_id = ?
                  ${yearCondition}
                ORDER BY AE.create_time DESC
            `;

                params = [
                    '3',
                    USER_ID,
                    ...yearParams,
                ];
            }

            console.log('getBonusTableFetchService SQL =', sql);
            console.log('getBonusTableFetchService params =', params);

            const result = await pool.execute(sql, params);

            return {
                success: 1,
                message: result[0],
            };
        } catch (e) {
            console.error('getBonusTableFetchService error:', e);

            return {
                success: -1,
                message: '查詢失敗',
            };
        }
    };

    getBonusAutTableFetchService = async (req) => {
        const { USER_ID, admin_type } = req.mydata;
        let { year, statusMode = 'all' } = req.query;

        // ✅ 年度處理
        if (!year) {
            year = (new Date().getFullYear() - 1911).toString();
        }

        // ✅ 如果前端傳 115年，轉成 115
        year = String(year).replace('年', '');

        let yearCondition = '';
        let yearParams = [];

        if (year !== 'ALL') {
            yearCondition = ' AND AE.create_year_tw = ? ';
            yearParams = [year];
        }

        try {
            let sql = '';
            let params = [];

            /**
             * ✅ 共用查詢
             *
             * 注意欄位 alias：
             * A.approval_id AS approval_id
             * A.status AS approval_status
             * S.approver_user_id AS current_approver_user_id
             *
             * 前端 ApprovalRowPolicy 會吃這些欄位。
             */
            const baseSelect = `
                SELECT
                    U.USER_NAME,

                    AE.excel_id,
                    AE.excel_Name,
                    AE.excel_Send,
                    AE.create_time,
                    AE.create_year_tw,
                    AE.type,
                    AE.create_userId AS create_user,

                    A.approval_id AS approval_id,
                    A.applicant_user_id AS applicant_user_id,
                    A.status AS approval_status,
                    A.current_step_no AS current_step_no,

                    S.step_name AS current_step_name,
                    S.approver_user_id AS current_approver_user_id,
                    S.approver_name AS current_approver_name,
                    S.status AS current_step_status

                FROM appraisal_excel AE

                         LEFT JOIN user_data U
                                   ON AE.create_userId = U.USER_ID

                         LEFT JOIN approval_instance A
                                   ON A.business_table = 'appraisal_excel'
                                       AND A.business_id = AE.excel_id
                                       AND A.status <> 'withdrawn'

                         LEFT JOIN approval_instance_step S
                                   ON S.approval_id = A.approval_id
                                       AND S.step_no = A.current_step_no
                                       AND S.status = 'pending'
            `;

            /**
             * ✅ 只看待我簽核
             */
            if (statusMode === 'pendingMine') {
                sql = `
                ${baseSelect}
                WHERE AE.type = ?
                  AND A.status = 'pending'
                  AND S.approver_user_id = ?
                  ${yearCondition}
                ORDER BY AE.create_time DESC
            `;

                params = [
                    '4',
                    USER_ID,
                    ...yearParams,
                ];
            }

            /**
             * ✅ 一般使用者
             *
             * 看得到：
             * 1. 自己建立的資料
             * 2. 目前關卡送給自己簽核的資料
             */
            else if (admin_type === '0') {
                sql = `
                ${baseSelect}
                WHERE AE.type = ?
                  AND (
                        AE.create_userId = ?
                        OR (
                            A.status = 'pending'
                            AND S.approver_user_id = ?
                        )
                  )
                  ${yearCondition}
                ORDER BY AE.create_time DESC
            `;

                params = [
                    '4',
                    USER_ID,
                    USER_ID,
                    ...yearParams,
                ];
            }

            /**
             * ✅ 管理者 / 主管
             *
             * 看得到：
             * 1. 已送出的資料
             * 2. 自己建立的資料
             * 3. 目前關卡送給自己簽核的資料
             */
            else if (admin_type === '1') {
                sql = `
                ${baseSelect}
                WHERE AE.type = ?
                  AND (
                        AE.excel_Send = '1'
                        OR AE.create_userId = ?
                        OR (
                            A.status = 'pending'
                            AND S.approver_user_id = ?
                        )
                  )
                  ${yearCondition}
                ORDER BY AE.create_time DESC
            `;

                params = [
                    '4',
                    USER_ID,
                    USER_ID,
                    ...yearParams,
                ];
            }

            console.log('getBonusAutTableFetchService USER_ID =', USER_ID);
            console.log('getBonusAutTableFetchService admin_type =', admin_type);
            console.log('getBonusAutTableFetchService year =', year);
            console.log('getBonusAutTableFetchService statusMode =', statusMode);
            console.log('getBonusAutTableFetchService SQL =', sql);
            console.log('getBonusAutTableFetchService params =', params);

            const result = await pool.execute(sql, params);

            return {
                success: 1,
                message: result ? result[0] : [],
            };
        } catch (e) {
            console.error('getBonusAutTableFetchService error:', e);

            return {
                success: -1,
                message: '查詢失敗',
            };
        }
    };

    checkValueExistArray = (employeeName, ManagerArray) => {
        const isManager = ManagerArray.some(item => item?.USER_NAME === employeeName);
        return isManager;
    }

    checkAppraisalRecord = async (req) => {
        const {excel_name} = req.body;
        const {getEmployeeManagerData} = req;
        const excelPath = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelManager", excel_name);
        try {
            let blankArray = [];
            let checkErrorArray = [];
            const checkWorkBook = new ExcelJS.Workbook();
            await checkWorkBook.xlsx.readFile(excelPath);
            for (let i = 0; i < checkWorkBook.worksheets.length; i++) {
                const employeeName = checkWorkBook.worksheets[i].name;
                const a4 = "工作知能及公文績效";
                const a5 = "創新研究及簡化流程";
                const a6 = "服務態度";
                const a7 = "品德操守";
                const a8 = "領導協調能力";
                const a9 = "年度工作計畫";

                const d4 = checkWorkBook.worksheets[i].getCell("D4").value;
                const d5 = checkWorkBook.worksheets[i].getCell("D5").value;
                const d6 = checkWorkBook.worksheets[i].getCell("D6").value;
                const d7 = checkWorkBook.worksheets[i].getCell("D7").value;
                const d8 = checkWorkBook.worksheets[i].getCell("D8").value;
                const d9 = checkWorkBook.worksheets[i].getCell("D9").value;

                const isManager = this.checkValueExistArray(employeeName, getEmployeeManagerData);
                // console.log(employeeName);
                // console.log(d4, d5, d6, d7, d8, d9);
                // 只要有一個值為空就加入 不含d8 領導協調能力
                if (d4 === null || d5 === null || d6 === null || d7 === null || (d8 === null && isManager) || (d8 !== null && !isManager) || d9 === null) {
                    // 異常資料
                    blankArray.push({
                        sheet: {
                            employeeName,
                            isManager,
                            scores:
                                {
                                    d4: {name: a4, value: d4},
                                    d5: {name: a5, value: d5},
                                    d6: {name: a6, value: d6},
                                    d7: {name: a7, value: d7},
                                    d8: {name: a8, value: d8},
                                    d9: {name: a9, value: d9}
                                }

                        }
                    });
                }
                // 全部資料
                checkErrorArray.push({
                    sheet: {
                        employeeName,
                        isManager,
                        scores:
                            {
                                d4: {name: a4, value: d4},
                                d5: {name: a5, value: d5},
                                d6: {name: a6, value: d6},
                                d7: {name: a7, value: d7},
                                d8: {name: a8, value: d8},
                                d9: {name: a9, value: d9}
                            }

                    }
                });
            }
            // console.log(checkErrorArray);
            return {
                success: 1,
                message: {
                    blankArray: blankArray,
                    checkErrorArray: checkErrorArray
                }
            }


        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "檢核錯誤"
            }
        }
    }

    checkYearAppraisalRecord = async (req) => {
        const {excel_name} = req.body;
        const {getEmployeeManagerData} = req;
        const excelPath = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelYear", excel_name);

        try {
            let blankArray = [];
            let checkErrorArray = [];
            const checkWorkBook = new ExcelJS.Workbook();
            await checkWorkBook.xlsx.readFile(excelPath);
            //不包含參數表
            for (let i = 0; i < checkWorkBook.worksheets.length - 1; i++) {
                const employeeName = checkWorkBook.worksheets[i].name;

                console.log(employeeName);
                const a3 = "工作內容(必填)";
                const a6 = "工作知能及公文績效";
                const a7 = "服務態度、工作積極及品德操守";
                const a8 = "領導協調能力(主管職務) ";
                const a9 = "年度目標達成度";


                const c3 = checkWorkBook.worksheets[i].getCell("C3").value;
                const f6 = checkWorkBook.worksheets[i].getCell("F6").value;
                const f7 = checkWorkBook.worksheets[i].getCell("F7").value;
                const f8 = checkWorkBook.worksheets[i].getCell("F8").value;
                const f9 = checkWorkBook.worksheets[i].getCell("F9").value;


                const isManager = this.checkValueExistArray(employeeName, getEmployeeManagerData);
                // console.log(employeeName);
                // console.log(d4, d5, d6, d7, d8, d9);
                // 只要有一個值為空就加入 不含d8 領導協調能力
                if (c3 === null || f6 === null || f7 === null || (f8 === null && isManager) || (f8 !== null && !isManager) || f9 === null) {
                    // 異常資料
                    blankArray.push({
                        sheet: {
                            employeeName,
                            isManager,
                            scores:
                                {
                                    c3: {name: a3, value: c3},
                                    f6: {name: a6, value: f6},
                                    f7: {name: a7, value: f7},
                                    f8: {name: a8, value: f8},
                                    f9: {name: a9, value: f9},
                                }
                        }
                    });
                }
                // 全部資料
                checkErrorArray.push({
                    sheet: {
                        employeeName,
                        isManager,
                        scores:
                            {
                                c3: {name: a3, value: c3},
                                f6: {name: a6, value: f6},
                                f7: {name: a7, value: f7},
                                f8: {name: a8, value: f8},
                                f9: {name: a9, value: f9},
                            }

                    }
                });
            }

            // console.log(checkErrorArray);
            return {
                success: 1,
                message: {
                    blankArray: blankArray,
                    checkErrorArray: checkErrorArray
                }
            }


        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "檢核錯誤"
            }
        }
    }

    mergeAppraisalExcelAction = async (req) => {
        const {excelArray} = req.body;
        const writeDataArray = [];
        const templateFileName = "員工總表範本.xlsx";
        const outputFolder = "EmployeeAppraisalExcelManager"; // 統一輸出資料夾
        const templatePath = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", templateFileName);

        try {
            const totalWorkBook = await XlsxPopulate.fromFileAsync(templatePath);

            for (const file of excelArray) {
                const workbook = new ExcelJS.Workbook();
                const filePath = path.resolve(__dirname, "../public", "office", "excel", outputFolder, file?.excel_Name);
                await workbook.xlsx.readFile(filePath);

                const isYear = workbook.worksheets.some(ws => ws.name === '參數');

                for (let i = 0; i < (isYear ? workbook.worksheets.length - 1 : workbook.worksheets.length); i++) {
                    const sheet = workbook.worksheets[i];
                    const employeeName = sheet.name;
                    const department = isYear ? sheet.getCell("H2").value : sheet.getCell("E2").value;

                    if (isYear) {
                        const matchRow = OfficeUtils.findMatchingRow(workbook, "參數", 'B', employeeName, 'D');
                        const typeVal = matchRow?.returnValue ?? "";
                        const d13 = sheet.getCell("D13").value?.result ?? "";
                        const d14 = sheet.getCell("D14").value?.result ?? "";
                        writeDataArray.push({mode: 'year', employeeName, department, type: typeVal, d13, d14});
                    } else {
                        const scoreArray = ['D4', 'D5', 'D6', 'D7', 'D8', 'D9']
                            .map(cell => sheet.getCell(cell).value)
                            .filter(val => typeof val === 'number');
                        let getAverage = Math.round(scoreArray.reduce((a, b) => a + b, 0) / scoreArray.length);
                        if (isNaN(getAverage)) getAverage = "";
                        writeDataArray.push({mode: 'normal', employeeName, department, getAverage});
                    }
                }
            }

            const sheet = totalWorkBook.sheet(0);
            const templateStyles = sheet.cell("A2").style([
                'bold', 'italic', 'underline', 'strikethrough', 'fontSize', 'fontFamily', 'fontColor',
                'horizontalAlignment', 'verticalAlignment', 'wrapText', 'shrinkToFit', 'textDirection',
                'textRotation', 'verticalText', 'fill', 'border', 'numberFormat'
            ]);
            const templateHeight = sheet.row(2).height();
            const startRow = 3;

            writeDataArray.forEach((data, idx) => {
                const index = idx + startRow;
                sheet.range(`B${index}:C${index}`).merged(true);
                sheet.cell(`A${index}`).value(data.employeeName).style(templateStyles);
                sheet.cell(`B${index}`).value(data.department).style(templateStyles);
                sheet.cell(`C${index}`).style(templateStyles);

                if (data.mode === 'year') {
                    sheet.cell(`D${index}`).value(data.type).style(templateStyles);
                    sheet.cell(`E${index}`).value(data.d13).style(templateStyles);
                    sheet.cell(`F${index}`).formula(`=IFERROR(_xlfn.IFS(
                    int(E${index})>=90,"優", int(E${index})>=80,"甲", int(E${index})>=70,"乙",
                    int(E${index})>=60,"丙", int(E${index})>=50,"丁", int(E${index})>=0,"戊"),"")`).style(templateStyles);
                    sheet.cell(`G${index}`).value(data.d14).style(templateStyles);
                    sheet.cell(`H${index}`).formula(`=IFERROR(_xlfn.IFS(
                    int(G${index})>=90,"優", int(G${index})>=80,"甲", int(G${index})>=70,"乙",
                    int(G${index})>=60,"丙", int(G${index})>=50,"丁", int(G${index})>=0,"戊"),"")`).style(templateStyles);
                } else {
                    sheet.cell(`D${index}`).value(data.getAverage).style(templateStyles);
                    sheet.cell(`E${index}`).formula(`=IFERROR(_xlfn.IFS(
                    int(D${index})>=90,"優", int(D${index})>=80,"甲", int(D${index})>=70,"乙",
                    int(D${index})>=60,"丙", int(D${index})>=50,"丁", int(D${index})>=0,"戊"),"")`).style(templateStyles);
                }

                sheet.row(index).height(templateHeight);
            });

            const lastRow = writeDataArray.length + startRow;
            sheet.cell(`A${lastRow}`).value(`合計:${writeDataArray.length}人`).style(templateStyles);
            sheet.range(`B${lastRow}:C${lastRow}`).merged(true).style(templateStyles);
            sheet.cell(`D${lastRow}`).style(templateStyles);

            sheet.row(lastRow).height(templateHeight);

            // 平時與年終平均欄位
            const avgE = `ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0)`;
            const avgG = `ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0)`;

            if (writeDataArray.some(x => x.mode === 'year')) {
                sheet.cell(`E${lastRow}`).formula(`=IFERROR("平均:"&${avgE},"")`).style(templateStyles);
                sheet.cell(`F${lastRow}`).formula(`=IFERROR(_xlfn.IFS(
                ${avgE}>=90,"等級:優", ${avgE}>=80,"等級:甲", ${avgE}>=70,"等級:乙",
                ${avgE}>=60,"等級:丙", ${avgE}>=50,"等級:丁", ${avgE}>=0,"等級:戊"),"")`).style(templateStyles);

                sheet.cell(`G${lastRow}`).formula(`=IFERROR("平均:"&${avgG},"")`).style(templateStyles);
                sheet.cell(`H${lastRow}`).formula(`=IFERROR(_xlfn.IFS(
                ${avgG}>=90,"等級:優", ${avgG}>=80,"等級:甲", ${avgG}>=70,"等級:乙",
                ${avgG}>=60,"等級:丙", ${avgG}>=50,"等級:丁", ${avgG}>=0,"等級:戊"),"")`).style(templateStyles);
            } else {
                sheet.cell(`D${lastRow}`).formula(`=IFERROR("平均:"&${avgE},"")`).style(templateStyles);
                sheet.cell(`E${lastRow}`).formula(`=IFERROR(_xlfn.IFS(
                ${avgE}>=90,"等級:優", ${avgE}>=80,"等級:甲", ${avgE}>=70,"等級:乙",
                ${avgE}>=60,"等級:丙", ${avgE}>=50,"等級:丁", ${avgE}>=0,"等級:戊"),"")`).style(templateStyles);
            }

            const fileName = `員工合併考核總表 (${moment().format('YYYY-MM-DD HH-mm-ss')}).xlsx`;
            const savePath = path.resolve(__dirname, "../public", "office", "excel", outputFolder, fileName);
            await totalWorkBook.toFileAsync(savePath);

            setTimeout(() => {
                fs.unlink(savePath, (err) => {
                    if (err) console.error("檔案刪除失敗:", err.message);
                    else console.log("刪除檔案成功");
                });
            }, 30 * 1000);

            return {
                success: 1,
                message: {excelName: fileName}
            };
        } catch (e) {
            console.error(e);
            return {success: -1, message: "合併失敗"};
        }
    };


    mergeYearAppraisalExcelAction = async (req) => {
        const {excelArray} = req?.body;
        console.log(excelArray);
        const writeDataArray = [];

        try {
            const totalWorkBook = await XlsxPopulate.fromFileAsync(path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", "員工總表年終範本.xlsx"));

            for (let i = 0; i < excelArray.length; i++) {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelYear", excelArray[i]?.excel_Name));
                // 有一個參數表不算
                for (let i = 0; i < workbook.worksheets.length - 1; i++) {
                    const scoreArray = [];

                    const employeeName = workbook.worksheets[i].name;
                    const department = workbook.worksheets[i].getCell("H2").value;
                    const matchRow = OfficeUtils.findMatchingRow(workbook, "參數", 'B', employeeName, 'D');
                    console.log(matchRow);
                    const type = matchRow?.returnValue;

                    const d13 = workbook.worksheets[i].getCell("D13").value.result;
                    const d14 = workbook.worksheets[i].getCell("D14").value.result;
                    console.log(d13);
                    writeDataArray.push({employeeName, department, type, d13, d14});
                }
            }

            let templateRange = totalWorkBook.sheet(0).cell("A2");
            let templateStyles = templateRange.style([
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'fontSize',
                'fontFamily',
                'fontColor',
                'horizontalAlignment',
                'verticalAlignment',
                'wrapText',
                'shrinkToFit',
                'textDirection',
                'textRotation',
                'verticalText',
                'fill',
                'border',
                'numberFormat',
            ]);
            // console.log(templateStyles);

            const templateHeight = totalWorkBook.sheet(0).row(2).height();
            const startRow = 3;
            for (let i = 0; i < writeDataArray.length; i++) {
                let index = i + startRow;
                totalWorkBook.sheet(0).range(`B${index}:C${index}`).merged(true);
                totalWorkBook.sheet(0).cell(`A${index}`)
                    .value(writeDataArray[i]?.employeeName)
                    .style(templateStyles);
                totalWorkBook.sheet(0).cell(`C${index}`).style(templateStyles);

                totalWorkBook.sheet(0).cell(`B${index}`)
                    .value(writeDataArray[i]?.department)
                    .style(templateStyles);
                totalWorkBook.sheet(0).cell(`D${index}`)
                    .value(writeDataArray[i]?.type)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`E${index}`)
                    .value(writeDataArray[i]?.d13)
                    .style(templateStyles);
                totalWorkBook.sheet(0).cell(`F${index}`)
                    .formula(`=IFERROR(_xlfn.IFS(
                                        int(E${index})>=90,"優",
                                        int(E${index}>=80),"甲",
                                        int(E${index}>=70),"乙",
                                        int(E${index}>=60),"丙",
                                        int(E${index}>=50),"丁",
                                        int(E${index}>=0), "戊"),"")`)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`H${index}`)
                    .formula(`=IFERROR(_xlfn.IFS(
                                        int(G${index})>=90,"優",
                                        int(G${index}>=80),"甲",
                                        int(G${index}>=70),"乙",
                                        int(G${index}>=60),"丙",
                                        int(G${index}>=50),"丁",
                                        int(G${index}>=0), "戊"),"")`)
                    .style(templateStyles);
                totalWorkBook.sheet(0).cell(`G${index}`)
                    .value(writeDataArray[i]?.d14)
                    .style(templateStyles);

                totalWorkBook.sheet(0).row(index).height(templateHeight);
            }
            const lastRow = writeDataArray.length + startRow

            totalWorkBook.sheet(0).cell(`A${lastRow}`).value(`合計:${writeDataArray.length}人`).style(templateStyles);
            totalWorkBook.sheet(0).row(lastRow).height(templateHeight);
            totalWorkBook.sheet(0).cell(`D${lastRow}`).style(templateStyles);

            totalWorkBook.sheet(0).range(`B${lastRow}:C${lastRow}`).merged(true).style(templateStyles);
            totalWorkBook.sheet(0).cell(`E${lastRow}`).formula(`=IFERROR("平均:"&ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0),"")`).style(templateStyles);
            totalWorkBook.sheet(0).cell(`F${lastRow}`).formula(`=IFERROR(_xlfn.IFS(
                                        ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0)>=90,"等級:優",
                                        ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0)>=80,"等級:甲",
                                        ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0)>=70,"等級:乙",
                                        ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0)>=60,"等級:丙",
                                        ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0)>=50,"等級:丁",
                                        ROUND(AVERAGE(E${startRow}:E${lastRow - 1}),0)>=0, "等級:戊"),"")`).style(templateStyles)

            totalWorkBook.sheet(0).cell(`G${lastRow}`).formula(`=IFERROR("平均:"&ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0),"")`).style(templateStyles);

            totalWorkBook.sheet(0).cell(`H${lastRow}`).formula(`=IFERROR(_xlfn.IFS(
                                        ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0)>=90,"等級:優",
                                        ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0)>=80,"等級:甲",
                                        ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0)>=70,"等級:乙",
                                        ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0)>=60,"等級:丙",
                                        ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0)>=50,"等級:丁",
                                        ROUND(AVERAGE(G${startRow}:G${lastRow - 1}),0)>=0, "等級:戊"),"")`).style(templateStyles)
            // 產生總表

            let date = new Date();
            const currentDateTime = moment(date).format('YYYY-MM-DD HH-mm-ss');
            const fileName = `員工年終考核總表 (${currentDateTime}).xlsx`;
            const pathFileName = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelYear", fileName);
            await totalWorkBook.toFileAsync(pathFileName);

            setTimeout(() => {
                try {
                    fs.unlink(pathFileName, (error) => {
                        if (error) {
                            console.log(error);
                            return false;
                        }
                        console.log('刪除檔案成功');
                    });
                } catch (e) {
                    console.log(e);
                }
            }, 30 * 1000); //30秒

            return {
                success: 1,
                message: {
                    excelName: fileName
                }
            }

        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "合併失敗"
            }
        }
    }

    mergeBonusExcelAction = async (req) => {
        const {excelArray} = req?.body;
        let allEmployeeData = [];
        const startEmployeeRow = 5;

        try {
            const totalWorkBook = await XlsxPopulate.fromFileAsync(path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", "端午發放獎金總表範本.xlsx"));
            for (let i = 0; i < excelArray.length; i++) {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(path.resolve(__dirname, "../public", "office", "excel", "EmployeeBonusExcel", excelArray[i]?.excel_Name));

                const sheetRecord = workbook.worksheets[0];
                const sheetParam = workbook.getWorksheet("參數");

                let currentRow = startEmployeeRow;

                // 1️⃣ 循環紀錄表的 A 欄
                while (true) {
                    const nameCell = sheetRecord.getCell(`A${currentRow}`);
                    const missNameCell = sheetRecord.getCell(`B${currentRow}`);
                    const zeroMonthCell = sheetRecord.getCell(`E${currentRow}`);
                    const pointFiveMonthCell = sheetRecord.getCell(`G${currentRow}`);
                    const oneMonthCell = sheetRecord.getCell(`I${currentRow}`);

                    const name = nameCell.value?.toString().trim();
                    const missName = missNameCell.value?.toString().trim();
                    const zeroMonthValue = zeroMonthCell.value?.toString().trim();
                    const pointFiveMonthValue = pointFiveMonthCell.value?.toString().trim();
                    const oneMonthValue = oneMonthCell.value?.toString().trim()

                    if (!name) break;

                    // 2️⃣ 在參數表中找該姓名對應資料（在 B 欄）
                    let matchedParam = null;
                    sheetParam.eachRow((row, rowNumber) => {
                        const paramName = row.getCell('B').value?.toString().trim();
                        if (paramName === name) {
                            matchedParam = {
                                row: rowNumber,
                                userId: row.getCell('A').value?.toString().trim(),     // 員工編號
                                name: paramName,
                                department: row.getCell('C').value?.toString().trim()  // 單位
                            };
                        }
                    });
                    allEmployeeData.push({
                        row: currentRow,
                        name,
                        missName,
                        zeroMonthValue,
                        pointFiveMonthValue,
                        oneMonthValue,
                        matchedParam
                    });
                    currentRow++;
                }
            }
            console.log(allEmployeeData);

            let templateRange = totalWorkBook.sheet(0).cell("A2");
            let templateStyles = templateRange.style([
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'fontSize',
                'fontFamily',
                'fontColor',
                'horizontalAlignment',
                'verticalAlignment',
                'wrapText',
                'shrinkToFit',
                'textDirection',
                'textRotation',
                'verticalText',
                'fill',
                'border',
                'numberFormat',
            ]);
            // console.log(templateStyles);

            const templateHeight = totalWorkBook.sheet(0).row(2).height();
            const startRow = 3;
            for (let i = 0; i < allEmployeeData.length; i++) {
                let index = i + startRow;

                totalWorkBook.sheet(0).range(`B${index}:C${index}`).merged(true).style(templateStyles); //合併存格
                totalWorkBook.sheet(0).range(`D${index}:E${index}`).merged(true).style(templateStyles); //合併存格

                totalWorkBook.sheet(0).cell(`A${index}`)
                    .value(allEmployeeData[i]?.name)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`B${index}`)
                    .value(allEmployeeData[i]?.missName)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`D${index}`)
                    .value(allEmployeeData[i]?.matchedParam?.department)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`F${index}`)
                    .value(allEmployeeData[i]?.zeroMonthValue)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`G${index}`)
                    .value(allEmployeeData[i]?.pointFiveMonthValue)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`H${index}`)
                    .value(allEmployeeData[i]?.oneMonthValue)
                    .style(templateStyles);

                totalWorkBook.sheet(0).row(index).height(templateHeight);
            }
            const lastRow = allEmployeeData.length + startRow

            totalWorkBook.sheet(0).cell(`A${lastRow}`).value(`合計:${allEmployeeData.length}人`).style(templateStyles);
            totalWorkBook.sheet(0).row(lastRow).height(templateHeight);
            totalWorkBook.sheet(0).range(`B${lastRow}:C${lastRow}`).merged(true).style(templateStyles); //合併存格
            totalWorkBook.sheet(0).range(`D${lastRow}:E${lastRow}`).merged(true).style(templateStyles); //合併存格
            totalWorkBook.sheet(0).range(`F${lastRow}:H${lastRow}`).style(templateStyles); //合併存格

            totalWorkBook.sheet(0).cell(`F${lastRow}`)
                .formula(`=IFERROR(COUNTIF(F${startRow}:F${lastRow - 1},"✔"),"")`)
                .style(templateStyles);

            totalWorkBook.sheet(0).cell(`G${lastRow}`)
                .formula(`=IFERROR(COUNTIF(G${startRow}:G${lastRow - 1},"✔"),"")`)
                .style(templateStyles);

            totalWorkBook.sheet(0).cell(`H${lastRow}`)
                .formula(`=IFERROR(COUNTIF(H${startRow}:H${lastRow - 1},"✔"),"")`)
                .style(templateStyles);

            // 產生總表

            let date = new Date();
            const currentDateTime = moment(date).format('YYYY-MM-DD HH-mm-ss');
            const fileName = `員工獎金總表 (${currentDateTime}).xlsx`;
            const pathFileName = path.resolve(__dirname, "../public", "office", "excel", "EmployeeBonusExcel", fileName);
            await totalWorkBook.toFileAsync(pathFileName);

            setTimeout(() => {
                try {
                    fs.unlink(pathFileName, (error) => {
                        if (error) {
                            console.log(error);
                            return false;
                        }
                        console.log('刪除檔案成功');
                    });
                } catch (e) {
                    console.log(e);
                }
            }, 30 * 1000); //30秒

            return {
                success: 1,
                message: {
                    excelName: fileName
                }
            }

        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "合併失敗"
            }
        }
    }

    mergeAutBonusExcelAction=async (req)=>{
        const {excelArray} = req?.body;
        let allEmployeeData = [];
        const startEmployeeRow = 5;

        try {
            const totalWorkBook = await XlsxPopulate.fromFileAsync(path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", "中秋發放獎金總表範本.xlsx"));
            for (let i = 0; i < excelArray.length; i++) {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(path.resolve(__dirname, "../public", "office", "excel", "EmployeeAutExcel", excelArray[i]?.excel_Name));

                const sheetRecord = workbook.worksheets[0];
                const sheetParam = workbook.getWorksheet("參數");

                let currentRow = startEmployeeRow;

                // 1️⃣ 循環紀錄表的 A 欄
                while (true) {
                    const nameCell = sheetRecord.getCell(`A${currentRow}`);
                    const missNameCell = sheetRecord.getCell(`B${currentRow}`);
                    const zeroMonthCell = sheetRecord.getCell(`E${currentRow}`);
                    const pointFiveMonthCell = sheetRecord.getCell(`G${currentRow}`);
                    const oneMonthCell = sheetRecord.getCell(`I${currentRow}`);

                    const name = nameCell.value?.toString().trim();
                    const missName = missNameCell.value?.toString().trim();
                    const zeroMonthValue = zeroMonthCell.value?.toString().trim();
                    const pointFiveMonthValue = pointFiveMonthCell.value?.toString().trim();
                    const oneMonthValue = oneMonthCell.value?.toString().trim()

                    if (!name) break;

                    // 2️⃣ 在參數表中找該姓名對應資料（在 B 欄）
                    let matchedParam = null;
                    sheetParam.eachRow((row, rowNumber) => {
                        const paramName = row.getCell('B').value?.toString().trim();
                        if (paramName === name) {
                            matchedParam = {
                                row: rowNumber,
                                userId: row.getCell('A').value?.toString().trim(),     // 員工編號
                                name: paramName,
                                department: row.getCell('C').value?.toString().trim()  // 單位
                            };
                        }
                    });
                    allEmployeeData.push({
                        row: currentRow,
                        name,
                        missName,
                        zeroMonthValue,
                        pointFiveMonthValue,
                        oneMonthValue,
                        matchedParam
                    });
                    currentRow++;
                }
            }

            let templateRange = totalWorkBook.sheet(0).cell("A2");
            let templateStyles = templateRange.style([
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'fontSize',
                'fontFamily',
                'fontColor',
                'horizontalAlignment',
                'verticalAlignment',
                'wrapText',
                'shrinkToFit',
                'textDirection',
                'textRotation',
                'verticalText',
                'fill',
                'border',
                'numberFormat',
            ]);
            // console.log(templateStyles);

            const templateHeight = totalWorkBook.sheet(0).row(2).height();
            const startRow = 3;
            for (let i = 0; i < allEmployeeData.length; i++) {
                let index = i + startRow;

                totalWorkBook.sheet(0).range(`B${index}:C${index}`).merged(true).style(templateStyles); //合併存格
                totalWorkBook.sheet(0).range(`D${index}:E${index}`).merged(true).style(templateStyles); //合併存格

                totalWorkBook.sheet(0).cell(`A${index}`)
                    .value(allEmployeeData[i]?.name)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`B${index}`)
                    .value(allEmployeeData[i]?.missName)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`D${index}`)
                    .value(allEmployeeData[i]?.matchedParam?.department)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`F${index}`)
                    .value(allEmployeeData[i]?.zeroMonthValue)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`G${index}`)
                    .value(allEmployeeData[i]?.pointFiveMonthValue)
                    .style(templateStyles);

                totalWorkBook.sheet(0).cell(`H${index}`)
                    .value(allEmployeeData[i]?.oneMonthValue)
                    .style(templateStyles);

                totalWorkBook.sheet(0).row(index).height(templateHeight);
            }
            const lastRow = allEmployeeData.length + startRow

            totalWorkBook.sheet(0).cell(`A${lastRow}`).value(`合計:${allEmployeeData.length}人`).style(templateStyles);
            totalWorkBook.sheet(0).row(lastRow).height(templateHeight);
            totalWorkBook.sheet(0).range(`B${lastRow}:C${lastRow}`).merged(true).style(templateStyles); //合併存格
            totalWorkBook.sheet(0).range(`D${lastRow}:E${lastRow}`).merged(true).style(templateStyles); //合併存格
            totalWorkBook.sheet(0).range(`F${lastRow}:H${lastRow}`).style(templateStyles); //合併存格

            totalWorkBook.sheet(0).cell(`F${lastRow}`)
                .formula(`=IFERROR(COUNTIF(F${startRow}:F${lastRow - 1},"✔"),"")`)
                .style(templateStyles);

            totalWorkBook.sheet(0).cell(`G${lastRow}`)
                .formula(`=IFERROR(COUNTIF(G${startRow}:G${lastRow - 1},"✔"),"")`)
                .style(templateStyles);

            totalWorkBook.sheet(0).cell(`H${lastRow}`)
                .formula(`=IFERROR(COUNTIF(H${startRow}:H${lastRow - 1},"✔"),"")`)
                .style(templateStyles);

            // 產生總表

            let date = new Date();
            const currentDateTime = moment(date).format('YYYY-MM-DD HH-mm-ss');
            const fileName = `員工獎金總表 (${currentDateTime}).xlsx`;
            const pathFileName = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAutExcel", fileName);
            await totalWorkBook.toFileAsync(pathFileName);

            setTimeout(() => {
                try {
                    fs.unlink(pathFileName, (error) => {
                        if (error) {
                            console.log(error);
                            return false;
                        }
                        console.log('刪除檔案成功');
                    });
                } catch (e) {
                    console.log(e);
                }
            }, 30 * 1000); //30秒

            return {
                success: 1,
                message: {
                    excelName: fileName
                }
            }

        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "合併失敗"
            }
        }
    }

    exportOffice = async (req) => {
        const {BRANCH_NAME} = req.mydata;
        const getExcelManagerEmployeeData = JSON.parse(req?.getExcelManagerEmployeeData);

        console.log(getExcelManagerEmployeeData);
        try {
            const workbook = await XlsxPopulate.fromFileAsync(path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", "員工考核紀錄表範本.xlsx"));
            let templateWorkbook = workbook.sheet("紀錄表");

            // 插入公式到 D13
            templateWorkbook.cell("D13").formula(
                `IFERROR(
            IF(
                INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "員工",
                ROUND(SUM(F6*J6, F7*J7, F8*J8, F9*J9), 0),
                IF(
                    INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "主管",
                    ROUND(SUM(F6*H6, F7*H7, F8*H8, F9*H9), 0),
                    ""
                )
            ),
            ""
        )`
            );
            // 插入公式到 D14
            templateWorkbook.cell("D14").formula(
                `IFERROR(
        IF(
            INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "員工",
            ROUND(SUM(F6*K6, F7*K7, F8*K8, F9*K9), 0),
            IF(
                INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "主管",
                ROUND(SUM(F6*I6, F7*I7, F8*I8, F9*I9), 0),
                ""
            )
        ),
        ""
    )`
            );
            for (let i = 0; i < getExcelManagerEmployeeData.length; i++) {
                const {label, BRANCH_NAME,work_content} = getExcelManagerEmployeeData[i];
                // console.log(label, BRANCH_NAME);
                workbook.cloneSheet(templateWorkbook, label);

                workbook.sheet(label).cell("C2").value(label);
                workbook.sheet(label).cell("C3").value(work_content);
                workbook.sheet(label).cell("H2").value(BRANCH_NAME);
            }

            let date = new Date();
            const currentDateTime = moment(date).format('YYYY-MM-DD HH-mm-ss');
            const fileName = `(${BRANCH_NAME}) 員工考核紀錄表 (${currentDateTime}).xlsx`;
            const pathFileName = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelManager", fileName);
            await workbook.toFileAsync(pathFileName);
            const deleteWorkbook = new ExcelJS.Workbook();
            await deleteWorkbook.xlsx.readFile(pathFileName);

            // 新增工作表
            const newSheetName = "參數"; // 新的工作表名稱
            const newSheet = deleteWorkbook.addWorksheet(newSheetName);


            for (let i = 0; i < getExcelManagerEmployeeData.length; i++) {
                const {value, label, BRANCH_NAME, identity} = getExcelManagerEmployeeData[i];
                newSheet.addRow([value, label, BRANCH_NAME, identity]); //
            }

            // 隱藏工作表
            newSheet.state = "hidden";
            // 設置密碼保護
            await newSheet.protect(EXCEL_PASSWORD, {
                selectLockedCells: false,
                selectUnlockedCells: false,
            });
            deleteWorkbook.removeWorksheet("紀錄表");
            console.log(pathFileName);
            await deleteWorkbook.xlsx.writeFile(pathFileName);
            await this.writeOfficeData(req, fileName, date);
            // 保存資料到資料庫
            return {
                success: 1,
                message: "製造成功",
                excelName: fileName
            }

        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "製造Excel發生錯誤"
            }
        }
    }

    exportYearFinalOffice = async (req) => {
        console.log("exportOffice");
        const {BRANCH_NAME} = req.mydata;
        const getExcelManagerEmployeeData = JSON.parse(req?.getExcelManagerEmployeeData);

        console.log(getExcelManagerEmployeeData);
        try {
            const workbook = await XlsxPopulate.fromFileAsync(path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", "員工年終考核紀錄表範本.xlsx"));
            let templateWorkbook = workbook.sheet("紀錄表");

            // 插入公式到 D13
            templateWorkbook.cell("D13").formula(
                `IFERROR(
            IF(
                INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "員工",
                ROUND(SUM(F6*J6, F7*J7, F8*J8, F9*J9), 0),
                IF(
                    INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "主管",
                    ROUND(SUM(F6*H6, F7*H7, F8*H8, F9*H9), 0),
                    ""
                )
            ),
            ""
        )`
            );
            // 插入公式到 D14
            templateWorkbook.cell("D14").formula(
                `IFERROR(
        IF(
            INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "員工",
            ROUND(SUM(F6*K6, F7*K7, F8*K8, F9*K9), 0),
            IF(
                INDEX(參數!$A:$D, MATCH(C2, 參數!$B:$B, 0), 4) = "主管",
                ROUND(SUM(F6*I6, F7*I7, F8*I8, F9*I9), 0),
                ""
            )
        ),
        ""
    )`
            );
            for (let i = 0; i < getExcelManagerEmployeeData.length; i++) {
                const {label, BRANCH_NAME,work_content} = getExcelManagerEmployeeData[i];
                // console.log(label, BRANCH_NAME);
                workbook.cloneSheet(templateWorkbook, label);
                workbook.sheet(label).cell("C2").value(label);
                workbook.sheet(label).cell("C3").value(work_content);
                workbook.sheet(label).cell("H2").value(BRANCH_NAME);
            }

            let date = new Date();
            const currentDateTime = moment(date).format('YYYY-MM-DD HH-mm-ss');
            const fileName = `(${BRANCH_NAME}) 員工年終考核紀錄表 (${currentDateTime}).xlsx`;
            const pathFileName = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelYear", fileName);
            await workbook.toFileAsync(pathFileName);
            const deleteWorkbook = new ExcelJS.Workbook();
            await deleteWorkbook.xlsx.readFile(pathFileName);

            // 新增工作表
            const newSheetName = "參數"; // 新的工作表名稱
            const newSheet = deleteWorkbook.addWorksheet(newSheetName);


            for (let i = 0; i < getExcelManagerEmployeeData.length; i++) {
                const {value, label, BRANCH_NAME, identity} = getExcelManagerEmployeeData[i];
                newSheet.addRow([value, label, BRANCH_NAME, identity]); //
            }

            // 隱藏工作表
            newSheet.state = "hidden";
            // 設置密碼保護
            await newSheet.protect(EXCEL_PASSWORD, {
                selectLockedCells: false,
                selectUnlockedCells: false,
            });
            deleteWorkbook.removeWorksheet("紀錄表");
            console.log(pathFileName);
            await deleteWorkbook.xlsx.writeFile(pathFileName);
            await this.writeYearOfficeData(req, fileName, date);
            // 保存資料到資料庫
            return {
                success: 1,
                message: "製造成功",
                excelName: fileName
            }

        } catch (e) {
            console.log(e);
            return {
                success: -1,
                message: "製造Excel發生錯誤"
            }
        }
    }

    exportBonusOffice = async (req) => {
        let {USER_ID, BRANCH_NAME} = req.mydata;
        const getExcelManagerEmployeeData = JSON.parse(req?.getExcelManagerEmployeeData);
        if (USER_ID === "0035") {
            BRANCH_NAME = "金融部門";
        } else if (USER_ID === "0014") {
            BRANCH_NAME = "總幹事室、經濟、服務部門";
        }

        try {
            // === 步驟 1：先用 XlsxPopulate 複製範本 ===
            const workbook = await XlsxPopulate.fromFileAsync(
                path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", "端午發放獎金調查範本.xlsx")
            );
            const templateWorkbook = workbook.sheet("紀錄表");

            const date = new Date();
            const currentDateTime = moment(date).format('YYYY-MM-DD HH-mm-ss');
            const fileName = `(${BRANCH_NAME}) 端午發放獎金調查紀錄表 (${currentDateTime}).xlsx`;
            const pathFileName = path.resolve(__dirname, "../public", "office", "excel", "EmployeeBonusExcel", fileName);

            await workbook.toFileAsync(pathFileName); // 先輸出原始 Excel

            // === 步驟 2：再用 exceljs 寫入 BCD 合併欄位 ===
            const exceljsWorkbook = new ExcelJS.Workbook();
            await exceljsWorkbook.xlsx.readFile(pathFileName);

            const worksheet = exceljsWorkbook.getWorksheet("紀錄表");

            // 目標：將 B1 合併，並寫入「單位：xxx」
            const cell = worksheet.getCell('B2');
            cell.value = `單位:${BRANCH_NAME}`;
            cell.font = {
                name: '標楷體',
                size: 14,
                bold: false
            };
            cell.alignment = {
                vertical: 'top',
                horizontal: 'center'
            };

            // 4. 從 A4 開始寫入員工資料
            const startRow = 5;
            getExcelManagerEmployeeData.forEach((emp, i) => {
                const rowNumber = startRow + i;
                const row = worksheet.getRow(rowNumber);
                row.height = 30;
                // A 欄：姓名
                const nameCell = worksheet.getCell(`A${rowNumber}`);
                nameCell.value = emp.label;
                // B~D 欄合併 → 職稱
                worksheet.mergeCells(`B${rowNumber}:D${rowNumber}`);
                const titleCell = worksheet.getCell(`B${rowNumber}`);
                titleCell.value = emp.MISS_NAME;
                // E~F、G~H、I~J：都合併（先做）

                worksheet.mergeCells(`E${rowNumber}:F${rowNumber}`);
                worksheet.mergeCells(`G${rowNumber}:H${rowNumber}`);
                worksheet.mergeCells(`I${rowNumber}:J${rowNumber}`);
                // ✅ 加入 E、G、I 欄下拉選單（✔ / 空白）
                ['E', 'G', 'I'].forEach(col => {
                    const cell = worksheet.getCell(`${col}${rowNumber}`);
                    cell.dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: ['"✔,"'], // ✔ 或空白
                        showDropDown: true,
                        showErrorMessage: true,
                        errorTitle: '輸入錯誤',
                        error: '請從選單中選擇 ✔ 或留空'
                    };
                });

                // 設定 A～J 欄格式（統一置中 + 字型 + 邊框）
                for (let col = 1; col <= 10; col++) {
                    const cell = worksheet.getRow(rowNumber).getCell(col);
                    cell.font = {name: '標楷體', size: 12};
                    cell.alignment = {vertical: 'middle', horizontal: 'center'};
                    cell.border = {
                        top: {style: 'thin'},
                        bottom: {style: 'thin'},
                        left: {style: 'thin'},
                        right: {style: 'thin'}
                    };
                }

                // P:T 合併 + 顯示驗證結果
                worksheet.mergeCells(`N${rowNumber}:Q${rowNumber}`);
                const formulaCell = worksheet.getCell(`P${rowNumber}`);
                formulaCell.font = {
                    name: '標楷體',
                    size: 12,
                    color: {argb: 'FFFF0000'}  // 紅色
                };
                formulaCell.alignment = {vertical: 'middle', horizontal: 'center'};

                // ✅ 加入公式：如果 ✔ 數不是 1，顯示錯誤文字
                formulaCell.value = {
                    formula: `IF((E${rowNumber}="✔")+(G${rowNumber}="✔")+(I${rowNumber}="✔")<>1,"請選擇唯一一項建議發放月份","")`,
                    result: ""
                };

                worksheet.protect('yourPassword', {
                    selectLockedCells: false,
                    selectUnlockedCells: true
                });
                // ❗️將其它欄位解除鎖定（預設都是 locked）
                ['E', 'G', 'I'].forEach(col => {
                    const cell = worksheet.getCell(`${col}${rowNumber}`);
                    cell.protection = {locked: false};
                });

            });

            // 新增工作表
            const newSheetName = "參數"; // 新的工作表名稱
            const newSheet = exceljsWorkbook.addWorksheet(newSheetName);

            for (let i = 0; i < getExcelManagerEmployeeData.length; i++) {
                const {value, label, BRANCH_NAME} = getExcelManagerEmployeeData[i];
                newSheet.addRow([value, label, BRANCH_NAME]); //
            }

            // 隱藏工作表
            newSheet.state = "hidden";
            // 設置密碼保護
            await newSheet.protect(EXCEL_PASSWORD, {
                selectLockedCells: false,
                selectUnlockedCells: false,
            });

            // 儲存修改
            await exceljsWorkbook.xlsx.writeFile(pathFileName);

            // 儲存紀錄
            await this.writeBonusData(req, fileName, date);

            return {
                success: 1,
                message: "製造成功",
                excelName: fileName
            };

        } catch (e) {
            console.error(e);
            return {
                success: -1,
                message: "製造Excel發生錯誤"
            };
        }
    };

    exportBonusAutExcelOffice=async (req)=>{
        let {USER_ID, BRANCH_NAME} = req.mydata;
        const getExcelManagerEmployeeData = JSON.parse(req?.getExcelManagerEmployeeData);
        if (USER_ID === "0035") {
            BRANCH_NAME = "金融部門";
        } else if (USER_ID === "0014") {
            BRANCH_NAME = "總幹事室、經濟、服務部門";
        }

        try {
            // === 步驟 1：先用 XlsxPopulate 複製範本 ===
            const workbook = await XlsxPopulate.fromFileAsync(
                path.resolve(__dirname, "../public", "office", "excel", "EmployeeAppraisalExcelTemplate", "中秋發放獎金調查範本.xlsx")
            );
            const templateWorkbook = workbook.sheet("紀錄表");

            const date = new Date();
            const currentDateTime = moment(date).format('YYYY-MM-DD HH-mm-ss');
            const fileName = `(${BRANCH_NAME}) 中秋發放獎金調查紀錄表 (${currentDateTime}).xlsx`;
            const pathFileName = path.resolve(__dirname, "../public", "office", "excel", "EmployeeAutExcel", fileName);

            await workbook.toFileAsync(pathFileName); // 先輸出原始 Excel

            // === 步驟 2：再用 exceljs 寫入 BCD 合併欄位 ===
            const exceljsWorkbook = new ExcelJS.Workbook();
            await exceljsWorkbook.xlsx.readFile(pathFileName);

            const worksheet = exceljsWorkbook.getWorksheet("紀錄表");

            // 目標：將 B1 合併，並寫入「單位：xxx」
            const cell = worksheet.getCell('B2');
            cell.value = `單位:${BRANCH_NAME}`;
            cell.font = {
                name: '標楷體',
                size: 14,
                bold: false
            };
            cell.alignment = {
                vertical: 'top',
                horizontal: 'center'
            };

            // 4. 從 A4 開始寫入員工資料
            const startRow = 5;
            getExcelManagerEmployeeData.forEach((emp, i) => {
                const rowNumber = startRow + i;
                const row = worksheet.getRow(rowNumber);
                row.height = 30;
                // A 欄：姓名
                const nameCell = worksheet.getCell(`A${rowNumber}`);
                nameCell.value = emp.label;
                // B~D 欄合併 → 職稱
                worksheet.mergeCells(`B${rowNumber}:D${rowNumber}`);
                const titleCell = worksheet.getCell(`B${rowNumber}`);
                titleCell.value = emp.MISS_NAME;
                // E~F、G~H、I~J：都合併（先做）

                worksheet.mergeCells(`E${rowNumber}:F${rowNumber}`);
                worksheet.mergeCells(`G${rowNumber}:H${rowNumber}`);
                worksheet.mergeCells(`I${rowNumber}:J${rowNumber}`);
                // ✅ 加入 E、G、I 欄下拉選單（✔ / 空白）
                ['E', 'G', 'I'].forEach(col => {
                    const cell = worksheet.getCell(`${col}${rowNumber}`);
                    cell.dataValidation = {
                        type: 'list',
                        allowBlank: true,
                        formulae: ['"✔,"'], // ✔ 或空白
                        showDropDown: true,
                        showErrorMessage: true,
                        errorTitle: '輸入錯誤',
                        error: '請從選單中選擇 ✔ 或留空'
                    };
                });

                // 設定 A～J 欄格式（統一置中 + 字型 + 邊框）
                for (let col = 1; col <= 10; col++) {
                    const cell = worksheet.getRow(rowNumber).getCell(col);
                    cell.font = {name: '標楷體', size: 12};
                    cell.alignment = {vertical: 'middle', horizontal: 'center'};
                    cell.border = {
                        top: {style: 'thin'},
                        bottom: {style: 'thin'},
                        left: {style: 'thin'},
                        right: {style: 'thin'}
                    };
                }

                // P:T 合併 + 顯示驗證結果
                worksheet.mergeCells(`N${rowNumber}:Q${rowNumber}`);
                const formulaCell = worksheet.getCell(`P${rowNumber}`);
                formulaCell.font = {
                    name: '標楷體',
                    size: 12,
                    color: {argb: 'FFFF0000'}  // 紅色
                };
                formulaCell.alignment = {vertical: 'middle', horizontal: 'center'};

                // ✅ 加入公式：如果 ✔ 數不是 1，顯示錯誤文字
                formulaCell.value = {
                    formula: `IF((E${rowNumber}="✔")+(G${rowNumber}="✔")+(I${rowNumber}="✔")<>1,"請選擇唯一一項建議發放月份","")`,
                    result: ""
                };

                worksheet.protect('yourPassword', {
                    selectLockedCells: false,
                    selectUnlockedCells: true
                });
                // ❗️將其它欄位解除鎖定（預設都是 locked）
                ['E', 'G', 'I'].forEach(col => {
                    const cell = worksheet.getCell(`${col}${rowNumber}`);
                    cell.protection = {locked: false};
                });

            });

            // 新增工作表
            const newSheetName = "參數"; // 新的工作表名稱
            const newSheet = exceljsWorkbook.addWorksheet(newSheetName);

            for (let i = 0; i < getExcelManagerEmployeeData.length; i++) {
                const {value, label, BRANCH_NAME} = getExcelManagerEmployeeData[i];
                newSheet.addRow([value, label, BRANCH_NAME]); //
            }

            // 隱藏工作表
            newSheet.state = "hidden";
            // 設置密碼保護
            await newSheet.protect(EXCEL_PASSWORD, {
                selectLockedCells: false,
                selectUnlockedCells: false,
            });

            // 儲存修改
            await exceljsWorkbook.xlsx.writeFile(pathFileName);

            // 儲存紀錄
            await this.writeAutBonusData(req, fileName, date);

            return {
                success: 1,
                message: "製造成功",
                excelName: fileName
            };

        } catch (e) {
            console.error(e);
            return {
                success: -1,
                message: "製造Excel發生錯誤"
            };
        }
    }
}

module.exports = new OfficeService();