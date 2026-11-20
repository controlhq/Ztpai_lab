exports.up = async function (knex) {
  await knex.schema.createTable('audit_log', (t) => {
    t.increments('id').primary();
    t.string('event_type', 100).notNullable();
    t.jsonb('payload').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['event_type', 'created_at'], 'audit_log_event_type_created_at_idx');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_log');
};
