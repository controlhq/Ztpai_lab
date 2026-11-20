const toEntry = (row) => ({
  id: row.id,
  eventType: row.event_type,
  payload: row.payload,
  createdAt: row.created_at.toISOString(),
});

function createAuditLogKnexRepository({ db }) {
  const filtered = ({ eventType }) => {
    const query = db('audit_log');
    if (eventType !== undefined) query.where('event_type', eventType);
    return query;
  };

  return {
    async create({ eventType, payload }) {
      const [row] = await db('audit_log')
        .insert({ event_type: eventType, payload: JSON.stringify(payload) })
        .returning('*');
      return toEntry(row);
    },

    async findPage({ filters, page, limit }) {
      const [{ total }] = await filtered(filters).count({ total: '*' });
      const rows = await filtered(filters)
        .select('*')
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc') // stabilna kolejność przy tym samym created_at
        .limit(limit)
        .offset((page - 1) * limit);
      return { rows: rows.map(toEntry), total: Number(total) };
    },
  };
}

module.exports = { createAuditLogKnexRepository };
