import React, { useState, useEffect } from 'react';
import { 
  CharacterSelection, 
  AppState, 
  StoryData, 
  UserProfile, 
  ReadingSession 
} from './types';
import { CHARACTERS, DEFAULT_TARGET_WPM } from './constants';
import { Dashboard } from './components/Dashboard';
import { CharacterSelector } from './components/CharacterSelector';
import { ReadingRecorder } from './components/ReadingRecorder';
import { ResultsView } from './components/ResultsView';
import { generateStory, analyzeReading } from './services/geminiService';
import { Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [welcomeInputName, setWelcomeInputName] = useState('');
  
  // Session State
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [currentStory, setCurrentStory] = useState<StoryData | null>(null);
  const [lastSession, setLastSession] = useState<ReadingSession | null>(null);
  
  // Loading & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Persist Users
  useEffect(() => {
    const saved = localStorage.getItem('okuma_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUsers(parsed);
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          setCurrentUserName(keys[0]);
        }
      } catch (e) {
        console.error("Failed to parse users", e);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(users).length > 0) {
      localStorage.setItem('okuma_users', JSON.stringify(users));
    } else {
      localStorage.removeItem('okuma_users');
    }
  }, [users]);

  // Handlers
  const handleCreateUser = (name: string) => {
    if (!name.trim()) return;
    const cleanName = name.trim();
    
    if (users[cleanName]) {
        alert("Bu isimde bir kullanıcı zaten var.");
        return;
    }

    const newUser: UserProfile = { name: cleanName, targetWpm: DEFAULT_TARGET_WPM, history: [] };
    setUsers(prev => ({ ...prev, [cleanName]: newUser }));
    setCurrentUserName(cleanName);
    setWelcomeInputName('');
  };

  const handleDeleteUser = (nameToDelete: string) => {
    const newUsers = { ...users };
    delete newUsers[nameToDelete];
    
    const remainingKeys = Object.keys(newUsers);
    
    setUsers(newUsers);

    if (remainingKeys.length === 0) {
        setCurrentUserName('');
    } else {
        if (currentUserName === nameToDelete) {
            setCurrentUserName(remainingKeys[0]);
        }
    }
  };

  const handleToggleCharacter = (id: string) => {
    setSelectedCharIds(prev => {
      if (prev.includes(id)) return prev.filter(cid => cid !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleGenerateStory = async () => {
    if (selectedCharIds.length === 0) return;
    setIsLoading(true);
    setLoadingText('Yapay zeka hikayeni yazıyor...');
    
    try {
      const charNames = selectedCharIds.map(id => CHARACTERS.find(c => c.id === id)?.name || id);
      const story = await generateStory(currentUserName, charNames);
      setCurrentStory(story);
      setAppState(AppState.READING);
    } catch (e) {
      console.error(e);
      alert("Hikaye oluşturulamadı. Lütfen tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishReading = async (audioBlob: Blob, durationSeconds: number) => {
    if (!currentStory) return;
    
    setAppState(AppState.ANALYZING); 
    setIsLoading(true);
    setLoadingText('Okuman analiz ediliyor...');

    try {
      const analysis = await analyzeReading(audioBlob);
      
      const durationMins = durationSeconds / 60;
      const wpm = durationMins > 0 ? analysis.wordCount / durationMins : 0;

      const newSession: ReadingSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        storyTitle: currentStory.title,
        wpm: wpm,
        durationSeconds,
        wordCount: analysis.wordCount,
        feedback: analysis.feedback
      };

      setUsers(prev => ({
        ...prev,
        [currentUserName]: {
          ...prev[currentUserName],
          history: [...prev[currentUserName].history, newSession]
        }
      }));

      setLastSession(newSession);
      setAppState(AppState.RESULTS);

    } catch (e) {
      console.error(e);
      alert("Analiz başarısız oldu.");
      setAppState(AppState.READING);
    } finally {
      setIsLoading(false);
    }
  };

  // --- WELCOME SCREEN (No Users) ---
  if (Object.keys(users).length === 0) {
    const leo = CHARACTERS.find(c => c.id === 'leo')?.image;
    const pamuk = CHARACTERS.find(c => c.id === 'pamuk')?.image;

    return (
        <div className="min-h-screen bg-sky-100 flex flex-col items-center justify-center p-4 text-slate-800 relative overflow-hidden">
            {/* Animated Background Characters */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none z-0 px-4 md:px-20 opacity-90">
               {/* Leo - Left */}
               <div className="animate-float">
                  <img 
                    src={leo} 
                    alt="Leo" 
                    className="w-32 md:w-56 transform -rotate-[30deg]" 
                  />
               </div>
               
               {/* Pamuk - Right */}
               <div className="animate-float-delayed">
                   <img 
                    src={pamuk} 
                    alt="Pamuk" 
                    className="w-32 md:w-56 transform rotate-[30deg]" 
                  />
               </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-6 md:p-10 rounded-[2rem] shadow-2xl max-w-lg w-full text-center space-y-6 animate-fade-in z-10 border-4 border-pink-200">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 mb-3 drop-shadow-sm tracking-tight">
                        OKUMA ARKADAŞIM
                    </h1>
                    <p className="text-pink-500 font-bold text-lg md:text-xl">
                        Kendi hikayeni, kendi arkadaşların ile yaz!
                    </p>
                </div>
                
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleCreateUser(welcomeInputName); }}
                    className="space-y-4 pt-4"
                >
                    <input 
                        type="text" 
                        value={welcomeInputName}
                        onChange={(e) => setWelcomeInputName(e.target.value)}
                        placeholder="Adın ne?"
                        className="w-full px-6 py-4 rounded-2xl border-4 border-blue-200 focus:border-blue-400 outline-none text-xl text-center bg-white text-slate-900 placeholder-slate-400 font-bold transition-colors"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        disabled={!welcomeInputName.trim()}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        BAŞLA 🚀
                    </button>
                </form>
            </div>
        </div>
    );
  }

  // --- MAIN APP ---
  const currentUser = users[currentUserName];

  return (
    <div className="min-h-screen bg-sky-100 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm py-3 px-4 z-10 sticky top-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppState(AppState.DASHBOARD)}>
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
                    OA
                </div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-indigo-900">Okuma Arkadaşım</h1>
            </div>
            {appState !== AppState.DASHBOARD && (
                <button 
                    onClick={() => setAppState(AppState.DASHBOARD)}
                    className="text-xs md:text-sm font-bold text-gray-500 hover:text-indigo-600 transition bg-gray-100 px-3 py-1 rounded-full"
                >
                    Çıkış
                </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto h-full">
            
            {/* 1. Dashboard */}
            {appState === AppState.DASHBOARD && currentUser && (
                <Dashboard
                    currentUser={currentUser}
                    allUsers={users}
                    onSelectUser={setCurrentUserName}
                    onCreateUser={handleCreateUser}
                    onDeleteUser={handleDeleteUser}
                    onStartNewReading={() => {
                        setSelectedCharIds([]);
                        setAppState(AppState.CHARACTER_SELECTION);
                    }}
                />
            )}

            {/* 2. Character Selection */}
            {appState === AppState.CHARACTER_SELECTION && (
                <div className="flex flex-col h-full animate-fade-in pb-20">
                    <div className="text-center mb-4 md:mb-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-2">Karakterlerini Seç</h2>
                        <p className="text-sm md:text-lg text-indigo-600">En fazla 3 karakter seçebilirsin.</p>
                    </div>
                    
                    <CharacterSelector 
                        selectedIds={selectedCharIds} 
                        onToggle={handleToggleCharacter} 
                    />

                    {/* Mobile-friendly fixed bottom action bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-200 flex justify-center gap-4 md:static md:bg-transparent md:border-none md:mt-8">
                        <button 
                            onClick={() => setAppState(AppState.DASHBOARD)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full transition text-sm md:text-base"
                        >
                            Geri
                        </button>
                        <button 
                            onClick={handleGenerateStory}
                            disabled={selectedCharIds.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm md:text-base"
                        >
                           {isLoading ? <Loader2 className="animate-spin" /> : <>Hikayeyi Yaz <ArrowRight className="w-4 h-4 md:w-5 md:h-5" /></>}
                        </button>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && appState !== AppState.READING && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-indigo-600 animate-spin mb-4" />
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 animate-pulse">{loadingText}</h2>
                </div>
            )}

            {/* 3. Reading & Recording */}
            {appState === AppState.READING && currentStory && (
                <ReadingRecorder 
                    story={currentStory} 
                    onFinish={handleFinishReading} 
                />
            )}

            {/* 4. Results */}
            {appState === AppState.RESULTS && lastSession && (
                <ResultsView
                    session={lastSession}
                    characters={selectedCharIds.map(id => CHARACTERS.find(c => c.id === id)?.name || id)}
                    theme={currentStory?.theme || 'General'}
                    gender={currentStory?.gender || 'Çocuk'}
                    targetWpm={currentUser.targetWpm}
                    onHome={() => setAppState(AppState.DASHBOARD)}
                />
            )}
        </div>
      </main>
    </div>
  );
}