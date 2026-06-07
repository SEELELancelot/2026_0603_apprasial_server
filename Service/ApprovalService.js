const pool = require("../connect/connect");

class ApprovalService {
    /**
     * 金融部門
     */
    financeBranchIds = [
        "08",
        "05",
        "06",
        "14",
        "12",
        "13",
        "10",
        "11",
        "09",
        "15",
    ];

    /**
     * 依 USER_ID 取得當下人員快照
     */
    getUserSnapshotByUserId = async (conn, userId) => {
        const [rows] = await conn.execute(
            `
      SELECT
          U.USER_ID,
          U.USER_NAME,
          W.MISS_ID,
          W.MISS_NAME,
          B.BRANCH_ID,
          B.BRANCH_NAME
      FROM user_data U
      JOIN work_mission W
          ON U.MISS_ID = W.MISS_ID
      JOIN branch_info B
          ON W.BRANCH_ID = B.BRANCH_ID
      WHERE U.USER_ID = ?
        AND U.USER_STATUS != '0'
        AND U.DELETE_FLAG != 'Y'
      LIMIT 1
      `,
            [userId]
        );

        return rows[0] || null;
    };

    /**
     * 依 role_key 取得簽核角色人員快照
     */
    getRoleUserSnapshot = async (conn, roleKey) => {
        const [rows] = await conn.execute(
            `
      SELECT
          R.role_key,
          R.role_name,
          U.USER_ID,
          U.USER_NAME,
          W.MISS_ID,
          W.MISS_NAME,
          B.BRANCH_ID,
          B.BRANCH_NAME
      FROM approval_role_user R
      JOIN user_data U
          ON R.user_id = U.USER_ID
      JOIN work_mission W
          ON U.MISS_ID = W.MISS_ID
      JOIN branch_info B
          ON W.BRANCH_ID = B.BRANCH_ID
      WHERE R.role_key = ?
        AND R.enable = 1
        AND U.USER_STATUS != '0'
        AND U.DELETE_FLAG != 'Y'
      LIMIT 1
      `,
            [roleKey]
        );

        return rows[0] || null;
    };

    /**
     * 依文件取得申請人快照
     */
    getApplicantByBusiness = async (conn, businessTable, businessId) => {
        if (businessTable !== "appraisal_excel") {
            throw new Error("目前只支援 appraisal_excel");
        }

        const [rows] = await conn.execute(
            `
      SELECT
          AE.excel_id,
          AE.excel_Name,
          AE.type,
          AE.create_userId,

          U.USER_ID,
          U.USER_NAME,
          W.MISS_ID,
          W.MISS_NAME,
          B.BRANCH_ID,
          B.BRANCH_NAME
      FROM appraisal_excel AE
      JOIN user_data U
          ON AE.create_userId = U.USER_ID
      JOIN work_mission W
          ON U.MISS_ID = W.MISS_ID
      JOIN branch_info B
          ON W.BRANCH_ID = B.BRANCH_ID
      WHERE AE.excel_id = ?
      LIMIT 1
      `,
            [businessId]
        );

        if (rows.length === 0) {
            throw new Error("找不到文件資料");
        }

        return rows[0];
    };

    /**
     * 判斷是否為秘書
     */
    isSecretary = (user) => {
        return (
            user?.USER_ID === "0014" ||
            user?.USER_ID === "0035" ||
            String(user?.MISS_NAME || "").includes("秘書")
        );
    };

    /**
     * 判斷是否為總幹事
     */
    isGeneralManager = (user) => {
        return (
            user?.USER_ID === "6868" ||
            String(user?.MISS_NAME || "").includes("總幹事")
        );
    };

    /**
     * 判斷是否為主管 / 主任
     */
    isDirector = (user) => {
        const missName = String(user?.MISS_NAME || "");

        return (
            missName.includes("主任") ||
            missName.includes("股長") ||
            missName.includes("幹事代主任")
        );
    };

