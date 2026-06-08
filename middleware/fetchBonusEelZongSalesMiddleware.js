// middleware/fetchBonusEelZongSalesMiddleware.js

const PerformancePool = require("../connect/PerformanceConnect");

/**
 * ✅ 查詢端午獎金用：鰻意粽銷售資料
 *
 * 功能：
 * 1. 從 req.getExcelManagerEmployeeData 取得員工清單
 * 2. 用員工 USER_ID 到績效資料庫 performance_daily 查詢
 * 3. 查詢商品代號 9978000001
 * 4. 區間：115/05/04 00:00:00 ~ 今天 23:59:59
 * 5. 計算：
 *    - 銷售數
 *    - 退貨數
 *    - 淨銷數
 *    - 銷售額
 *    - 退貨額
 *    - 淨銷額
 * 6. 使用 SQL WITH ROLLUP 算出合計
 * 7. 把每位員工統計結果塞回 req.getExcelManagerEmployeeData
 * 8. 把合計結果塞到 req.bonusEelZongSalesInfo.total
 */
const fetchBonusEelZongSalesMiddleware = async (req, res, next) => {
    try {
        /**
         * employeeAppraisalExcelMiddleware 前一個 middleware
         * 會把員工資料放在 req.getExcelManagerEmployeeData
         *
         * 格式通常是 JSON 字串：
         * [
         *   {
         *      value: "0004",
         *      label: "辜宇仙",
         *      MISS_NAME: "幹事",
         *      BRANCH_NAME: "企劃部"
         *   }
         * ]
         */
        const employeeData = JSON.parse(req?.getExcelManagerEmployeeData || "[]");

        if (!Array.isArray(employeeData) || employeeData.length === 0) {
            req.getExcelManagerEmployeeData = JSON.stringify([]);

            req.bonusEelZongSalesInfo = {
                goodsno: "9978000001",
                startDateTime: "",
                endDateTime: "",
                rows: [],
                total: {
                    eel_zong_net_qty: 0,
                    eel_zong_net_amount: 0,
                },
            };

            return next();
        }

        /**
         * 員工 USER_ID
         * 你的員工資料 value 就是 USER_ID
         */
        const userIds = employeeData
            .map(emp => emp.value)
            .filter(Boolean);

        if (userIds.length === 0) {
            req.bonusEelZongSalesInfo = {
                goodsno: "9978000001",
                startDateTime: "",
                endDateTime: "",
                rows: [],
                total: {
                    eel_zong_net_qty: 0,
                    eel_zong_net_amount: 0,
                },
            };

            return next();
        }

        /**
         * 民國 115/05/04 = 西元 2026-05-04
         * 查詢到今天 23:59:59
         */
        const startDateTime = "2026-05-04 00:00:00";

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const endDateTime = `${yyyy}-${mm}-${dd} 23:59:59`;

        /**
         * 鰻意粽商品代號
         */
        const goodsno = "9978000001";

        /**
         * IN (?, ?, ?, ...)
         */
        const userPlaceholders = userIds.map(() => "?").join(",");

        /**
         * ✅ custom_fields 內使用的欄位
         *
         * goodsno            商品代號
         * quantity           數量
         * price              單價
         * onsales            折扣，沒有值預設 1
         * break_amount       折讓，沒有值預設 0
         * transaction_type   銷售 / 退貨
         *
         * 金額算法：
         * 銷售額 = FLOOR(price * quantity * onsales - break_amount)
         * 退貨額 = CEIL(price * quantity * onsales - break_amount)
         * 淨銷額 = 銷售額 - 退貨額
         *
         * ✅ WITH ROLLUP：
         * GROUP BY PD.user_id WITH ROLLUP
         * 會多產生一筆 USER_ID = NULL 的合計列
         */
        const sql = `
            SELECT
                PD.user_id AS USER_ID,

                /* =========================
                   銷售數
                ========================= */
                SUM(
                        CASE
                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '銷售'
                                THEN CAST(
                                    COALESCE(
                                            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                            '0'
                                    ) AS DECIMAL(18, 4)
                                     )
                            ELSE 0
                            END
                ) AS eel_zong_sales_qty,

                /* =========================
                   退貨數
                ========================= */
                SUM(
                        CASE
                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '退貨'
                                THEN CAST(
                                    COALESCE(
                                            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                            '0'
                                    ) AS DECIMAL(18, 4)
                                     )
                            ELSE 0
                            END
                ) AS eel_zong_return_qty,

                /* =========================
                   淨銷數 = 銷售數 - 退貨數
                ========================= */
                SUM(
                        CASE
                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '銷售'
                                THEN CAST(
                                    COALESCE(
                                            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                            '0'
                                    ) AS DECIMAL(18, 4)
                                     )

                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '退貨'
                                THEN -1 * CAST(
                                    COALESCE(
                                            NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                            '0'
                                    ) AS DECIMAL(18, 4)
                                          )

                            ELSE 0
                            END
                ) AS eel_zong_net_qty,

                /* =========================
                   銷售額
                ========================= */
                SUM(
                        CASE
                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '銷售'
                                THEN FLOOR(
                                    (
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.price')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.onsales')), ''),
                                                        '1'
                                                ) AS DECIMAL(18, 4)
                                        )
                                        )
                                        -
                                    CAST(
                                            COALESCE(
                                                    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.break_amount')), ''),
                                                    '0'
                                            ) AS DECIMAL(18, 4)
                                    )
                                     )
                            ELSE 0
                            END
                ) AS eel_zong_sales_amount,

                /* =========================
                   退貨額
                ========================= */
                SUM(
                        CASE
                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '退貨'
                                THEN CEIL(
                                    (
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.price')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.onsales')), ''),
                                                        '1'
                                                ) AS DECIMAL(18, 4)
                                        )
                                        )
                                        -
                                    CAST(
                                            COALESCE(
                                                    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.break_amount')), ''),
                                                    '0'
                                            ) AS DECIMAL(18, 4)
                                    )
                                     )
                            ELSE 0
                            END
                ) AS eel_zong_return_amount,

                /* =========================
                   淨銷額 = 銷售額 - 退貨額
                ========================= */
                SUM(
                        CASE
                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '銷售'
                                THEN FLOOR(
                                    (
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.price')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.onsales')), ''),
                                                        '1'
                                                ) AS DECIMAL(18, 4)
                                        )
                                        )
                                        -
                                    CAST(
                                            COALESCE(
                                                    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.break_amount')), ''),
                                                    '0'
                                            ) AS DECIMAL(18, 4)
                                    )
                                     )

                            WHEN TRIM(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.transaction_type'))) = '退貨'
                                THEN -1 * CEIL(
                                    (
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.price')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.quantity')), ''),
                                                        '0'
                                                ) AS DECIMAL(18, 4)
                                        )
                                            *
                                        CAST(
                                                COALESCE(
                                                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.onsales')), ''),
                                                        '1'
                                                ) AS DECIMAL(18, 4)
                                        )
                                        )
                                        -
                                    CAST(
                                            COALESCE(
                                                    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.break_amount')), ''),
                                                    '0'
                                            ) AS DECIMAL(18, 4)
                                    )
                                          )

                            ELSE 0
                            END
                ) AS eel_zong_net_amount

            FROM performance_daily PD
            WHERE JSON_UNQUOTE(JSON_EXTRACT(PD.custom_fields, '$.goodsno')) = ?
              AND PD.user_id IN (${userPlaceholders})
              AND STR_TO_DATE(
                    CONCAT(PD.detail_date, ' ', IFNULL(PD.detail_time, '00:00:00')),
                    '%Y-%m-%d %H:%i:%s'
                  ) BETWEEN ? AND ?
            GROUP BY PD.user_id WITH ROLLUP
        `;

        const params = [
            goodsno,
            ...userIds,
            startDateTime,
            endDateTime,
        ];

        const [rows] = await PerformancePool.execute(sql, params);

        /**
         * ✅ WITH ROLLUP 會多一筆 USER_ID = null 的合計列
         */
        const totalRow = rows.find(row => row.USER_ID === null) || {};
        const userRows = rows.filter(row => row.USER_ID !== null);

        /**
         * 用 Map 整理成：
         * USER_ID => 鰻意粽統計資料
         */
        const salesMap = new Map();

        userRows.forEach(row => {
            salesMap.set(row.USER_ID, {
                eel_zong_sales_qty: Number(row.eel_zong_sales_qty) || 0,
                eel_zong_return_qty: Number(row.eel_zong_return_qty) || 0,
                eel_zong_net_qty: Number(row.eel_zong_net_qty) || 0,

                eel_zong_sales_amount: Number(row.eel_zong_sales_amount) || 0,
                eel_zong_return_amount: Number(row.eel_zong_return_amount) || 0,
                eel_zong_net_amount: Number(row.eel_zong_net_amount) || 0,
            });
        });

        /**
         * 把統計資料塞回每位員工
         */
        const newEmployeeData = employeeData.map(emp => {
            const salesInfo = salesMap.get(emp.value) || {};

            return {
                ...emp,

                // 商品代號
                eel_zong_goodsno: goodsno,

                // 數量
                eel_zong_sales_qty: salesInfo.eel_zong_sales_qty || 0,
                eel_zong_return_qty: salesInfo.eel_zong_return_qty || 0,
                eel_zong_net_qty: salesInfo.eel_zong_net_qty || 0,

                // 金額
                eel_zong_sales_amount: salesInfo.eel_zong_sales_amount || 0,
                eel_zong_return_amount: salesInfo.eel_zong_return_amount || 0,
                eel_zong_net_amount: salesInfo.eel_zong_net_amount || 0,
            };
        });

        /**
         * 重新寫回 req，讓後面的 exportBonusExcel / exportBonusOffice 使用
         */
        req.getExcelManagerEmployeeData = JSON.stringify(newEmployeeData);

        /**
         * debug 與 Excel 合計列使用
         */
        req.bonusEelZongSalesInfo = {
            goodsno,
            startDateTime,
            endDateTime,

            // 每位員工資料，不含 ROLLUP 合計列
            rows: userRows,

            // ✅ SQL WITH ROLLUP 算出的合計
            total: {
                eel_zong_sales_qty: Number(totalRow.eel_zong_sales_qty) || 0,
                eel_zong_return_qty: Number(totalRow.eel_zong_return_qty) || 0,
                eel_zong_net_qty: Number(totalRow.eel_zong_net_qty) || 0,

                eel_zong_sales_amount: Number(totalRow.eel_zong_sales_amount) || 0,
                eel_zong_return_amount: Number(totalRow.eel_zong_return_amount) || 0,
                eel_zong_net_amount: Number(totalRow.eel_zong_net_amount) || 0,
            },
        };

        console.log("鰻意粽績效統計 =", req.bonusEelZongSalesInfo);

        next();

    } catch (err) {
        console.error("查詢鰻意粽銷售數量與淨銷額失敗:", err);
        next(err);
    }
};

module.exports = {
    fetchBonusEelZongSalesMiddleware,
};