'use server';
import { auth } from '../auth';
import { prisma, prismaPs1, prismaN64 } from '../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Console } from '@prisma/client';

// Hardcoded Admin ID for public view
const ADMIN_USER_ID = '1a5ab17f-d3de-4b43-84ef-de49c1b54a45';

export async function toggleGameOwnership(gameId: string, currentStatus: boolean, consoleType: string = 'PS1') {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const userId = session.user.id;
  // Ownership is ALWAYS in Auth DB (prisma), regardless of console
  // We identify the game by ID + Console

  // Map string to Enum
  const consoleEnum = consoleType === 'N64' ? Console.N64 : Console.PS1;

  if (currentStatus) {
    // Remove ownership
    await prisma.userGame.deleteMany({
      where: {
        userId: userId,
        gameId: gameId,
        console: consoleEnum
      },
    });
  } else {
    // Add ownership
    // Use upsert to be safe or deleteMany then create? create is fine if PK is composite
    // But safely, let's use create. If it exists, it might error if we didn't check.
    // The UI state suggests it's not owned.
    // We can use upsert on the composite ID if prisma supports it easily, or just create.
    // With @@id([userId, gameId, console]), create will fail if exists.

    // Check if exists first? Or just try create.
    const existing = await prisma.userGame.findUnique({
      where: {
        userId_gameId_console: {
          userId,
          gameId,
          console: consoleEnum
        }
      }
    });

    if (!existing) {
      await prisma.userGame.create({
        data: {
          userId,
          gameId,
          console: consoleEnum,
          owned: true,
        },
      });
    }
  }

  revalidatePath('/');
}

export async function getCollectionStats() {
  const session = await auth();
  // If no user is logged in, use the Admin ID to show the public collection stats
  const userId = session?.user?.id || ADMIN_USER_ID;

  if (!userId) {
    return {
      ps1: { total: 0, owned: 0, percentage: 0 },
      n64: { total: 0, owned: 0, percentage: 0 },
    };
  }

  // PS1 Stats
  const ps1Total = await prismaPs1.game.count();
  const ps1OwnedCount = await prisma.userGame.count({
    where: { userId, owned: true, console: 'PS1' },
  });

  // N64 Stats
  const n64Total = await prismaN64.game.count();
  const n64Owned = await prisma.userGame.count({
    where: {
      userId,
      owned: true,
      console: 'N64'
    },
  });

  return {
    ps1: {
      total: ps1Total,
      owned: ps1OwnedCount,
      percentage: ps1Total > 0 ? Math.round((ps1OwnedCount / ps1Total) * 100) : 0,
    },
    n64: {
      total: n64Total,
      owned: n64Owned,
      percentage: n64Total > 0 ? Math.round((n64Owned / n64Total) * 100) : 0,
    },
  };
}

export interface GroupedGame {
  title: string;
  coverPath: string | null;
  release_na?: string | null;
  release_jp?: string | null;
  release_pal?: string | null;
  variants: Array<{
    id: string;
    serial: string;
    region: string; // 'U' | 'J' | 'P'
    console: string;
    releaseYear: number | null;
    owned: boolean;
  }>;
}

export type GetGamesParams = {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  sort?: string;
  console?: string;
};

export async function getGames(params: GetGamesParams) {
  const { console = 'PS1' } = params;

  if (console === 'N64') {
    return getN64Games(params);
  } else {
    return getPS1Games(params);
  }
}

