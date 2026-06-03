const express = require("express");
const {verifymyToken} = require("../middleware/authmiddleware");
const {getYear,getDisableExcel}=require("../controller/DropDownController")

const dropDownRouter = express.Router();

dropDownRouter.get("/getYear",verifymyToken,getYear);
dropDownRouter.get("/getDisableExcel",verifymyToken,getDisableExcel);

module.exports = dropDownRouter;