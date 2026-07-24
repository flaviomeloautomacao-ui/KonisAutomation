/**
 * Seed de admin executado no START do container (idempotente / create-only).
 *
 * Objetivo: garantir que exista um usuário admin em produção sem precisar rodar
 * nenhum script manual. Roda com `node` puro (sem tsx) usando apenas `pg` e
 * `bcryptjs`, que são dependências de produção — por isso sobrevive ao
 * `npm prune --omit=dev` do Dockerfile.
 *
 * Comportamento:
 *   - No-op se SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD não estiverem definidos.
 *   - Cria o admin APENAS se o email ainda não existir (ON CONFLICT DO NOTHING).
 *     Nunca sobrescreve a senha de um usuário já existente — reiniciar o
 *     container não reseta credenciais.
 *   - Nunca derruba o start: qualquer erro é logado e o processo sai com 0,
 *     deixando o `npm run start` seguir normalmente.
 *
 * Env vars:
 *   DATABASE_URL         (obrigatório) — mesma string usada pelo Prisma.
 *   SEED_ADMIN_EMAIL     (obrigatório para agir)
 *   SEED_ADMIN_PASSWORD  (obrigatório para agir)
 *   SEED_ADMIN_NAME      (opcional; default "Administrador")
 */

import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const email = process.env.SEED_ADMIN_EMAIL?.trim();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";

if (!email || !password) {
  console.log(
    "[seed-admin] SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD não definidos — pulando seed.",
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "[seed-admin] DATABASE_URL não definido — pulando seed (app segue no ar).",
  );
  process.exit(0);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Mesma config TLS do lib/prisma.ts (Supabase pooler).
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
  // Não deixa o start pendurado se o banco estiver inacessível.
  connectionTimeoutMillis: 10000,
});

try {
  const hash = await bcrypt.hash(password, 10);

  const res = await pool.query(
    `INSERT INTO users (id, name, email, password, created_at, updated_at)
     VALUES (gen_random_uuid()::text, $1, $2, $3, now(), now())
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [name, email, hash],
  );

  if (res.rowCount > 0) {
    console.log(`[seed-admin] admin criado: ${email} (id: ${res.rows[0].id})`);
  } else {
    console.log(`[seed-admin] admin já existe: ${email} — nada a fazer.`);
  }
} catch (err) {
  console.error(
    "[seed-admin] falha ao criar admin (app segue no ar):",
    err?.message ?? err,
  );
} finally {
  await pool.end().catch(() => {});
}

process.exit(0);
