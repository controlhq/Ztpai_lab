function createAuditLogService({ auditLogRepository }) {
  return {
    async list({ page = 1, limit = 20, eventType }) {
      const { rows, total } = await auditLogRepository.findPage({
        filters: { eventType },
        page,
        limit,
      });
      return {
        data: rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    },
  };
}

module.exports = { createAuditLogService };
