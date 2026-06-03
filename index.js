const express = require("express");
const errorHandle = require("./error/errorhandle");

const cors = require('cors');
const authRouter = require("./routers/auth");
const officeRouter = require("./routers/office");
const dropDownRouter=require("./routers/dropDown");

const app = express();
const http = require('http').Server(app);
app.use(cors());
app.use(express.json({}));
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use("/login", authRouter);
app.use("/office", officeRouter);
app.use('/dropDown',dropDownRouter);
app.use(errorHandle);
http.listen(7511, '0.0.0.0', function () {
    console.log("server 啟動");
});

