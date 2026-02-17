import { GameGridSkeleton } from '../components/GameCardSkeleton';

export default function Loading() {
    return (
        <main className="min-h-screen bg-gray-900 text-white pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header Skeleton */}
                <div className="mb-8 animate-pulse">
                    <div className="h-10 bg-gray-700 rounded w-64 mb-4" />
                    <div className="flex flex-wrap gap-4">
                        <div className="h-10 bg-gray-700 rounded flex-1 min-w-[200px]" />
                        <div className="h-10 bg-gray-700 rounded w-32" />
                        <div className="h-10 bg-gray-700 rounded w-32" />
                    </div>
                </div>

                {/* Grid Skeleton */}
                <GameGridSkeleton count={8} />
            </div>
        </main>
    );
}
