'use client';

export default function GameCardSkeleton() {
    return (
        <div className="relative bg-gray-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-gray-700/50 flex flex-col animate-pulse">
            {/* Cover Area Skeleton */}
            <div className="relative aspect-square w-full bg-gray-700" />

            {/* Content Area Skeleton */}
            <div className="p-4 flex flex-col flex-1 space-y-3">
                {/* Title Skeleton */}
                <div className="h-5 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />

                {/* Variants Skeleton */}
                <div className="mt-auto space-y-2 pt-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30 border border-gray-600/50">
                        <div className="flex flex-col gap-1.5 w-full">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-10 bg-gray-600 rounded" />
                                <div className="h-3 w-20 bg-gray-600 rounded" />
                            </div>
                            <div className="h-2 w-12 bg-gray-600 rounded" />
                        </div>
                        <div className="w-6 h-6 bg-gray-600 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function GameGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <GameCardSkeleton key={i} />
            ))}
        </div>
    );
}
