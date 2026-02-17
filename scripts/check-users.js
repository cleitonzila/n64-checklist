
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const userCount = await prisma.user.count();
        console.log(`Total users: ${userCount}`);

        if (userCount > 0) {
            const firstUser = await prisma.user.findFirst();
            console.log('First user:', firstUser.username);
        }
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
