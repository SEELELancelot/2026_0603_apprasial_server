const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    database: "chfa_employee_record",
    user: 'root',
    password: "root",
    port: 3306,
    multipleStatements: true,
    charset: "utf8"
});


pool.getConnection((err, connection) => {
    if (err) {
        console.log("考核資料庫連接失敗");
        console.log(err);
    } else {
        console.log("考核資料庫連接成功");
    }
});


module.exports = pool.promise();