const pool = require("../connect/connect");

class OfficeFileVersionService {
    /**
     * ✅ 查詢下一個版本號
     *
     * 同一份 excel_id：
     * V001、V002、V003 ...
     */
    getNextExcelFileVersionNo = async (conn, excelId) => {
        const [rows] = await conn.execute(
            `
                SELECT COALESCE(MAX(version_no), 0) + 1 AS next_version_no
                FROM appraisal_excel_file_version
                WHERE excel_id = ?
            `,
            [excelId]
        );

        return rows?.[0]?.next_version_no || 1;
    };

    /**
     * ✅ 依 version_key 查詢既有版本
     *
     * 同一份 Excel、同一個 version_key：
     * 代表同一個人、同一個簽核階段的最新歷史版本。
     */
    getExcelFileVersionByKey = async (conn, excelId, versionKey) => {
        const [rows] = await conn.execute(
            `
                SELECT
                    id,
                    excel_id,
                    approval_id,
                    approval_step_id,
                    version_key,
                    version_no,
                    version_type,
                    editor_user_id,
                    editor_user_name,
                    editor_miss_name,
                    editor_branch_name,
                    original_file_name,
                    version_file_name,
                    version_file_path,
                    remark,
                    created_at,
                    updated_at
                FROM appraisal_excel_file_version
                WHERE excel_id = ?
                  AND version_key = ?
                    LIMIT 1
            `,
            [excelId, versionKey]
        );

        return rows?.[0] || null;
    };

