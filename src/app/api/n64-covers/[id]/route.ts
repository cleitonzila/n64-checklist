import { NextResponse } from 'next/server';
import { prismaN64 } from '../../../../../lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const game = await prismaN64.game.findUnique({
            where: { id },
            select: { cover_data: true }
        });

        if (!game || !game.cover_data) {
            return new NextResponse('Not Found', { status: 404 });
        }

        return new NextResponse(game.cover_data, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error fetching N64 cover:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
