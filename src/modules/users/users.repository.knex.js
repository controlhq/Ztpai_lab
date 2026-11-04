const { ConflictError } = require('../../errors');

const toUser = (row) => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  createdAt: row.created_at.toISOString(),
});

function createUsersKnexRepository({ db }) {
  return {
    async findByEmail(email) {
      const row = await db('users').where({ email }).first();
      return row ? toUser(row) : null;
    },
    async findById(id) {
      const row = await db('users').where({ id }).first();
      return row ? toUser(row) : null;
    },
    async create({ email, passwordHash, role }) {
      try {
        const [row] = await db('users')
          .insert({ email, password_hash: passwordHash, role })
          .returning('*');
        return toUser(row);
      } catch (err) {
        // UNIQUE na emailu - działa też przy równoległych rejestracjach
        if (err.code === '23505' && err.constraint === 'users_email_unique') {
          throw new ConflictError('EMAIL_TAKEN', 'Email is already registered');
        }
        throw err;
      }
    },
  };
}

module.exports = { createUsersKnexRepository };
