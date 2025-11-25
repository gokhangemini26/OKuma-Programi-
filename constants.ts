import { Character } from './types';

// Karakter görselleri, belirtilen isimlerle (örn. Leo.png) ana dizinde bulunmalıdır.
export const CHARACTERS: Character[] = [
  { id: 'leo', name: 'Leo', image: './Leo.png' },
  { id: 'bibo', name: 'Bibo', image: './Bibo.png' },
  { id: 'pampa', name: 'Pampa', image: './Pampa.png' },
  { id: 'pamuk', name: 'Pamuk', image: './Pamuk.png' },
  { id: 'akita', name: 'Akita', image: './Akita.png' },
  { id: 'pika', name: 'Pika', image: './Pika.png' },
  { id: 'poni', name: 'Poni', image: './Poni.png' },
  { id: 'riki', name: 'Riki', image: './Riki.png' },
  { id: 'biva', name: 'Biva', image: './Biva.png' },
  { id: 'zipi', name: 'Zipi', image: './Zipi.png' },
];

export const DEFAULT_TARGET_WPM = 80;