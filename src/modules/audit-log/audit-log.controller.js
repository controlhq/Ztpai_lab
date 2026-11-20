function createAuditLogController({ auditLogService }) {
  return {
    async list(req, res) {
      res.json(await auditLogService.list(req.validated.query));
    },
  };
}

module.exports = { createAuditLogController };