async function getN64Games({
  page = 1,
  limit = 25,
  search = '',
  sort = 'title'
}: GetGamesParams) {
  const session = await auth();
  const userId = session?.user?.id || ADMIN_USER_ID;
  const skip = (page - 1) * limit;

  // Filter for N64 DB
  const where: any = {};
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  // Count Total
  const total = await prismaN64.game.count({ where });

  // Fetch Games
  let allGames = await prismaN64.game.findMany({
    where,
    select: {
      id: true,
      title: true,
      release_na: true,
      release_jp: true,
      release_pal: true,
      // No owners relation here!
    }
  });

  // Fetch Ownership from Auth DB for these games
  const gameIds = allGames.map(g => g.id);
  const ownedGames = await prisma.userGame.findMany({
    where: {
      userId,
      console: 'N64',
      gameId: { in: gameIds },
      owned: true
    },
    select: { gameId: true }
  });
  const ownedSet = new Set(ownedGames.map(ug => ug.gameId));

  const parseDate = (dateStr: string | null) => {
    if (!dateStr || dateStr.toLowerCase().includes('unreleased')) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Map and calculate
  let formattedGames = allGames.map((game: any) => {
    const dates = [
      parseDate(game.release_na),
      parseDate(game.release_jp),
      parseDate(game.release_pal)
    ].filter(d => d !== null) as Date[];

    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;

    let region = 'U';
    if (!game.release_na && game.release_jp) region = 'J';
    else if (!game.release_na && !game.release_jp && game.release_pal) region = 'P';

    return {
      title: game.title,
      coverPath: `/api/n64-covers/${game.id}`,
      release_na: game.release_na,
      release_jp: game.release_jp,
      release_pal: game.release_pal,
      earliestDate: earliestDate,
      variants: [{
        id: game.id,
        serial: 'N64',
        region: region,
        console: 'N64',
        releaseYear: earliestDate ? earliestDate.getFullYear() : null,
        owned: ownedSet.has(game.id)
      }]
    };
  });

  // Sorting (in memory because variants logic is complex or unrelated to DB sort)
  // Wait, if pagination is applied AFTER sort, we must sort all?
  // Previous implementation: get ALL matching games, then map, sort, slice.
  // Wait, previous implementation fetched allGames?
  // Let's check previous code.
  // Yes: `let allGames = await prismaN64.game.findMany({...})`. It fetched ALL matches of search?
  // Then sliced in memory: `const paginatedGames = formattedGames.slice(skip, skip + limit);`
  // This is inefficient for large datasets but N64 library is small (~300 games). Acceptable.

  if (sort === 'year_desc') {
    formattedGames.sort((a: any, b: any) => {
      if (!a.earliestDate && !b.earliestDate) return 0;
      if (!a.earliestDate) return 1;
      if (!b.earliestDate) return -1;
      return b.earliestDate.getTime() - a.earliestDate.getTime();
    });
  } else if (sort === 'year_asc') {
    formattedGames.sort((a: any, b: any) => {
      if (!a.earliestDate && !b.earliestDate) return 0;
      if (!a.earliestDate) return 1;
      if (!b.earliestDate) return -1;
      return a.earliestDate.getTime() - b.earliestDate.getTime();
    });
  } else {
    formattedGames.sort((a: any, b: any) => a.title.localeCompare(b.title));
  }

  const paginatedGames = formattedGames.slice(skip, skip + limit);

  return {
    games: paginatedGames,
    metadata: {
      page,
      limit,
      total, // This total might be slightly off if findMany returned fewer? No, count matches findMany where.
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getPS1Games({
  page = 1,
  limit = 25,
  search = '',
  sort = 'title'
}: GetGamesParams) {
  const session = await auth();
  const userId = session?.user?.id || ADMIN_USER_ID;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  // Count Total
  const total = await prismaPs1.game.count({ where });

  // Fetch Games
  let allGames = await prismaPs1.game.findMany({
    where,
    select: {
      id: true,
      title: true,
      release_na: true,
      release_jp: true,
      release_pal: true,
    }
  });

  // Fetch Ownership from Auth DB
  const gameIds = allGames.map((g: any) => g.id);
  const ownedGames = await prisma.userGame.findMany({
    where: {
      userId,
      console: 'PS1',
      gameId: { in: gameIds },
      owned: true
    },
    select: { gameId: true }
  });
  const ownedSet = new Set(ownedGames.map(ug => ug.gameId));

  const parseDate = (dateStr: string | null) => {
    if (!dateStr || dateStr.toLowerCase().includes('unreleased')) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  let formattedGames = allGames.map((game: any) => {
    const dates = [
      parseDate(game.release_na),
      parseDate(game.release_jp),
      parseDate(game.release_pal)
    ].filter((d: any) => d !== null) as Date[];

    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map((d: any) => d.getTime()))) : null;

    return {
      title: game.title,
      coverPath: `/api/ps1-covers/${game.id}`,
      release_na: game.release_na,
      release_jp: game.release_jp,
      release_pal: game.release_pal,
      earliestDate: earliestDate,
      variants: [{
        id: game.id,
        serial: 'PS1',
        region: 'U',
        console: 'PS1',
        releaseYear: earliestDate ? earliestDate.getFullYear() : null,
        owned: ownedSet.has(game.id)
      }]
    };
  });

  // Sorting
  if (sort === 'year_desc') {
    formattedGames.sort((a: any, b: any) => {
      if (!a.earliestDate && !b.earliestDate) return 0;
      if (!a.earliestDate) return 1;
      if (!b.earliestDate) return -1;
      return b.earliestDate.getTime() - a.earliestDate.getTime();
    });
  } else if (sort === 'year_asc') {
    formattedGames.sort((a: any, b: any) => {
      if (!a.earliestDate && !b.earliestDate) return 0;
      if (!a.earliestDate) return 1;
      if (!b.earliestDate) return -1;
      return a.earliestDate.getTime() - b.earliestDate.getTime();
    });
  } else {
    formattedGames.sort((a: any, b: any) => a.title.localeCompare(b.title));
  }

  const paginatedGames = formattedGames.slice(skip, skip + limit);

  return {
    games: paginatedGames,
    metadata: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}