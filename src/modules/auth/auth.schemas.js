const { z } = require('zod');

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

// bcrypt bierze pod uwagę maksymalnie 72 bajty
const password = z
  .string()
  .min(10)
  .max(72)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password must not exceed 72 bytes',
  });

const registerBody = z
  .object({
    email,
    password,
  })
  .strict();

// przy logowaniu nie sprawdzamy reguł hasła - złe hasło ma dać 401, a nie 400
const loginBody = z
  .object({
    email,
    password: z.string().min(1).max(256),
  })
  .strict();

module.exports = { registerBody, loginBody };
