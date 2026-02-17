
import { prisma } from '../../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const game = await prisma.game.findUnique({
            where: { id },
            select: { coverData: true },
        });

        if (!game || !game.coverData) {
            // Fallback for games without cover
            return NextResponse.redirect(new URL('/placeholder_cover.svg', request.url));
        }

        // Determine Content-Type based on magic bytes or just assume JPEG/PNG
        // Most covers were .jpg, so defaulting to image/jpeg is safe-ish.
        // Browsers are good at sniffing too.
        const headers = new Headers();
        headers.set('Content-Type', 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(game.coverData, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Error fetching PS1 cover:', error);
        return new NextResponse(null, { status: 500 });
    }
}
