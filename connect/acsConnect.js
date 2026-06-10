const mysql = require("mysql2");

const AcsPool = mysql.createPool({
    host: "192.168.0.180",
    database: "acsdb",
    user: 'apuser',
    password: "apuserxxxxxxxx",
    port: 'xxxx',
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


AcsPool.getConnection((err, connection) => {
    if (err) {
        console.log("ACS資料庫連接失敗");
        console.log(err);
    } else {
        console.log("ACS資料庫連接成功");
    }
});

module.exports = AcsPool.promise();