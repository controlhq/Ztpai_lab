const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UnauthorizedError, NotFoundError } = require('../../errors');

const BCRYPT_ROUNDS = 12;
const JWT_ALGORITHM = 'HS256';

// hash porównywany, gdy użytkownik nie istnieje - czas odpowiedzi nie zdradza, czy email jest w bazie
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

function createAuthService({ usersRepository, jwtSecret, jwtExpiresIn }) {
  return {
    async register({ email, password }) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      // rola zawsze USER - ADMIN powstaje tylko w seedzie
      return usersRepository.create({ email, passwordHash, role: 'USER' });
    },

    async login({ email, password }) {
      const user = await usersRepository.findByEmail(email);
      const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

      // zły email i złe hasło - ta sama odpowiedź
      if (!user || !passwordOk) {
        throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
      }

      // payload: tylko rola; sub, iat i exp dokłada jsonwebtoken
      const accessToken = jwt.sign({ role: user.role }, jwtSecret, {
        algorithm: JWT_ALGORITHM,
        subject: String(user.id),
        expiresIn: jwtExpiresIn,
      });

      return { accessToken, tokenType: 'Bearer', expiresIn: jwtExpiresIn };
    },

    async getMe(userId) {
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
      }
      return user;
    },
  };
}

module.exports = { createAuthService, BCRYPT_ROUNDS, JWT_ALGORITHM };
