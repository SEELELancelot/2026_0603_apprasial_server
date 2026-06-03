class OfficeUtils {
    /**
     * 在指定工作表中查找匹配值的行號，並返回對應列的值
     * @param {Workbook} workbook - ExcelJS 的工作簿實例
     * @param {string} sheetName - 工作表名稱
     * @param {string} columnLetter - 要查找的列（如 'B'）
     * @param {string} targetValue - 要匹配的值
     * @param {string} returnColumnLetter - 要返回值的列（如 'E'）
     * @returns {{rowIndex: number|null, returnValue: any|null}} - 匹配的行號和指定列的值
     */
    static findMatchingRow(workbook, sheetName, columnLetter, targetValue, returnColumnLetter) {
        // 獲取目標工作表
        const worksheet = workbook.getWorksheet(sheetName);

        // 如果目標工作表不存在，拋出錯誤
        if (!worksheet) {
            throw new Error(`找不到名稱為 ${sheetName} 的工作表`);
        }

        // 遍歷目標列 (例如 B 列)
        let matchRow = null; // 匹配行號
        let returnValue = null; // 返回值
        worksheet.eachRow((row, rowIndex) => {
            const cellValue = row.getCell(columnLetter).value; // 獲取目標列的值
            if (cellValue === targetValue) {
                matchRow = rowIndex; // 保存匹配行號
                returnValue = row.getCell(returnColumnLetter).value; // 獲取對應返回列的值
            }
        });

        // 如果匹配成功，返回行號和指定列的值；否則返回 null
        return matchRow ? { rowIndex: matchRow, returnValue } : { rowIndex: null, returnValue: null };
    }
}

module.exports=OfficeUtils;