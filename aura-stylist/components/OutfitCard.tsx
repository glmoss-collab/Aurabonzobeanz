
import React, { useState } from 'react';
import { OutfitSuggestion, StyleType } from '../types';
import { editOutfitImage } from '../services/geminiService';
import { Check } from 'lucide-react';

interface OutfitCardProps {
  outfit: OutfitSuggestion;
  onUpdate: (newImageUrl: string) => void;
  onColorClick: (color: string) => void;
  activeFilter?: string | null;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, onUpdate, onColorClick, activeFilter }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt || !outfit.imageUrl) return;

    try {
      setIsEditing(true);
      const newImage = await editOutfitImage(outfit.imageUrl, editPrompt);
      onUpdate(newImage);
      setEditPrompt('');
    } catch (err) {
      console.error("Edit failed", err);
    } finally {
      setIsEditing(false);
    }
  };

  const badgeColors = {
    [StyleType.CASUAL]: "bg-emerald-100 text-emerald-700",
    [StyleType.BUSINESS]: "bg-blue-100 text-blue-700",
    [StyleType.NIGHT_OUT]: "bg-purple-100 text-purple-700",
  };

  return (
    <div className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-100 flex flex-col h-full transition-all duration-300 hover:shadow-xl ${activeFilter && outfit.colorsUsed.includes(activeFilter) ? 'ring-2 ring-black ring-offset-4' : ''}`}>
      <div className="relative aspect-square bg-zinc-50 flex items-center justify-center overflow-hidden">
        {outfit.isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-400 text-xs font-semibold tracking-widest uppercase">Designing...</p>
          </div>
        ) : outfit.imageUrl ? (
          <img 
            src={outfit.imageUrl} 
            alt={`${outfit.type} outfit`} 
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          />
        ) : (
          <p className="text-red-500 text-sm p-4 text-center">{outfit.error || 'Failed to generate'}</p>
        )}
      </div>

      <div className="p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-6">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${badgeColors[outfit.type]}`}>
            {outfit.type}
          </span>
          <div className="flex -space-x-1.5">
            {outfit.colorsUsed.map((color, i) => (
              <button 
                key={i} 
                onClick={() => onColorClick(color)}
                className={`w-5 h-5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125 hover:z-10 flex items-center justify-center ${activeFilter === color ? 'ring-1 ring-black scale-125 z-10' : ''}`} 
                style={{ backgroundColor: color }}
                title={`Filter by ${color}`}
              >
                {activeFilter === color && <Check className="w-3 h-3 text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-zinc-600 text-sm mb-8 leading-relaxed flex-grow font-light">
          {outfit.description}
        </p>

        {outfit.imageUrl && !outfit.isGenerating && (
          <form onSubmit={handleEdit} className="mt-auto pt-6 border-t border-zinc-50">
            <div className="relative">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Adjust this look..."
                className="w-full pl-4 pr-10 py-3 bg-zinc-50 rounded-xl text-sm border border-transparent focus:border-zinc-200 focus:bg-white focus:ring-0 outline-none transition-all placeholder:text-zinc-300"
                disabled={isEditing}
              />
              <button
                type="submit"
                disabled={!editPrompt || isEditing}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-black disabled:opacity-30 transition-colors"
              >
                {isEditing ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OutfitCard;
