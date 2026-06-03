const pool = require("../connect/connect");

class DropDownService {

    getYear = async () => {
        try {
            const currentYear = new Date().getFullYear() - 1911;  // 計算今年的民國年
            const minYear = 113;

            const data = [];


            // 再加入各年度
            for (let year = currentYear; year >= minYear; year--) {
                data.push({
                    value: year.toString(),
                    label: `${year}年`
                });
            }

            return {
                success: 1,
                data
            };

        } catch (error) {
            console.error('getYear error:', error);

            return {
                success: -1,
                info: []
            };
        }
    }

    getDisableExcel = async () => {
        const sql = `SELECT id, name, disable FROM bonus_type`;

        const [rows] = await pool.execute(sql);
        return {
            success: 1,
            data: rows
        };
    };

}

module.exports = new DropDownService();
