import { NextResponse } from 'next/server';
import { prisma, prismaPs1 } from '../../../../lib/prisma';

export async function GET() {
    const result: any = {};

    try {
        // Auth DB Tables
        const authTables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        // Serializing BigInt if any (unlikely for table names)
        result.authTables = authTables;
    } catch (e: any) {
        result.authError = e.message;
    }

    try {
        // PS1 DB Tables
        const ps1Tables = await prismaPs1.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        result.ps1Tables = ps1Tables;
    } catch (e: any) {
        result.ps1Error = e.message;
    }

    // Show masked URLs to verify they are distinct
    // Warning: showing partial secrets, but safest way to verify distinctness
    // We show the "host" part roughly
    const mask = (url?: string) => {
        if (!url) return 'undefined';
        try {
            // regex to capture host part
            const match = url.match(/@([^/]+)/);
            return match ? match[1] : 'invalid-url-format';
        } catch {
            return 'error-parsing';
        }
    };

    result.urls = {
        AUTH_HOST: mask(process.env.AUTH_DATABASE_URL),
        PS1_HOST: mask(process.env.PS1_DATABASE_URL),
        N64_HOST: mask(process.env.N64_DATABASE_URL),
    };

    return NextResponse.json(result);
}
