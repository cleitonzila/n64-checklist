import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Caminho para o JSON na raiz do projeto
  const dataPath = path.join(process.cwd(), 'ps1_complete_database.json');
  const games = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`Iniciando importação de ${games.length} jogos...`);

  // Usamos um loop simples para o Neon não derrubar a conexão por excesso de requests
  for (const game of games) {
    await prisma.game.upsert({
      where: { serial: game.serial },
      update: {},
      create: {
        title: game.title,
        serial: game.serial,
        releaseDate: game.date,
        releaseYear: game.year !== "N/A" ? parseInt(game.year) : null,
        coverPath: game.cover_path,
        sourceUrl: game.url,
        region: game.url.includes('/U/') ? 'U' : game.url.includes('/J/') ? 'J' : 'P',
        console: 'PS1'
      },
    });
  }
  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });