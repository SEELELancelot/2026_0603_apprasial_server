const mysql = require("mysql2");

const PerformancePool = mysql.createPool({
    host: "192.168.0.249",
    database: "chfa_performance",
    user: 'root',
    password: "rootchfa7788945@!chfa601%",
    port: 3306,
    multipleStatements: true,
    charset: "utf8",
    // ✅ 加入以下兩行
    connectTimeout: 1000, // 連線最多等1 秒
    // host: "localhost",
    // database:"acsdb",
    // user: 'root',
    // password:"rootchfa7788945",
    // port:3306,
    // multipleStatements:true,
    // charset:"utf8"
});


PerformancePool.getConnection((err, connection) => {
    if (err) {
        console.log("績效資料庫連接失敗");
        console.log(err);
    } else {
        console.log("績效資料庫連接成功");
    }
});

module.exports = PerformancePool.promise();