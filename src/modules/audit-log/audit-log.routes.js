const { Router } = require('express');
const { validate } = require('../../middleware/validate');
const { authorize } = require('../../middleware/authorize');
const { listAuditLogQuery } = require('./audit-log.schemas');

function createAdminRouter({ auditLogController }) {
  const router = Router();

  router.use(authorize('ADMIN'));
  router.get('/audit-log', validate({ query: listAuditLogQuery }), auditLogController.list);

  return router;
}

module.exports = { createAdminRouter };
