'use client';
import { useOptimistic, startTransition } from 'react';
import { toggleGameOwnership } from '../actions/game-actions';

export function GameCard({ game, isOwned = false, isEditable = false }: { game: any, isOwned?: boolean, isEditable?: boolean }) {
  const [optimisticOwned, setOptimisticOwned] = useOptimistic(
    isOwned,
    (state, newStatus: boolean) => newStatus
  );

  const handleToggle = async () => {
    startTransition(() => {
      setOptimisticOwned(!optimisticOwned); // Atualiza UI imediatamente
      toggleGameOwnership(game.id, optimisticOwned); // Chama server action
    });
  };

  return (
    <div className={`card ${optimisticOwned ? 'bg-green-100' : 'bg-gray-100'}`}>
      <img src={game.coverPath || '/placeholder_cover.svg'} alt={game.title} className="w-full h-48 object-cover rounded-t-lg" />
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{game.title}</h3>
        <button onClick={handleToggle} disabled={!isEditable} className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {optimisticOwned ? 'Possuído' : (isEditable ? 'Marcar' : 'Não tenho')}
        </button>
      </div>
    </div>
  );
}