    /**
     * 建立端午 / 中秋 / 考核簽核關卡
     *
     * 規則：
     * 1. 總幹事建立：直接完成，沒有關卡
     * 2. 秘書建立：總幹事
     * 3. 主任建立：金融秘書 / 經濟服務秘書 -> 總幹事
     */
    buildApprovalSteps = async (conn, applicant) => {
        const steps = [];

        const generalManager = await this.getRoleUserSnapshot(
            conn,
            "general_manager"
        );

        if (!generalManager) {
            throw new Error("找不到總幹事設定");
        }

        // 總幹事自己建立，直接完成
        if (this.isGeneralManager(applicant)) {
            return [];
        }

        // 秘書建立：只給總幹事
        if (this.isSecretary(applicant)) {
            steps.push({
                step_no: 1,
                step_name: "總幹事審核",
                approver: generalManager,
                status: "pending",
            });

            return steps;
        }

        // 主任建立：先秘書，再總幹事
        if (this.isDirector(applicant)) {
            const isFinance = this.financeBranchIds.includes(
                String(applicant.BRANCH_ID)
            );

            const secretaryRoleKey = isFinance
                ? "finance_secretary"
                : "service_secretary";

            const secretary = await this.getRoleUserSnapshot(conn, secretaryRoleKey);

            if (!secretary) {
                throw new Error(
                    isFinance ? "找不到金融秘書設定" : "找不到經濟服務部門秘書設定"
                );
            }

            steps.push({
                step_no: 1,
                step_name: isFinance ? "金融秘書審核" : "經濟服務部門秘書審核",
                approver: secretary,
                status: "pending",
            });

            steps.push({
                step_no: 2,
                step_name: "總幹事審核",
                approver: generalManager,
                status: "waiting",
            });

            return steps;
        }

        throw new Error("目前此職稱不允許送出簽核");
    };

    /**
     * 將 steps 轉成前端 ApprovalSignModal 需要格式
     */
    formatPreviewSteps = (steps) => {
        return steps.map((step) => ({
            step_no: step.step_no,
            step_name: step.step_name,

            approver_user_id: step.approver.USER_ID,
            approver_name: step.approver.USER_NAME,
            approver_miss_id: step.approver.MISS_ID,
            approver_miss_name: step.approver.MISS_NAME,
            approver_branch_id: step.approver.BRANCH_ID,
            approver_branch_name: step.approver.BRANCH_NAME,

            status: 'waiting',

            action: null,
            opinion: '',
            action_time: null,
        }));
    };

    buildApplicantCurrentStep = (applicant) => {
        return {
            step_no: 0,
            step_name: '填報者送出',
            approver_user_id: applicant.USER_ID,
            approver_name: applicant.USER_NAME,
            approver_miss_id: applicant.MISS_ID,
            approver_miss_name: applicant.MISS_NAME,
            approver_branch_id: applicant.BRANCH_ID,
            approver_branch_name: applicant.BRANCH_NAME,
            status: 'draft',
            action: null,
            opinion: '',
            action_time: null,
        };
    };

    /**
     * 查詢簽核 instance
     */
    getInstanceByBusiness = async (conn, businessTable, businessId) => {
        const [rows] = await conn.execute(
            `
      SELECT *
      FROM approval_instance
      WHERE business_table = ?
        AND business_id = ?
      LIMIT 1
      `,
            [businessTable, businessId]
        );

        return rows[0] || null;
    };

    /**
     * 查詢關卡
     */
    getStepsByApprovalId = async (conn, approvalId) => {
        const [rows] = await conn.execute(
            `
      SELECT
          step_id,
          approval_id,
          step_no,
          step_name,
          approver_user_id,
          approver_name,
          approver_miss_id,
          approver_miss_name,
          approver_branch_id,
          approver_branch_name,
          status,
          action,
          opinion,
          DATE_FORMAT(action_time, '%Y-%m-%d %H:%i:%s') AS action_time,
          DATE_FORMAT(create_time, '%Y-%m-%d %H:%i:%s') AS create_time
      FROM approval_instance_step
      WHERE approval_id = ?
      ORDER BY step_no ASC
      `,
            [approvalId]
        );

        return rows;
    };

