import React, { useState } from 'react';
import { generateRewardImage } from '../services/geminiService';
import { ReadingSession } from '../types';
import { Download, Loader2, Star } from 'lucide-react';

interface ResultsViewProps {
  session: ReadingSession;
  characters: string[];
  theme: string;
  gender: string;
  targetWpm: number;
  onHome: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ session, characters, theme, gender, targetWpm, onHome }) => {
  const [rewardImage, setRewardImage] = useState<string | null>(null);
  const [isLoadingReward, setIsLoadingReward] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuccess = session.wpm >= targetWpm;

  const handleGenerateReward = async () => {
    setIsLoadingReward(true);
    setError(null);
    try {
      const imageBase64 = await generateRewardImage(characters, theme, gender);
      setRewardImage(imageBase64);
    } catch (e) {
      setError("Resim oluşturulurken bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setIsLoadingReward(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl text-center animate-fade-in">
      <div className="mb-6 md:mb-8">
        {isSuccess ? (
          <div className="inline-block p-3 md:p-4 bg-green-100 rounded-full mb-4">
             <Star className="w-12 h-12 md:w-16 md:h-16 text-green-500 fill-green-500 animate-bounce" />
          </div>
        ) : (
           <div className="inline-block p-3 md:p-4 bg-orange-100 rounded-full mb-4">
             <Star className="w-12 h-12 md:w-16 md:h-16 text-orange-400" />
           </div>
        )}
        
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800">
          {isSuccess ? "Harika İş Çıkardın!" : "Güzel Deneme!"}
        </h2>
        <p className="text-gray-600 mb-6 text-sm md:text-base">{session.feedback}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <div className="text-indigo-600 text-xs md:text-sm font-bold uppercase">Okuma Hızı</div>
            <div className="text-2xl md:text-4xl font-black text-indigo-900">{Math.round(session.wpm)} <span className="text-sm md:text-lg font-normal text-indigo-600">k/dk</span></div>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl">
            <div className="text-purple-600 text-xs md:text-sm font-bold uppercase">Hedef</div>
            <div className="text-2xl md:text-4xl font-black text-purple-900">{targetWpm} <span className="text-sm md:text-lg font-normal text-purple-600">k/dk</span></div>
          </div>
        </div>
      </div>

      {isSuccess && !rewardImage && (
        <div className="mb-8 p-4 md:p-6 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl border-2 border-pink-200">
          <p className="text-base md:text-lg font-bold text-purple-800 mb-4">
             Hedefine ulaştın! Ödül olarak karakterlerinle ve seninle bir boyama sayfası oluşturabilirsin.
          </p>
          <button
            onClick={handleGenerateReward}
            disabled={isLoadingReward}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center mx-auto"
          >
            {isLoadingReward ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Boyama Sayfası Hazırlanıyor...
              </>
            ) : (
              "🎁 Ödülünü Al"
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold">
          {error}
        </div>
      )}

      {rewardImage && (
        <div className="mb-8 animate-fade-in">
          <h3 className="text-xl font-bold text-gray-800 mb-4">İşte Ödülün! 🎨</h3>
          <div className="relative group max-w-sm mx-auto">
            <img src={rewardImage} alt="Reward coloring page" className="w-full rounded-xl border-4 border-gray-200 shadow-lg" />
            <a 
              href={rewardImage} 
              download={`boyama-sayfasi-${Date.now()}.png`}
              className="absolute bottom-4 right-4 bg-white text-indigo-600 p-2 rounded-full shadow-lg hover:bg-indigo-50 transition"
              title="Resmi İndir"
            >
              <Download className="w-6 h-6" />
            </a>
          </div>
        </div>
      )}

      <button
        onClick={onHome}
        className="w-full md:w-auto text-gray-500 hover:text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition"
      >
        Ana Ekrana Dön
      </button>
    </div>
  );
};