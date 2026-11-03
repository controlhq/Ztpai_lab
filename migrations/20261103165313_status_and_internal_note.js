exports.up = async function (knex) {
  await knex.raw('ALTER TABLE reservations DROP CONSTRAINT reservations_status_valid');
  await knex.raw("UPDATE reservations SET status = 'CONFIRMED' WHERE status = 'active'");
  await knex.raw("UPDATE reservations SET status = 'CANCELLED' WHERE status = 'cancelled'");
  await knex.raw(
    "ALTER TABLE reservations ADD CONSTRAINT reservations_status_valid CHECK (status IN ('CONFIRMED', 'CANCELLED'))"
  );
  await knex.raw("ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'CONFIRMED'");
  await knex.schema.alterTable('reservations', (t) => t.text('internal_note'));
};

exports.down = async function (knex) {
  await knex.schema.alterTable('reservations', (t) => t.dropColumn('internal_note'));
  await knex.raw("ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'active'");
  await knex.raw('ALTER TABLE reservations DROP CONSTRAINT reservations_status_valid');
  await knex.raw("UPDATE reservations SET status = 'active' WHERE status = 'CONFIRMED'");
  await knex.raw("UPDATE reservations SET status = 'cancelled' WHERE status = 'CANCELLED'");
  await knex.raw(
    "ALTER TABLE reservations ADD CONSTRAINT reservations_status_valid CHECK (status IN ('active', 'cancelled'))"
  );
};