const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// "Piotr Zieliński" -> "piotr.zielinski@example.com"
function emailFromName(name, id) {
  const local = name
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${local || `user.${id}`}@example.com`;
}

exports.up = async function (knex) {
  await knex.schema.alterTable('reservations', (t) => {
    t.integer('user_id').nullable().references('id').inTable('users').onDelete('RESTRICT');
  });

  // przypisanie istniejących rezerwacji: reserved_by -> konto użytkownika
  const names = await knex('reservations').distinct('reserved_by').pluck('reserved_by');

  for (const name of names) {
    const email = emailFromName(name, crypto.randomUUID());

    let user = await knex('users').where({ email }).first();
    if (!user) {
      // konto bez znanego hasła - użytkownik musi je ustawić, żeby się zalogować
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      [user] = await knex('users')
        .insert({ email, password_hash: passwordHash, role: 'USER' })
        .returning('*');
    }

    await knex('reservations').where({ reserved_by: name }).update({ user_id: user.id });
  }

  await knex.schema.alterTable('reservations', (t) => {
    t.integer('user_id').notNullable().alter();
    t.index(['user_id'], 'reservations_user_id_idx');
    t.dropColumn('reserved_by');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('reservations', (t) => {
    t.string('reserved_by', 100).nullable();
  });

  // imienia i nazwiska nie da się odtworzyć - wracamy do emaila właściciela
  await knex.raw(`
    UPDATE reservations res
    SET reserved_by = u.email
    FROM users u
    WHERE u.id = res.user_id
  `);

  await knex.schema.alterTable('reservations', (t) => {
    t.string('reserved_by', 100).notNullable().alter();
    t.dropIndex(['user_id'], 'reservations_user_id_idx');
    t.dropColumn('user_id');
  });
};