    /**
     * 查詢操作紀錄
     */
    getLogsByApprovalId = async (conn, approvalId) => {
        const [rows] = await conn.execute(
            `
      SELECT
          log_id,
          approval_id,
          action_user_id,
          action_user_name,
          action_miss_id,
          action_miss_name,
          action_branch_id,
          action_branch_name,
          action_type,
          opinion,
          from_step_no,
          DATE_FORMAT(action_time, '%Y-%m-%d %H:%i:%s') AS action_time
      FROM approval_action_log
      WHERE approval_id = ?
      ORDER BY action_time ASC, log_id ASC
      `,
            [approvalId]
        );

        return rows;
    };

    /**
     * 組成前端 modal 資料
     */
    buildApprovalInfo = async (conn, instance, applicant, steps, logs) => {
        const status = instance?.status || 'draft';

        let currentStep = null;
        let nextStep = null;

        /**
         * ✅ 送出前 / 草稿 / 退回後重新送出預覽
         * 目前關卡應該是填報者自己
         * 下一關才是第一個簽核關卡
         */
        if (status === 'draft' || status === 'returned') {
            currentStep = this.buildApplicantCurrentStep(applicant);
            nextStep = steps?.[0] || null;
        }

        /**
         * ✅ 簽核中
         * 目前關卡是 status = pending 的簽核關卡
         * 下一關是目前關卡後面的下一關
         */
        else if (status === 'pending') {
            currentStep = steps.find((step) => step.status === 'pending') || null;

            nextStep = currentStep
                ? steps.find((step) => step.step_no > currentStep.step_no) || null
                : null;
        }

        /**
         * ✅ 已完成 / 已駁回 / 已取消
         */
        else {
            currentStep = null;
            nextStep = null;
        }

        return {
            documentTitle: applicant?.excel_Name || '',
            documentNo: applicant?.excel_id || '',

            applicant: {
                USER_ID: applicant?.USER_ID,
                USER_NAME: applicant?.USER_NAME,
                MISS_ID: applicant?.MISS_ID,
                MISS_NAME: applicant?.MISS_NAME,
                BRANCH_ID: applicant?.BRANCH_ID,
                BRANCH_NAME: applicant?.BRANCH_NAME,
            },

            instance: instance || {
                approval_id: null,
                status: 'draft',
                current_step_no: 0,
            },

            currentStep,
            nextStep,
            steps,
            logs,
        };
    };

