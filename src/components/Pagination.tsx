'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type PaginationProps = {
    currentPage: number;
    totalPages: number;
};

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex justify-center items-center space-x-4 mt-8">
            <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Anterior
            </button>

            <span className="text-gray-300">
                Página {currentPage} de {totalPages}
            </span>

            <button
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Próxima
            </button>
        </div>
    );
}
