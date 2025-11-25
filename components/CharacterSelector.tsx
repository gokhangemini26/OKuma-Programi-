import React from 'react';
import { CHARACTERS } from '../constants';
import { Character } from '../types';

interface CharacterSelectorProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({ selectedIds, onToggle }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 p-2 md:p-4">
      {CHARACTERS.map((char) => {
        const isSelected = selectedIds.includes(char.id);
        return (
          <div
            key={char.id}
            onClick={() => onToggle(char.id)}
            className={`
              relative cursor-pointer rounded-xl overflow-hidden border-2 md:border-4 transition-all duration-200 transform
              ${isSelected ? 'border-indigo-500 shadow-lg scale-105 bg-indigo-50' : 'border-white shadow-sm bg-white hover:scale-105'}
            `}
          >
            <img 
              src={char.image} 
              alt={char.name} 
              className="w-full h-24 md:h-32 object-contain p-2"
            />
            <div className={`
              text-center font-bold py-1 text-sm md:text-base
              ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'}
            `}>
              {char.name}
            </div>
            {isSelected && (
              <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-indigo-500 text-white rounded-full p-0.5 md:p-1 shadow z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};