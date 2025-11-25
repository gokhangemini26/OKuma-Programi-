import React, { useState, useRef } from 'react';
import { StoryData } from '../types';
import { Mic, Square, Loader2 } from 'lucide-react';

interface ReadingRecorderProps {
  story: StoryData;
  onFinish: (audioBlob: Blob, durationSeconds: number) => void;
}

export const ReadingRecorder: React.FC<ReadingRecorderProps> = ({ story, onFinish }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Mikrofona erişilemedi. Lütfen izinleri kontrol et.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      
      setIsRecording(false);
      setIsProcessing(true);

      mediaRecorderRef.current.onstop = () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release mic
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        onFinish(blob, duration);
      };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 animate-fade-in">
           <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
           <h3 className="text-2xl font-bold text-gray-800">Sesin Analiz Ediliyor...</h3>
           <p className="text-gray-600 mt-2">Yapay zeka okumanı dinliyor ve hızını hesaplıyor.</p>
        </div>
     );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden relative">
      {/* Header */}
      <div className="bg-indigo-50 p-4 md:p-6 border-b border-indigo-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
           <h2 className="text-lg md:text-xl font-bold text-indigo-900 line-clamp-1">{story.title}</h2>
           <span className="text-indigo-500 text-xs md:text-sm font-medium bg-indigo-100 px-2 py-1 rounded-md">{story.theme}</span>
        </div>
        <div className={`font-mono text-lg md:text-xl font-bold ${isRecording ? 'text-red-500' : 'text-gray-400'}`}>
          {formatTime(recordingDuration)}
        </div>
      </div>

      {/* Story Text Area - Yellow/Cream Background */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 story-scroll bg-[#fff9c4] pb-32">
         <p className="text-lg md:text-2xl leading-relaxed font-medium text-gray-800 whitespace-pre-line text-justify font-sans">
            {story.content}
         </p>
      </div>

      {/* Controls - Fixed at bottom for mobile ergonomics */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-[#fff9c4]/90 backdrop-blur border-t border-yellow-200 flex justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 md:gap-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 md:py-4 px-8 md:px-10 rounded-full shadow-lg transform transition active:scale-95 w-full md:w-auto justify-center"
          >
            <Mic className="w-6 h-6 md:w-8 md:h-8" />
            <span className="text-lg md:text-xl">Okumaya Başla!</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 md:gap-3 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 md:py-4 px-8 md:px-10 rounded-full shadow-lg transform transition active:scale-95 w-full md:w-auto justify-center animate-pulse"
          >
            <Square className="w-6 h-6 md:w-8 md:h-8 fill-current" />
            <span className="text-lg md:text-xl">Bitir</span>
          </button>
        )}
      </div>
    </div>
  );
};