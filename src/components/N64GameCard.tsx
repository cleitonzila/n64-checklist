'use client';

import { useTransition } from 'react';
import { toggleGameOwnership, GroupedGame } from '../../actions/game-actions';
import Image from 'next/image';

interface N64GameCardProps {
    game: GroupedGame;
    isEditable?: boolean;
}

export default function N64GameCard({ game, isEditable = false }: N64GameCardProps) {
    const [isPending, startTransition] = useTransition();
    const variant = game.variants[0]; // N64 games currently have a single variant in the mapped structure

    const handleToggle = async () => {
        startTransition(async () => {
            // Re-using ps1 toggle logic with N64 console param
            await toggleGameOwnership(variant.id, variant.owned, 'N64');
        });
    };

    const defaultCover = '/placeholder_cover.svg';
    const isOwned = variant.owned;

    return (
        <div
            className={`group relative bg-gray-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700/50 hover:border-blue-500/50 flex flex-col h-full ${isOwned ? 'ring-1 ring-green-500/50' : ''}`}
        >
            {/* Cover Image Area - 3:2 Horizontal */}
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-gray-900">
                <Image
                    src={game.coverPath || defaultCover}
                    alt={game.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />

                {isOwned && (
                    <div className="absolute top-3 right-3 bg-green-500 shadow-lg shadow-green-900/40 text-white p-1 rounded-full z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col flex-1 relative z-10">
                <div className="h-[3.5rem] mb-4 flex items-center">
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2" title={game.title}>
                        {game.title}
                    </h3>
                </div>

                <div className="space-y-4 flex-1 flex flex-col justify-between">
                    {/* Release Dates Table - Aligned across cards */}
                    <div className="bg-gray-900/40 rounded-xl border border-gray-700/30 overflow-hidden">
                        <div className="grid grid-cols-2 text-[11px] font-bold text-gray-400 border-b border-gray-700/30">
                            <div className="px-3 py-2 bg-gray-800/50 border-r border-gray-700/30 uppercase tracking-wider">Região</div>
                            <div className="px-3 py-2 bg-gray-800/50 uppercase tracking-wider">Lançamento</div>
                        </div>
                        <div className="divide-y divide-gray-700/30">
                            <div className="grid grid-cols-2 text-[12px] text-gray-300">
                                <div className="px-3 py-2 border-r border-gray-700/30 font-medium bg-gray-800/20">USA</div>
                                <div className="px-3 py-2 font-mono text-gray-400">{game.release_na || '-'}</div>
                            </div>
                            <div className="grid grid-cols-2 text-[12px] text-gray-300">
                                <div className="px-3 py-2 border-r border-gray-700/30 font-medium bg-gray-800/20">JPN</div>
                                <div className="px-3 py-2 font-mono text-gray-400">{game.release_jp || '-'}</div>
                            </div>
                            <div className="grid grid-cols-2 text-[12px] text-gray-300">
                                <div className="px-3 py-2 border-r border-gray-700/30 font-medium bg-gray-800/20">EUR</div>
                                <div className="px-3 py-2 font-mono text-gray-400">{game.release_pal || '-'}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleToggle}
                        disabled={isPending || !isEditable}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 mt-4 
                            ${!isEditable ? 'cursor-default opacity-90' : ''}
                            ${isOwned
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/40'
                                : isEditable
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                                    : 'bg-gray-700 text-gray-400'
                            }`}
                    >
                        {isPending ? 'Processando...' : isOwned ? 'Na Coleção' : isEditable ? 'Marcar como Possuído' : 'Não está na coleção'}
                    </button>
                </div>
            </div>
        </div>
    );
}
