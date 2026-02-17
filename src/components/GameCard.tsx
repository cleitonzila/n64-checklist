'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { toggleGameOwnership, GroupedGame } from '../../actions/game-actions';
import Image from 'next/image';

// Map regions to flags/labels
const regionMap: Record<string, { label: string; color: string }> = {
    U: { label: 'USA', color: 'bg-blue-500' },
    J: { label: 'JPN', color: 'bg-red-500' },
    P: { label: 'EUR', color: 'bg-yellow-500' },
};

export default function GameCard({ game }: { game: GroupedGame }) {
    const [isPending, startTransition] = useTransition();
    const [expanded, setExpanded] = useState(false);

    // Optimistic UI state for VARIANTS
    const [optimisticVariants, setOptimisticVariants] = useOptimistic(
        game.variants,
        (state, { id, status }: { id: string; status: boolean }) =>
            state.map((v) => (v.id === id ? { ...v, owned: status } : v))
    );

    const handleToggle = async (variantId: string, currentStatus: boolean) => {
        const variant = optimisticVariants.find(v => v.id === variantId);
        const consoleType = variant?.console || 'PS1';
        startTransition(async () => {
            setOptimisticVariants({ id: variantId, status: !currentStatus });
            await toggleGameOwnership(variantId, currentStatus, consoleType);
        });
    };

    // Check if any variant is owned to highlight the main card
    const isAnyOwned = optimisticVariants.some(v => v.owned);
    const variantsCount = optimisticVariants.length;

    const defaultCover = '/placeholder_cover.svg'; // Using the SVG we just created
    // Fix: Check if path already starts with ps1_covers, and ENCODE IT
    const getEncodedCoverPath = (path: string | null) => {
        if (!path) return defaultCover;
        // Normaliza o caminho para garantir que começa corretamente
        let cleanPath = path;
        if (cleanPath.startsWith('ps1_covers/')) cleanPath = '/' + cleanPath;
        else if (!cleanPath.startsWith('/ps1_covers/')) cleanPath = `/ps1_covers/${cleanPath}`;

        // Encode each segment to handle spaces and special chars like '&'
        return cleanPath.split('/').map(segment => encodeURIComponent(segment).replace(/%3A/g, ':')).join('/').replace('%2Fps1_covers', '/ps1_covers');
    };

    const [imgSrc, setImgSrc] = useState(getEncodedCoverPath(game.coverPath));

    return (
        <div
            className={`group relative bg-gray-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700/50 hover:border-blue-500/50 flex flex-col ${isAnyOwned ? 'ring-1 ring-green-500/50' : ''}`}
            onContextMenu={(e) => { e.preventDefault(); /* Optional: Quick actions on right click? */ }}
        >
            {/* Cover Image Area */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-900">
                <Image
                    src={imgSrc}
                    alt={game.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={() => {
                        if (imgSrc !== defaultCover) {
                            setImgSrc(defaultCover);
                        }
                    }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />

                {/* Top Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {variantsCount > 1 && (
                        <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-sm">
                            {variantsCount} VERSÕES
                        </span>
                    )}
                    {isAnyOwned && (
                        <span className="bg-green-500/90 text-white p-1 rounded-full shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                        </span>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1 relative z-10">
                <h3 className="text-lg font-bold text-white mb-1 leading-tight line-clamp-2" title={game.title}>
                    {game.title}
                </h3>

                <div className="mt-auto space-y-2 pt-3">
                    {/* Variants List */}
                    <div className="space-y-2">
                        {optimisticVariants.map((variant) => (
                            <div
                                key={variant.id}
                                className={`flex items-center justify-between p-2 rounded-lg transition-colors border ${variant.owned ? 'bg-green-900/20 border-green-800' : 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'}`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${regionMap[variant.region]?.color || 'bg-gray-500'}`}>
                                            {regionMap[variant.region]?.label || variant.region}
                                        </span>
                                        <span className="text-xs text-gray-300 font-mono truncate">
                                            {variant.serial}
                                        </span>
                                    </div>
                                    {variant.releaseYear && (
                                        <span className="text-[10px] text-gray-500 mt-0.5">
                                            {variant.releaseYear}
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleToggle(variant.id, variant.owned)}
                                    disabled={isPending}
                                    className={`p-1.5 rounded-full transition-all duration-200 ${variant.owned
                                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                                        : 'bg-gray-600 text-gray-400 hover:bg-gray-500 hover:text-white'
                                        }`}
                                    title={variant.owned ? "Remover da Coleção" : "Adicionar à Coleção"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
