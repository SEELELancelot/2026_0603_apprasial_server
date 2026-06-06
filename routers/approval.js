const express = require("express");
const router = express.Router();

const ApprovalController = require("../Controller/ApprovalController");
const {verifymyToken} = require("../middleware/authmiddleware");

/**
 * 注意：
 * 如果你的 officeRouter 有 token middleware，
 * 這裡也要套同一個 middleware，
 * 不然 req.mydata 會是 undefined。
 *
 * 例如：
 * const authMiddleware = require("../middleware/authMiddleware");
 * router.use(authMiddleware);
 */

// 送出前預覽流程
router.post("/preview-submit", ApprovalController.previewSubmit);

// 建立者送出簽核
router.post("/submit", verifymyToken,ApprovalController.submitApproval);

// 查詢簽核明細
router.post("/detail", ApprovalController.getApprovalDetail);

// 簽核同意
router.post("/approve", verifymyToken,ApprovalController.approveApproval);

// 簽核退回
router.post("/return", verifymyToken,ApprovalController.returnApproval);

module.exports = router;