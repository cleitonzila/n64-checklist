import bcrypt from 'bcryptjs';

export async function saltAndHashPassword(password: string) {
  const saltRounds = 12; // 12 é um bom balanço entre segurança e performance
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}