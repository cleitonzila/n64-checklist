// @ts-nocheck
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    console.log('Fetching N64 games...');
    // We exclude cover_data to avoid large payloads if it contains binary images
    const games = await prisma.game.findMany({
        select: {
            id: true,
            title: true,
            cover_path: true,
            release_na: true,
            release_jp: true,
            release_pal: true,
            developer: true,
            publisher: true
        }
    });

    console.log(`Found ${games.length} games.`);

    const outputPath = path.join(process.cwd(), 'n64_data.json');
    await fs.writeFile(outputPath, JSON.stringify(games, null, 2));
    console.log(`Data exported to ${outputPath}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
