const pool = require("../connect/connect");

class UserService {
    getEmployeeManagerData=async (req)=>{
        try{
            const sql=`
        select U.USER_ID, U.USER_NAME,  W.MISS_ID, W.MISS_NAME
                   from user_data U
                            join work_mission W on U.MISS_ID = W.MISS_ID
                            join branch_info B on W.BRANCH_ID = B.BRANCH_ID
                   where U.USER_STATUS!="0" and U.DELETE_FLAG!="Y" and B.BRANCH_ID!=20
                   and W.MISS_NAME REGEXP '總幹事|秘書|主任|股長'`;

            const result = await pool.execute(sql);
            return {
                "success": 1,
                "message": result[0]
            }
        }catch (e){
            console.log(e);
            return {
                "success": -1,
            }
        }
    }

    getManagerEmployeeData = async (req) => {
        const { USER_ID, BRANCH_ID, MISS_ID } = req.mydata;

        // 通用職稱排序
        const SORT_MISS = `
        FIELD(MISS_NAME,
            "總幹事","主任兼代理秘書","秘書","主任",
            "分部主任","分部/辦事處主任","辦事處主任","魚市場主任",
            "幹事代主任","專員","股長","幹事代股長",
            "幹事","助理幹事","特約人員","技工","工友"
        )
    `;

        // 通用分部排序
        const SORT_BRANCH = `
        FIELD(B.BRANCH_ID,
            "08","05","06","14","12","13","10","11","09","15",
            "04","19","18","16","17","07","21","22","03","02"
        )
    `;

        let sql = "";

        // 1️⃣ 總幹事（6868）
        if (USER_ID === "6868") {
            sql = `
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                             "value", U.USER_ID,
                                             "label", U.USER_NAME,
                                             "MISS_ID", W.MISS_ID,
                                             "MISS_NAME", MISS_NAME,
                                             "BRANCH_ID", B.BRANCH_ID,
                                             "BRANCH_NAME",
                                             CASE WHEN U.USER_ID IN ("0014") THEN "總幹事室" ELSE B.BRANCH_NAME END,
                                             "identity",
                                             CASE WHEN MISS_NAME IN ("總幹事","主任兼代理秘書","秘書","主任",
                                                                     "分部主任","分部/辦事處主任","辦事處主任",
                                                                     "魚市場主任","幹事代主任","股長","幹事代股長")
                                                      THEN "主管" ELSE "員工" END,
                                             "work_content", IFNULL(WC.work_content, "")
                                     ) ORDER BY ${SORT_MISS}, ${SORT_BRANCH} ) AS data
                FROM user_data U
                         JOIN work_mission W ON U.MISS_ID = W.MISS_ID
                         JOIN branch_info B ON W.BRANCH_ID = B.BRANCH_ID
                         LEFT JOIN work_content WC ON WC.USER_ID = U.USER_ID
                WHERE U.USER_STATUS!="0"
              AND U.DELETE_FLAG!="Y"
              AND (MISS_NAME LIKE "%秘書%" AND B.BRANCH_ID!=20)
              AND U.USER_ID != ?
            `;
            const result = await pool.execute(sql, [USER_ID]);
            return { success: 1, message: result[0][0] };
        }

        // 2️⃣ 秘書（0014）
        else if (USER_ID === "0014") {
            sql = `
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                             "value", U.USER_ID,
                                             "label", U.USER_NAME,
                                             "MISS_ID", W.MISS_ID,
                                             "MISS_NAME", MISS_NAME,
                                             "BRANCH_ID", B.BRANCH_ID,
                                             "BRANCH_NAME", B.BRANCH_NAME,
                                             "identity",
                                             CASE WHEN MISS_NAME IN ("總幹事","主任兼代理秘書","秘書","主任",
                                                                     "分部主任","分部/辦事處主任","辦事處主任",
                                                                     "魚市場主任","幹事代主任","股長","幹事代股長")
                                                      THEN "主管" ELSE "員工" END,
                                             "work_content", IFNULL(WC.work_content, "")
                                     ) ORDER BY ${SORT_BRANCH}, ${SORT_MISS} ) AS data
                FROM user_data U
                         JOIN work_mission W ON U.MISS_ID = W.MISS_ID
                         JOIN branch_info B ON W.BRANCH_ID = B.BRANCH_ID
                         LEFT JOIN work_content WC ON WC.USER_ID = U.USER_ID
                WHERE U.USER_STATUS!="0"
              AND U.DELETE_FLAG!="Y"
              AND (
                    MISS_NAME IN ("主任","分部主任","分部/辦事處主任","辦事處主任",
                                   "魚市場主任","幹事代主任","股長","幹事代股長")
                    AND B.BRANCH_ID IN ("04","19","18","16","17","07","21","22","03","02")
                  )
              OR (U.USER_ID IN (?,?))
            `;
            const result = await pool.execute(sql, ["0011", "0185"]);
            return { success: 1, message: result[0][0] };
        }
        // 3️⃣  0035
        else if (USER_ID === "0035") {
            sql = `
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                             "value", U.USER_ID,
                                             "label", U.USER_NAME,
                                             "MISS_ID", W.MISS_ID,
                                             "MISS_NAME", W.MISS_NAME,
                                             "BRANCH_ID", B.BRANCH_ID,
                                             "BRANCH_NAME", B.BRANCH_NAME,
                                             "identity",
                                             CASE WHEN W.MISS_NAME IN ("總幹事","主任兼代理秘書","秘書","主任",
                                                                       "分部主任","分部/辦事處主任","辦事處主任",
                                                                       "魚市場主任","幹事代主任","股長","幹事代股長")
                                                      THEN "主管" ELSE "員工" END,
                                             "work_content", IFNULL(WC.work_content, "")
                                     ) ORDER BY ${SORT_MISS}, ${SORT_BRANCH} ) AS data
                FROM user_data U
                         JOIN work_mission W ON U.MISS_ID = W.MISS_ID
                         JOIN branch_info B ON W.BRANCH_ID = B.BRANCH_ID
                         LEFT JOIN work_content WC ON WC.USER_ID = U.USER_ID
                WHERE U.USER_STATUS!="0"
              AND U.DELETE_FLAG!="Y"
              AND U.USER_ID != ?
              AND (
                    ( W.MISS_NAME IN ("主任","分部主任","分部/辦事處主任","幹事代主任",
                                      "股長","幹事代股長")
                      AND B.BRANCH_ID IN ("08","05","06","14","12","13","10","11","09","15")
                    )
                    OR B.BRANCH_ID = "08"
                  )
            `;
            const result = await pool.execute(sql, [USER_ID]);
            return { success: 1, message: result[0][0] };
        }

        // 4️⃣ 一般主管/分部主任/員工
        else {
            sql = `
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                             "value", U.USER_ID,
                                             "label", U.USER_NAME,
                                             "MISS_ID", W.MISS_ID,
                                             "MISS_NAME", MISS_NAME,
                                             "BRANCH_ID", B.BRANCH_ID,
                                             "BRANCH_NAME", B.BRANCH_NAME,
                                             "identity",
                                             CASE WHEN MISS_NAME IN ("總幹事","主任兼代理秘書","秘書","主任",
                                                                     "分部主任","分部/辦事處主任","辦事處主任",
                                                                     "魚市場主任","幹事代主任","股長","幹事代股長")
                                                      THEN "主管" ELSE "員工" END,
                                             "work_content", IFNULL(WC.work_content, "")
                                     ) ORDER BY ${SORT_MISS}, ${SORT_BRANCH} ) AS data
                FROM user_data U
                         JOIN work_mission W ON U.MISS_ID = W.MISS_ID
                         JOIN branch_info B ON W.BRANCH_ID = B.BRANCH_ID
                         LEFT JOIN work_content WC ON WC.USER_ID = U.USER_ID
                WHERE U.USER_STATUS!="0"
              AND U.DELETE_FLAG!="Y"
              AND B.BRANCH_ID = ?
              AND U.USER_ID != ?
              AND MISS_NAME NOT LIKE "%股長%"
            `;
            const result = await pool.execute(sql, [BRANCH_ID, USER_ID]);
            return { success: 1, message: result[0][0] };
        }
    };
}

module.exports = new UserService();