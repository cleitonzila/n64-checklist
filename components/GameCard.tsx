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
      <img src={game.imageUrl} alt={game.titleEn} />
      <h3>{game.titleEn}</h3>
      <p className="text-sm text-gray-500">{game.titleJp}</p>
      <button onClick={handleToggle} disabled={!isEditable}>
        {optimisticOwned ? 'Possuído' : (isEditable ? 'Marcar' : 'Não tenho')}
      </button>
    </div>
  );
}