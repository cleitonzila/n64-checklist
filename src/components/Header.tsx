'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { logout } from '../../actions/auth-actions';

interface HeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export default function Header({ user }: HeaderProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <header className="mb-8 p-6 bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 pointer-events-none" />

            <div className="relative z-10">
                <h1 className="text-4xl font-extrabold mb-6 text-center">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-lg">
                        Retro Checklist
                    </span>
                </h1>

                <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
                    <div className="flex-1 relative group">
                        <label htmlFor="search" className="sr-only">
                            Buscar
                        </label>
                        <input
                            id="search"
                            className="peer block w-full rounded-xl border border-gray-600/50 bg-gray-700/50 backdrop-blur-sm py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white outline-none transition-all duration-200"
                            placeholder="Buscar por Título ou Serial..."
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={searchParams.get('search')?.toString()}
                        />
                        <div className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 peer-focus:text-blue-400 transition-colors duration-200">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center justify-center md:justify-end">
                        <div className="flex bg-gray-700/50 backdrop-blur-sm rounded-xl p-1 border border-gray-600/50">
                            {[
                                { id: 'PS1', label: 'PS1' },
                                { id: 'N64', label: 'N64' },
                            ].map((tab) => {
                                const isActive = (searchParams.get('console') || 'PS1') === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleFilter('console', tab.id)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <select
                            className="rounded-xl border border-gray-600/50 bg-gray-700/50 backdrop-blur-sm py-2.5 px-4 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all duration-200 hover:bg-gray-600/50"
                            onChange={(e) => handleFilter('region', e.target.value)}
                            defaultValue={searchParams.get('region')?.toString() || 'all'}
                        >
                            <option value="all">Todas</option>
                            <option value="USA">USA</option>
                            <option value="JPN">Japan</option>
                            <option value="EUR">Europe</option>
                        </select>

                        <select
                            className="rounded-xl border border-gray-600/50 bg-gray-700/50 backdrop-blur-sm py-2.5 px-4 text-sm text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer transition-all duration-200 hover:bg-gray-600/50"
                            onChange={(e) => handleFilter('sort', e.target.value)}
                            defaultValue={searchParams.get('sort')?.toString() || 'title'}
                        >
                            <option value="title">A-Z</option>
                            <option value="year_desc">Mais Recentes</option>
                            <option value="year_asc">Mais Antigos</option>
                        </select>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-300 hidden md:inline font-medium">
                                    {user.name}
                                </span>
                                <button
                                    onClick={() => logout()}
                                    className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
                                >
                                    Sair
                                </button>
                            </div>
                        ) : (
                            <a
                                href="/login"
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40"
                            >
                                Entrar
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
