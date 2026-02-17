import { getGames, getCollectionStats, GroupedGame } from '../../actions/game-actions';
import { auth } from '../../auth';
import Header from '../components/Header';
import GameCard from '../components/GameCard';
import N64GameCard from '../components/N64GameCard';
import Pagination from '../components/Pagination';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    region?: string;
    sort?: string;
    console?: string;
  }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const consoleParam = params?.console;

  const session = await auth();
  const stats = await getCollectionStats();

  // View: Console Selection (Landing Page)
  if (!consoleParam) {
    return (
      <main className="min-h-screen bg-gray-900 text-white pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 h-screen flex flex-col">
          <Header user={session?.user} />

          <div className="flex-1 flex flex-col items-center justify-center -mt-20 fade-in">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-12 text-center tracking-tight">
              Sua Coleção
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
              {/* PS1 Card */}
              <Link
                href="/?console=PS1"
                className="group relative h-64 md:h-80 rounded-3xl overflow-hidden bg-gray-800 border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black/60 z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20 mb-8">
                  <span className="text-4xl md:text-5xl font-black text-white tracking-widest drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                    PS1
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-300">Progresso</span>
                    <span className="text-2xl font-bold text-white">{stats.ps1.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                    <div
                      className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] relative overflow-hidden"
                      style={{ width: `${stats.ps1.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 font-mono text-right">
                    {stats.ps1.owned} / {stats.ps1.total} Jogos
                  </div>
                </div>

                {/* Decorative background circle */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-colors" />
              </Link>

              {/* N64 Card */}
              <Link
                href="/?console=N64"
                className="group relative h-64 md:h-80 rounded-3xl overflow-hidden bg-gray-800 border-2 border-gray-700 hover:border-red-500 transition-all duration-300 hover:shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 to-black/60 z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20 mb-8">
                  <span className="text-4xl md:text-5xl font-black text-white tracking-widest drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                    N64
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-gray-300">Progresso</span>
                    <span className="text-2xl font-bold text-white">{stats.n64.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                    <div
                      className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] relative overflow-hidden"
                      style={{ width: `${stats.n64.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 font-mono text-right">
                    {stats.n64.owned} / {stats.n64.total} Jogos
                  </div>
                </div>

                {/* Decorative background circle */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl group-hover:bg-red-500/40 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // View: Game List
  const search = params?.search || '';
  const page = Number(params?.page) || 1;
  const region = params?.region || 'all';
  const sort = params?.sort || 'title';
  const console = consoleParam; // Confirmed string
  const limit = 25;

  const { games, metadata } = await getGames({ page, limit, search, region, sort, console });

  return (
    <main className="min-h-screen bg-gray-900 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        <Header user={session?.user} />

        {games.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400">Nenhum jogo encontrado para "{search}"</p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${console === 'N64' ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-6`}>
              {games.map((game: GroupedGame) => (
                console === 'N64' ? (
                  <N64GameCard key={game.variants[0].id} game={game} isEditable={!!session?.user} />
                ) : (
                  <GameCard key={game.variants[0].id} game={game} isEditable={!!session?.user} />
                )
              ))}
            </div>

            <Pagination
              currentPage={metadata.page}
              totalPages={metadata.totalPages}
            />
          </>
        )}
      </div>
    </main>
  );
}
