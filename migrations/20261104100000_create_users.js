exports.up = async function (knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('email', 254).notNullable().unique({ indexName: 'users_email_unique' });
    t.string('password_hash', 60).notNullable();
    t.string('role', 10).notNullable().defaultTo('USER');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.check("role IN ('USER', 'ADMIN')", [], 'users_role_valid');
    t.check('email = lower(email)', [], 'users_email_lowercase');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};
