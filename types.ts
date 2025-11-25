export interface Character {
  id: string;
  name: string;
  image: string; // URL or path
}

export interface ReadingSession {
  id: string;
  date: string;
  storyTitle: string;
  wpm: number;
  durationSeconds: number;
  wordCount: number;
  feedback: string;
}

export interface UserProfile {
  name: string;
  targetWpm: number;
  history: ReadingSession[];
}

export interface StoryData {
  title: string;
  content: string;
  theme: string;
  gender: string;
}

export enum AppState {
  DASHBOARD = 'DASHBOARD',
  CHARACTER_SELECTION = 'CHARACTER_SELECTION',
  STORY_GENERATION = 'STORY_GENERATION',
  READING = 'READING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
}

export interface CharacterSelection {
  selectedIds: string[];
}