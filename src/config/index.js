const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// jedyne miejsce w aplikacji, które czyta process.env
dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .url({ protocol: /^postgres(ql)?$/, error: 'must be a valid postgresql:// URL' }),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters long'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'must be a duration like 10s, 15m, 1h or 7d')
    .default('15m'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid configuration - application will not start:');
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = result.data;

module.exports = Object.freeze({
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwt: Object.freeze({
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  }),
});
