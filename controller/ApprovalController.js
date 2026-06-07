const ApprovalService = require("../Service/ApprovalService");

class ApprovalController {
    async previewSubmit(req, res, next) {
        const result = await ApprovalService.previewSubmit(req);
        res.json(result);
    }

    async submitApproval(req, res, next) {
        const result = await ApprovalService.submitApproval(req);
        res.json(result);
    }

    async getApprovalDetail(req, res, next) {
        const result = await ApprovalService.getApprovalDetail(req);
        res.json(result);
    }

    async approveApproval(req, res, next) {
        const result = await ApprovalService.approveApproval(req);
        res.json(result);
    }

    async returnApproval(req, res, next) {
        const result = await ApprovalService.returnApproval(req);
        res.json(result);
    }

    /**
     * 填報者抽單
     */
    async withdrawApproval(req, res, next) {
        const result = await ApprovalService.withdrawApproval(req);
        res.json(result);
    }
}

module.exports = new ApprovalController();