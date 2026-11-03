exports.up = async function (knex) {
  await knex.schema.createTable('buildings', (t) => {
    t.increments('id').primary();
    t.string('name', 100).notNullable().unique('buildings_name_unique');
    t.string('address', 255).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('rooms', (t) => {
    t.increments('id').primary();
    t.integer('building_id').notNullable()
      .references('id').inTable('buildings').onDelete('RESTRICT');
    t.string('name', 50).notNullable();
    t.integer('capacity').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['building_id', 'name'], { indexName: 'rooms_building_id_name_unique' });
    t.check('capacity > 0', [], 'rooms_capacity_positive');
  });

  await knex.schema.createTable('reservations', (t) => {
    t.increments('id').primary();
    t.integer('room_id').notNullable()
      .references('id').inTable('rooms').onDelete('RESTRICT');
    t.string('reserved_by', 100).notNullable();
    t.integer('participants').notNullable();
    t.timestamp('start_time', { useTz: true }).notNullable();
    t.timestamp('end_time', { useTz: true }).notNullable();
    t.string('status', 20).notNullable().defaultTo('active');
    t.timestamp('cancelled_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.check('end_time > start_time', [], 'reservations_time_order');
    t.check("status IN ('active', 'cancelled')", [], 'reservations_status_valid');
    t.index(['room_id', 'start_time', 'end_time'], 'reservations_room_time_idx');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('reservations');
  await knex.schema.dropTableIfExists('rooms');
  await knex.schema.dropTableIfExists('buildings');
};