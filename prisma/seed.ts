import 'dotenv/config';
import { PrismaClient } from 'prisma-ps1-client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(process.cwd(), 'ps1_complete_database.json');
  const games = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Iniciando importação de ${games.length} jogos...`);

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.id || game.serial },
      update: {},
      create: {
        id: game.id || game.serial,
        title: game.title,
        developer: game.developer || null,
        publisher: game.publisher || null,
        release_jp: game.release_jp || game.date || null,
        release_na: game.release_na || null,
        release_pal: game.release_pal || null,
        cover_path: game.cover_path || null,
      },
    });
  }
  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });