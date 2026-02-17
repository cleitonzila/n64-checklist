'use server';
import { auth } from '../auth';
import { prisma, prismaN64 } from '../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Hardcoded Admin ID for public view
const ADMIN_USER_ID = '1a5ab17f-d3de-4b43-84ef-de49c1b54a45';

export async function toggleGameOwnership(gameId: string, currentStatus: boolean, console: string = 'PS1') {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const userId = session.user.id;
  const targetPrisma = console === 'N64' ? prismaN64 : prisma;

  if (currentStatus) {
    // Se já tem, remove
    await targetPrisma.userGame.deleteMany({
      where: {
        userId: userId,
        gameId: gameId,
      },
    });
  } else {
    // Se não tem, adiciona
    await targetPrisma.userGame.create({
      data: {
        userId,
        gameId,
        owned: true,
      },
    });
  }

  revalidatePath('/'); // Atualiza a UI da home
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
  // We need to group by title to get accurate "unique games" count, as getPS1Games does
  // But for simple stats, counting distinct titles is enough?
  // getPS1Games groups by title and console.
  // Let's do a simple count for now, or distinct count if possible.
  // Prisma groupBy is good.

  const ps1TotalGrouped = await prisma.game.groupBy({
    by: ['title'],
    where: { console: 'PS1' },
  });
  const ps1Total = ps1TotalGrouped.length;

  const ps1OwnedCount = await prisma.userGame.count({
    where: {
      userId,
      owned: true,
      game: { console: 'PS1' } // Ensure we count only PS1 games in this DB
    },
  });

  // N64 Stats
  const n64Total = await prismaN64.game.count();
  const n64Owned = await prismaN64.userGame.count({
    where: {
      userId,
      owned: true,
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
  // Public users see Admin's collection
  const userId = session?.user?.id || ADMIN_USER_ID;
  const skip = (page - 1) * limit;

  // Filtro
  const where: any = {};
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  // Contagem Total
  const total = await prismaN64.game.count({ where });

  // Buscar Jogos
  let allGames = await prismaN64.game.findMany({
    where,
    select: {
      id: true,
      title: true,
      release_na: true,
      release_jp: true,
      release_pal: true,
      owners: userId ? {
        where: { userId }
      } : undefined
    }
  });

  const parseDate = (dateStr: string | null) => {
    if (!dateStr || dateStr.toLowerCase().includes('unreleased')) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Mapear e calcular data mínima para ordenação
  let formattedGames = allGames.map((game: any) => {
    const dates = [
      parseDate(game.release_na),
      parseDate(game.release_jp),
      parseDate(game.release_pal)
    ].filter(d => d !== null) as Date[];

    const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;

    // Determine region based on release dates priority
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
        owned: userId ? (game.owners.length > 0 ? game.owners[0].owned : false) : false
      }]
    };
  });

  // Ordenação customizada
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
    // Default title sort
    formattedGames.sort((a: any, b: any) => a.title.localeCompare(b.title));
  }

  // Paginação em memória
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

async function getPS1Games({
  page = 1,
  limit = 25,
  search = '',
  region = 'all',
  sort = 'title'
}: GetGamesParams) {
  const session = await auth();
  // Public users see Admin's collection
  const userId = session?.user?.id || ADMIN_USER_ID;

  const skip = (page - 1) * limit;

  // 1. Filtro base
  const where: Prisma.GameWhereInput = {
    console: 'PS1',
    OR: search
      ? [
        { title: { contains: search, mode: 'insensitive' } },
        { serial: { contains: search, mode: 'insensitive' } },
      ]
      : undefined,
  };

  if (region === 'USA') where.region = { equals: 'U' };
  else if (region === 'JPN') where.region = { equals: 'J' };
  else if (region === 'EUR') where.region = { equals: 'P' };

  let orderByGroupBy: Prisma.Enumerable<Prisma.GameOrderByWithAggregationInput> | undefined;

  if (sort === 'year_desc') {
    orderByGroupBy = { _min: { releaseYear: 'desc' } };
  } else if (sort === 'year_asc') {
    orderByGroupBy = { _min: { releaseYear: 'asc' } };
  } else {
    orderByGroupBy = { title: 'asc' };
  }

  const distinctGroups = await (prisma.game as any).groupBy({
    by: ['title', 'console'],
    where,
    _min: {
      releaseYear: true,
    },
    orderBy: orderByGroupBy as any,
    skip,
    take: limit,
  });

  const titleList: string[] = distinctGroups.map((g: any) => g.title);

  const totalGrouped = await (prisma.game as any).groupBy({
    by: ['title', 'console'],
    where,
    _count: { title: true },
  });
  const total = totalGrouped.length;

  const games = await (prisma.game as any).findMany({
    where: {
      title: { in: titleList },
      console: 'PS1',
    },
    orderBy: { region: 'asc' },
    include: {
      owners: userId
        ? {
          where: { userId },
          select: { owned: true },
        }
        : false,
    },
  });

  const groupedMap = new Map<string, GroupedGame>();

  titleList.forEach((t: string) => {
    groupedMap.set(t, {
      title: t,
      coverPath: null,
      variants: []
    });
  });

  games.forEach((game: any) => {
    const entry = groupedMap.get(game.title);
    if (entry) {
      if (!entry.coverPath && game.coverPath) entry.coverPath = `/api/ps1-covers/${game.id}`;
      entry.variants.push({
        id: game.id,
        serial: game.serial,
        region: game.region,
        console: game.console,
        releaseYear: game.releaseYear,
        owned: userId ? (game.owners.length > 0 ? game.owners[0].owned : false) : false
      });
    }
  });

  const formattedGames = Array.from(groupedMap.values());

  return {
    games: formattedGames,
    metadata: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}