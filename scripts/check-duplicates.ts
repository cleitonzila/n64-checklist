
import { prisma } from '../lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    // Find titles that appear more than once
    const games = await prisma.game.groupBy({
        by: ['title'],
        _count: {
            title: true,
        },
        having: {
            title: {
                _count: {
                    gt: 1,
                },
            },
        },
    });

    console.log(`Found ${games.length} titles with multiple versions.`);

    // Sample a few
    for (const g of games.slice(0, 5)) {
        const variants = await prisma.game.findMany({
            where: { title: g.title },
            select: { title: true, serial: true, region: true, console: true },
        });
        console.log(`\nTitle: ${g.title}`);
        console.table(variants);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