    /**
     * 送出前預覽
     */
    previewSubmit = async (req) => {
        const conn = await pool.getConnection();

        try {
            const { businessTable, businessId, flowTypeKey } = req.body;

            if (!businessTable || !businessId || !flowTypeKey) {
                throw new Error("缺少必要參數");
            }

            const applicant = await this.getApplicantByBusiness(
                conn,
                businessTable,
                businessId
            );

            const exists = await this.getInstanceByBusiness(
                conn,
                businessTable,
                businessId
            );

            // 已經有簽核資料，直接回傳 detail
            if (exists && exists.status !== "returned") {
                const steps = await this.getStepsByApprovalId(conn, exists.approval_id);
                const logs = await this.getLogsByApprovalId(conn, exists.approval_id);

                const message = await this.buildApprovalInfo(
                    conn,
                    exists,
                    applicant,
                    steps,
                    logs
                );

                return {
                    success: 1,
                    message,
                };
            }

            // 沒有簽核或已退回，重新預覽流程
            const builtSteps = await this.buildApprovalSteps(conn, applicant);
            const steps = this.formatPreviewSteps(builtSteps);

            const instance = {
                approval_id: exists?.approval_id || null,
                flow_type_key: flowTypeKey,
                business_table: businessTable,
                business_id: businessId,

                // ✅ 預覽時還沒有送出，所以是 draft
                status: exists?.status || 'draft',

                // ✅ 目前在申請者手上，不是第 1 關
                current_step_no: 0,
            };

            const logs = exists
                ? await this.getLogsByApprovalId(conn, exists.approval_id)
                : [];

            const message = await this.buildApprovalInfo(
                conn,
                instance,
                applicant,
                steps,
                logs
            );

            return {
                success: 1,
                message,
            };
        } catch (e) {
            console.error("previewSubmit error:", e);
            return {
                success: -1,
                message: e.message || "取得簽核流程失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * 建立者送出簽核
     */
    submitApproval = async (req) => {
        const conn = await pool.getConnection();

        try {
            const { businessTable, businessId, flowTypeKey, opinion } = req.body;

            if (!req.mydata?.USER_ID) {
                throw new Error("找不到登入者資訊");
            }

            if (!businessTable || !businessId || !flowTypeKey) {
                throw new Error("缺少必要參數");
            }

            await conn.beginTransaction();

            const applicant = await this.getApplicantByBusiness(
                conn,
                businessTable,
                businessId
            );

            const loginUser = await this.getUserSnapshotByUserId(
                conn,
                req.mydata.USER_ID
            );

            if (!loginUser) {
                throw new Error("找不到登入者資料");
            }

            if (String(applicant.USER_ID) !== String(req.mydata.USER_ID)) {
                throw new Error("只有建立者可以送出簽核");
            }

            const builtSteps = await this.buildApprovalSteps(conn, applicant);
            const isDirectApproved = builtSteps.length === 0;

            let instance = await this.getInstanceByBusiness(
                conn,
                businessTable,
                businessId
            );

            let approvalId = null;

            if (instance) {
                if (instance.status === "pending") {
                    throw new Error("此文件已在簽核中");
                }

                if (instance.status === "approved") {
                    throw new Error("此文件已完成簽核");
                }

                approvalId = instance.approval_id;

                // 退回後重新送出：刪除舊關卡，保留歷史 log
                await conn.execute(
                    `
          DELETE FROM approval_instance_step
          WHERE approval_id = ?
          `,
                    [approvalId]
                );

                await conn.execute(
                    `
          UPDATE approval_instance
          SET flow_type_key = ?,
              applicant_user_id = ?,
              applicant_name = ?,
              applicant_miss_id = ?,
              applicant_miss_name = ?,
              applicant_branch_id = ?,
              applicant_branch_name = ?,
              status = ?,
              current_step_no = ?,
              update_time = NOW()
          WHERE approval_id = ?
          `,
                    [
                        flowTypeKey,
                        applicant.USER_ID,
                        applicant.USER_NAME,
                        applicant.MISS_ID,
                        applicant.MISS_NAME,
                        applicant.BRANCH_ID,
                        applicant.BRANCH_NAME,
                        isDirectApproved ? "approved" : "pending",
                        isDirectApproved ? 0 : 1,
                        approvalId,
                    ]
                );
            } else {
                const [insertResult] = await conn.execute(
                    `
          INSERT INTO approval_instance (
              flow_type_key,
              business_table,
              business_id,
              applicant_user_id,
              applicant_name,
              applicant_miss_id,
              applicant_miss_name,
              applicant_branch_id,
              applicant_branch_name,
              status,
              current_step_no
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                    [
                        flowTypeKey,
                        businessTable,
                        businessId,
                        applicant.USER_ID,
                        applicant.USER_NAME,
                        applicant.MISS_ID,
                        applicant.MISS_NAME,
                        applicant.BRANCH_ID,
                        applicant.BRANCH_NAME,
                        isDirectApproved ? "approved" : "pending",
                        isDirectApproved ? 0 : 1,
                    ]
                );

                approvalId = insertResult.insertId;
            }

            // 建立者送出意見
            await conn.execute(
                `
        INSERT INTO approval_action_log (
            approval_id,
            action_user_id,
            action_user_name,
            action_miss_id,
            action_miss_name,
            action_branch_id,
            action_branch_name,
            action_type,
            opinion,
            from_step_no
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'submit', ?, NULL)
        `,
                [
                    approvalId,
                    loginUser.USER_ID,
                    loginUser.USER_NAME,
                    loginUser.MISS_ID,
                    loginUser.MISS_NAME,
                    loginUser.BRANCH_ID,
                    loginUser.BRANCH_NAME,
                    opinion || "",
                ]
            );

            // 建立實際簽核關卡
            for (const step of builtSteps) {
                await conn.execute(
                    `
          INSERT INTO approval_instance_step (
              approval_id,
              step_no,
              step_name,
              approver_user_id,
              approver_name,
              approver_miss_id,
              approver_miss_name,
              approver_branch_id,
              approver_branch_name,
              status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                    [
                        approvalId,
                        step.step_no,
                        step.step_name,
                        step.approver.USER_ID,
                        step.approver.USER_NAME,
                        step.approver.MISS_ID,
                        step.approver.MISS_NAME,
                        step.approver.BRANCH_ID,
                        step.approver.BRANCH_NAME,
                        step.step_no === 1 ? "pending" : "waiting",
                    ]
                );
            }

            // 原表標記已送出
            if (businessTable === "appraisal_excel") {
                await conn.execute(
                    `
          UPDATE appraisal_excel
          SET excel_Send = '1'
          WHERE excel_id = ?
          `,
                    [businessId]
                );
            }

            await conn.commit();

            return {
                success: 1,
                message: isDirectApproved ? "已直接完成" : "已送出簽核",
            };
        } catch (e) {
            await conn.rollback();
            console.error("submitApproval error:", e);

            return {
                success: -1,
                message: e.message || "送出簽核失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * 查詢簽核明細
     */
    getApprovalDetail = async (req) => {
        const conn = await pool.getConnection();

        try {
            const { businessTable, businessId } = req.body;

            if (!businessTable || !businessId) {
                throw new Error("缺少必要參數");
            }

            const applicant = await this.getApplicantByBusiness(
                conn,
                businessTable,
                businessId
            );

            const instance = await this.getInstanceByBusiness(
                conn,
                businessTable,
                businessId
            );

            if (!instance) {
                throw new Error("此文件尚未建立簽核流程");
            }

            const steps = await this.getStepsByApprovalId(conn, instance.approval_id);
            const logs = await this.getLogsByApprovalId(conn, instance.approval_id);

            const message = await this.buildApprovalInfo(
                conn,
                instance,
                applicant,
                steps,
                logs
            );

            return {
                success: 1,
                message,
            };
        } catch (e) {
            console.error("getApprovalDetail error:", e);
            return {
                success: -1,
                message: e.message || "取得簽核資料失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * 簽核同意
     */
    approveApproval = async (req) => {
        const conn = await pool.getConnection();

        try {
            const { approvalId, opinion } = req.body;

            if (!req.mydata?.USER_ID) {
                throw new Error("找不到登入者資訊");
            }

            if (!approvalId) {
                throw new Error("缺少 approvalId");
            }

            await conn.beginTransaction();

            const loginUser = await this.getUserSnapshotByUserId(
                conn,
                req.mydata.USER_ID
            );

            if (!loginUser) {
                throw new Error("找不到登入者資料");
            }

            const [stepRows] = await conn.execute(
                `
        SELECT *
        FROM approval_instance_step
        WHERE approval_id = ?
          AND approver_user_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
                [approvalId, req.mydata.USER_ID]
            );

            if (stepRows.length === 0) {
                throw new Error("找不到目前待簽核關卡");
            }

            const currentStep = stepRows[0];

            await conn.execute(
                `
        UPDATE approval_instance_step
        SET status = 'approved',
            action = 'approve',
            opinion = ?,
            action_time = NOW()
        WHERE step_id = ?
        `,
                [opinion || "", currentStep.step_id]
            );

            await conn.execute(
                `
        INSERT INTO approval_action_log (
            approval_id,
            action_user_id,
            action_user_name,
            action_miss_id,
            action_miss_name,
            action_branch_id,
            action_branch_name,
            action_type,
            opinion,
            from_step_no
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'approve', ?, ?)
        `,
                [
                    approvalId,
                    loginUser.USER_ID,
                    loginUser.USER_NAME,
                    loginUser.MISS_ID,
                    loginUser.MISS_NAME,
                    loginUser.BRANCH_ID,
                    loginUser.BRANCH_NAME,
                    opinion || "",
                    currentStep.step_no,
                ]
            );

            const [nextRows] = await conn.execute(
                `
        SELECT *
        FROM approval_instance_step
        WHERE approval_id = ?
          AND step_no > ?
        ORDER BY step_no ASC
        LIMIT 1
        `,
                [approvalId, currentStep.step_no]
            );

            if (nextRows.length > 0) {
                const nextStep = nextRows[0];

                await conn.execute(
                    `
          UPDATE approval_instance_step
          SET status = 'pending'
          WHERE step_id = ?
          `,
                    [nextStep.step_id]
                );

                await conn.execute(
                    `
          UPDATE approval_instance
          SET status = 'pending',
              current_step_no = ?,
              update_time = NOW()
          WHERE approval_id = ?
          `,
                    [nextStep.step_no, approvalId]
                );
            } else {
                await conn.execute(
                    `
          UPDATE approval_instance
          SET status = 'approved',
              current_step_no = 0,
              update_time = NOW()
          WHERE approval_id = ?
          `,
                    [approvalId]
                );
            }

            await conn.commit();

            return {
                success: 1,
                message: "已同意",
            };
        } catch (e) {
            await conn.rollback();
            console.error("approveApproval error:", e);

            return {
                success: -1,
                message: e.message || "簽核失敗",
            };
        } finally {
            conn.release();
        }
    };

    /**
     * 簽核退回
     */
    returnApproval = async (req) => {
        const conn = await pool.getConnection();

        try {
            const { approvalId, opinion } = req.body;

            if (!req.mydata?.USER_ID) {
                throw new Error("找不到登入者資訊");
            }

            if (!approvalId) {
                throw new Error("缺少 approvalId");
            }

            if (!String(opinion || "").trim()) {
                throw new Error("退回時請填寫退回原因");
            }

            await conn.beginTransaction();

            const loginUser = await this.getUserSnapshotByUserId(
                conn,
                req.mydata.USER_ID
            );

            if (!loginUser) {
                throw new Error("找不到登入者資料");
            }

            const [stepRows] = await conn.execute(
                `
        SELECT *
        FROM approval_instance_step
        WHERE approval_id = ?
          AND approver_user_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
                [approvalId, req.mydata.USER_ID]
            );

            if (stepRows.length === 0) {
                throw new Error("找不到目前待退回關卡");
            }

            const currentStep = stepRows[0];

            await conn.execute(
                `
        UPDATE approval_instance_step
        SET status = 'returned',
            action = 'return',
            opinion = ?,
            action_time = NOW()
        WHERE step_id = ?
        `,
                [opinion, currentStep.step_id]
            );

            await conn.execute(
                `
        INSERT INTO approval_action_log (
            approval_id,
            action_user_id,
            action_user_name,
            action_miss_id,
            action_miss_name,
            action_branch_id,
            action_branch_name,
            action_type,
            opinion,
            from_step_no
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'return', ?, ?)
        `,
                [
                    approvalId,
                    loginUser.USER_ID,
                    loginUser.USER_NAME,
                    loginUser.MISS_ID,
                    loginUser.MISS_NAME,
                    loginUser.BRANCH_ID,
                    loginUser.BRANCH_NAME,
                    opinion,
                    currentStep.step_no,
                ]
            );

            await conn.execute(
                `
        UPDATE approval_instance
        SET status = 'returned',
            update_time = NOW()
        WHERE approval_id = ?
        `,
                [approvalId]
            );

            const [instanceRows] = await conn.execute(
                `
        SELECT business_table, business_id
        FROM approval_instance
        WHERE approval_id = ?
        LIMIT 1
        `,
                [approvalId]
            );

            const instance = instanceRows[0];

            if (instance?.business_table === "appraisal_excel") {
                await conn.execute(
                    `
          UPDATE appraisal_excel
          SET excel_Send = '0'
          WHERE excel_id = ?
          `,
                    [instance.business_id]
                );
            }

            await conn.commit();

            return {
                success: 1,
                message: "已退回",
            };
        } catch (e) {
            await conn.rollback();
            console.error("returnApproval error:", e);

            return {
                success: -1,
                message: e.message || "退回失敗",
            };
        } finally {
            conn.release();
        }
    };


    withdrawApproval = async (req) => {
        const conn = await pool.getConnection();

        try {
            const { approvalId, opinion } = req.body;

            if (!req.mydata?.USER_ID) {
                throw new Error("找不到登入者資訊");
            }

            if (!approvalId) {
                throw new Error("缺少 approvalId");
            }

            await conn.beginTransaction();

            const loginUser = await this.getUserSnapshotByUserId(
                conn,
                req.mydata.USER_ID
            );

            if (!loginUser) {
                throw new Error("找不到登入者資料");
            }

            const [instanceRows] = await conn.execute(
                `
                SELECT *
                FROM approval_instance
                WHERE approval_id = ?
                LIMIT 1
                `,
                [approvalId]
            );

            if (instanceRows.length === 0) {
                throw new Error("找不到簽核流程");
            }

            const instance = instanceRows[0];

            if (instance.status === "approved") {
                throw new Error("此文件已完成簽核，不能抽單");
            }

            if (instance.status === "withdrawn") {
                throw new Error("此文件已抽單，不能重複抽單");
            }

            if (instance.status === "draft") {
                throw new Error("此文件尚未送出，不需要抽單");
            }

            if (String(instance.applicant_user_id) !== String(req.mydata.USER_ID)) {
                throw new Error("只有填報者本人可以抽單");
            }

            /**
             * ✅ 取消尚未完成的關卡
             *
             * approved 的關卡保留，代表歷史已簽過。
             * pending / waiting 改成 cancel。
             */
            await conn.execute(
                `
                UPDATE approval_instance_step
                SET status = 'cancel',
                    action = 'cancel',
                    opinion = ?,
                    action_time = NOW()
                WHERE approval_id = ?
                  AND status IN ('pending', 'waiting')
                `,
                [opinion || "填報者抽單", approvalId]
            );

            /**
             * ✅ 主流程改為已抽單
             */
            await conn.execute(
                `
                UPDATE approval_instance
                SET status = 'withdrawn',
                    current_step_no = 0,
                    update_time = NOW()
                WHERE approval_id = ?
                `,
                [approvalId]
            );

            /**
             * ✅ 寫入抽單紀錄
             */
            await conn.execute(
                `
                INSERT INTO approval_action_log (
                    approval_id,
                    action_user_id,
                    action_user_name,
                    action_miss_id,
                    action_miss_name,
                    action_branch_id,
                    action_branch_name,
                    action_type,
                    opinion,
                    from_step_no
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'withdraw', ?, ?)
                `,
                [
                    approvalId,
                    loginUser.USER_ID,
                    loginUser.USER_NAME,
                    loginUser.MISS_ID,
                    loginUser.MISS_NAME,
                    loginUser.BRANCH_ID,
                    loginUser.BRANCH_NAME,
                    opinion || "",
                    instance.current_step_no || null,
                ]
            );

            /**
             * ✅ 原本 Excel 紀錄改回未送出
             *
             * 這樣前端 ApprovalRowPolicy.isNotSubmitted()
             * 會判斷成未送出，可以重新送出、下載、預覽。
             */
            if (instance.business_table === "appraisal_excel") {
                await conn.execute(
                    `
                    UPDATE appraisal_excel
                    SET excel_Send = '0'
                    WHERE excel_id = ?
                    `,
                    [instance.business_id]
                );
            }

            await conn.commit();

            return {
                success: 1,
                message: "已抽單",
            };
        } catch (e) {
            await conn.rollback();
            console.error("withdrawApproval error:", e);

            return {
                success: -1,
                message: e.message || "抽單失敗",
            };
        } finally {
            conn.release();
        }
    };

}

module.exports = new ApprovalService();