    /**
     * ✅ 依歷史版本 ID 查詢單筆歷史文件
     *
     * 給 OnlyOffice 歷史預覽頁使用。
     *
     * 安全重點：
     * 1. 前端只帶 historyVersionId
     * 2. 後端用 excelId + historyVersionId 一起查
     * 3. 不讓前端直接傳 historyFilePath
     * 4. 避免使用者竄改 URL 偷看其他檔案
     */
    getExcelFileVersionById = async ({ excelId, historyVersionId }) => {
        const conn = await pool.getConnection();

        try {
            if (!excelId) {
                return {
                    success: -1,
                    message: "缺少 excelId",
                };
            }

            if (!historyVersionId) {
                return {
                    success: -1,
                    message: "缺少 historyVersionId",
                };
            }

            const [rows] = await conn.execute(
                `
                    SELECT
                        id,
                        excel_id,
                        approval_id,
                        approval_step_id,
                        version_key,
                        version_no,
                        version_type,
                        editor_user_id,
                        editor_user_name,
                        editor_miss_name,
                        editor_branch_name,
                        original_file_name,
                        version_file_name,
                        version_file_path,
                        remark,
                        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
                    FROM appraisal_excel_file_version
                    WHERE id = ?
                      AND excel_id = ?
                    LIMIT 1
                `,
                [historyVersionId, excelId]
            );

            if (!rows?.[0]) {
                return {
                    success: -1,
                    message: "查無歷史文件版本",
                };
            }

            return {
                success: 1,
                message: rows[0],
            };
        } catch (e) {
            console.error("getExcelFileVersionById error:", e);

            return {
                success: -1,
                message: e.message || "查詢歷史文件版本失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * ✅ 新增 Excel 歷史版本紀錄
     *
     * 注意：
     * 這是「純新增」。
     * 新版建議 Controller 優先使用 upsertExcelFileVersion，
     * 避免同一個人同一階段修改多次時一直新增版本。
     */
    insertExcelFileVersion = async (
        conn,
        {
            excelId,
            approvalId,
            approvalStepId,
            versionKey,
            versionNo,
            versionType,
            editorUser,
            originalFileName,
            versionFileName,
            versionFilePath,
            remark,
        }
    ) => {
        const [result] = await conn.execute(
            `
                INSERT INTO appraisal_excel_file_version (
                    excel_id,
                    approval_id,
                    approval_step_id,
                    version_key,
                    version_no,
                    version_type,
                    editor_user_id,
                    editor_user_name,
                    editor_miss_name,
                    editor_branch_name,
                    original_file_name,
                    version_file_name,
                    version_file_path,
                    remark
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                excelId,
                approvalId || null,
                approvalStepId || null,
                versionKey || null,
                versionNo,
                versionType || "edit_snapshot",

                editorUser?.USER_ID || null,
                editorUser?.USER_NAME || null,
                editorUser?.MISS_NAME || null,
                editorUser?.BRANCH_NAME || null,

                originalFileName,
                versionFileName,
                versionFilePath,
                remark || null,
            ]
        );

        return result;
    };

    /**
     * ✅ 更新既有 Excel 歷史版本紀錄
     *
     * 同一個 version_key 已存在時：
     * 只更新這一筆，不新增 version_no。
     */
    updateExcelFileVersionByKey = async (
        conn,
        {
            excelId,
            versionKey,
            approvalId,
            approvalStepId,
            versionType,
            editorUser,
            originalFileName,
            versionFileName,
            versionFilePath,
            remark,
        }
    ) => {
        const [result] = await conn.execute(
            `
                UPDATE appraisal_excel_file_version
                SET
                    approval_id = ?,
                    approval_step_id = ?,
                    version_type = ?,
                    editor_user_id = ?,
                    editor_user_name = ?,
                    editor_miss_name = ?,
                    editor_branch_name = ?,
                    original_file_name = ?,
                    version_file_name = ?,
                    version_file_path = ?,
                    remark = ?,
                    updated_at = NOW()
                WHERE excel_id = ?
                  AND version_key = ?
            `,
            [
                approvalId || null,
                approvalStepId || null,
                versionType || "edit_snapshot",

                editorUser?.USER_ID || null,
                editorUser?.USER_NAME || null,
                editorUser?.MISS_NAME || null,
                editorUser?.BRANCH_NAME || null,

                originalFileName,
                versionFileName,
                versionFilePath,
                remark || null,

                excelId,
                versionKey,
            ]
        );

        return result;
    };

    /**
     * ✅ 核心方法：有就更新，沒有才新增
     *
     * 用途：
     * - 郭秘書同一關卡改 10 次：
     *   只會有 V002 一筆，檔案和 DB 都更新 V002。
     *
     * - 退回給黃明田後，黃明田重新修改：
     *   version_key 不同，才會新增 V003。
     *
     * - 再送給郭秘書後，郭秘書第二輪修改：
     *   version_key 不同，才會新增 V004。
     */
    upsertExcelFileVersion = async (
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
            versionFilePath,
            remark,
        }
    ) => {
        if (!excelId) {
            throw new Error("upsertExcelFileVersion 缺少 excelId");
        }

        if (!versionKey) {
            throw new Error("upsertExcelFileVersion 缺少 versionKey");
        }

        const oldVersion = await this.getExcelFileVersionByKey(
            conn,
            excelId,
            versionKey
        );

        /**
         * ✅ 已存在：
         * 更新同一筆，不增加 version_no。
         */
        if (oldVersion) {
            await this.updateExcelFileVersionByKey(conn, {
                excelId,
                versionKey,
                approvalId,
                approvalStepId,
                versionType,
                editorUser,
                originalFileName,
                versionFileName,
                versionFilePath,
                remark,
            });

            return {
                isNew: false,
                versionNo: oldVersion.version_no,
                versionKey,
                versionFileName,
                versionFilePath,
            };
        }

        /**
         * ✅ 不存在：
         * 新增新版本。
         */
        const versionNo = await this.getNextExcelFileVersionNo(conn, excelId);

        await this.insertExcelFileVersion(conn, {
            excelId,
            approvalId,
            approvalStepId,
            versionKey,
            versionNo,
            versionType,
            editorUser,
            originalFileName,
            versionFileName,
            versionFilePath,
            remark,
        });

        return {
            isNew: true,
            versionNo,
            versionKey,
            versionFileName,
            versionFilePath,
        };
    };

    /**
     * ✅ 查詢某一份 Excel 的所有歷史版本
     */
    getExcelFileVersionsByExcelId = async (excelId) => {
        const conn = await pool.getConnection();

        try {
            const [rows] = await conn.execute(
                `
                    SELECT
                        id,
                        excel_id,
                        approval_id,
                        approval_step_id,
                        version_key,
                        version_no,
                        version_type,
                        editor_user_id,
                        editor_user_name,
                        editor_miss_name,
                        editor_branch_name,
                        original_file_name,
                        version_file_name,
                        version_file_path,
                        remark,
                        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                        DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
                    FROM appraisal_excel_file_version
                    WHERE excel_id = ?
                    ORDER BY version_no ASC
                `,
                [excelId]
            );

            return {
                success: 1,
                message: rows,
            };
        } catch (e) {
            console.error("getExcelFileVersionsByExcelId error:", e);

            return {
                success: -1,
                message: e.message || "查詢 Excel 歷史版本失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * ✅ 單獨建立或更新版本紀錄
     *
     * 不建議 Controller callback 直接用這個，
     * 因為 callback 那邊通常已經自己開 transaction。
     *
     * 但如果你在其他 service 裡沒有 conn，可以用這個。
     */
    createOrUpdateExcelFileVersionRecord = async ({
                                                      excelId,
                                                      approvalId,
                                                      approvalStepId,
                                                      versionKey,
                                                      versionType,
                                                      editorUser,
                                                      originalFileName,
                                                      versionFileName,
                                                      versionFilePath,
                                                      remark,
                                                  }) => {
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            const result = await this.upsertExcelFileVersion(conn, {
                excelId,
                approvalId,
                approvalStepId,
                versionKey,
                versionType,
                editorUser,
                originalFileName,
                versionFileName,
                versionFilePath,
                remark,
            });

            await conn.commit();

            return {
                success: 1,
                message: result,
            };
        } catch (e) {
            await conn.rollback();

            console.error("createOrUpdateExcelFileVersionRecord error:", e);

            return {
                success: -1,
                message: e.message || "建立或更新 Excel 歷史版本紀錄失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * ✅ 給 OfficeController 共用 transaction 使用
     *
     * Controller 已經開 conn / transaction 時，用這個。
     */
    createOrUpdateExcelFileVersionRecordWithConn = async (
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
            versionFilePath,
            remark,
        }
    ) => {
        return await this.upsertExcelFileVersion(conn, {
            excelId,
            approvalId,
            approvalStepId,
            versionKey,
            versionType,
            editorUser,
            originalFileName,
            versionFileName,
            versionFilePath,
            remark,
        });
    };

    /**
     * ✅ 舊方法保留：純新增版本
     *
     * 如果舊 Controller 還有呼叫 createExcelFileVersionRecord，
     * 先保留避免報錯。
     *
     * 但新版歷史版本邏輯建議改用：
     * createOrUpdateExcelFileVersionRecord
     */
    createExcelFileVersionRecord = async ({
                                              excelId,
                                              approvalId,
                                              approvalStepId,
                                              versionKey,
                                              versionType,
                                              editorUser,
                                              originalFileName,
                                              versionFileName,
                                              versionFilePath,
                                              remark,
                                          }) => {
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            const versionNo = await this.getNextExcelFileVersionNo(conn, excelId);

            await this.insertExcelFileVersion(conn, {
                excelId,
                approvalId,
                approvalStepId,
                versionKey,
                versionNo,
                versionType,
                editorUser,
                originalFileName,
                versionFileName,
                versionFilePath,
                remark,
            });

            await conn.commit();

            return {
                success: 1,
                message: {
                    versionNo,
                    versionKey,
                    versionFileName,
                    versionFilePath,
                },
            };
        } catch (e) {
            await conn.rollback();

            console.error("createExcelFileVersionRecord error:", e);

            return {
                success: -1,
                message: e.message || "建立 Excel 歷史版本紀錄失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * ✅ 舊方法保留：純新增版本，給 Controller 共用 transaction 使用
     *
     * 新版建議改用：
     * createOrUpdateExcelFileVersionRecordWithConn
     */
    createExcelFileVersionRecordWithConn = async (
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
            versionFilePath,
            remark,
        }
    ) => {
        const versionNo = await this.getNextExcelFileVersionNo(conn, excelId);

        await this.insertExcelFileVersion(conn, {
            excelId,
            approvalId,
            approvalStepId,
            versionKey,
            versionNo,
            versionType,
            editorUser,
            originalFileName,
            versionFileName,
            versionFilePath,
            remark,
        });

        return {
            versionNo,
            versionKey,
            versionFileName,
            versionFilePath,
        };
    };
}

module.exports = new OfficeFileVersionService();