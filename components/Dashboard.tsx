import React from 'react';
import { UserProfile } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusCircle, BookOpen, Clock, Trash2 } from 'lucide-react';

interface DashboardProps {
  currentUser: UserProfile;
  allUsers: Record<string, UserProfile>;
  onSelectUser: (name: string) => void;
  onCreateUser: (name: string) => void;
  onDeleteUser: (name: string) => void;
  onStartNewReading: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  currentUser, 
  allUsers, 
  onSelectUser, 
  onCreateUser, 
  onDeleteUser,
  onStartNewReading 
}) => {
  const [newUserName, setNewUserName] = React.useState('');
  const [isAddingUser, setIsAddingUser] = React.useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onCreateUser(newUserName.trim());
      setNewUserName('');
      setIsAddingUser(false);
    }
  };

  const handleDeleteClick = () => {
    const message = `"${currentUser.name}" isimli kullanıcıyı ve tüm geçmiş kayıtlarını silmek istediğinize emin misiniz?\n\n(Bu işlem geri alınamaz)`;
    if (window.confirm(message)) {
      onDeleteUser(currentUser.name);
    }
  };

  // Prepare data for chart
  const chartData = currentUser.history.map((session, index) => ({
    name: index + 1, // Reading count
    wpm: Math.round(session.wpm),
    date: new Date(session.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    title: session.storyTitle
  }));

  const totalReadings = currentUser.history.length;
  const averageWpm = totalReadings > 0 
    ? Math.round(currentUser.history.reduce((acc, curr) => acc + curr.wpm, 0) / totalReadings) 
    : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-8">
      {/* Header / User Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 md:p-6 rounded-2xl shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-indigo-100 p-3 rounded-full shrink-0">
            <span className="text-2xl font-bold text-indigo-600">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Merhaba, {currentUser.name}!</h1>
            <p className="text-sm text-gray-500">Hadi okuma yapalım.</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="flex-1 md:flex-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={currentUser.name}
            onChange={(e) => onSelectUser(e.target.value)}
          >
            {Object.keys(allUsers).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          
          <button 
            type="button"
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-100"
            title="Yeni Kullanıcı Ekle"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button 
            type="button"
            onClick={handleDeleteClick}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-100"
            title="Kullanıcıyı Sil"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isAddingUser && (
        <form onSubmit={handleAddUser} className="bg-indigo-50 p-4 rounded-xl flex gap-2 animate-fade-in shadow-inner">
          <input
            type="text"
            placeholder="İsim giriniz..."
            className="flex-1 px-4 py-2 rounded-lg border-2 border-indigo-200 focus:border-indigo-500 outline-none bg-white text-gray-900"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            autoFocus
          />
          <button 
            type="submit" 
            className="bg-indigo-600 text-white px-4 md:px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 whitespace-nowrap"
          >
            Ekle
          </button>
        </form>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-100 p-5 md:p-6 rounded-2xl text-orange-800 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start">
          <div className="flex items-center gap-2 mb-0 md:mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold opacity-75">Toplam Okuma</span>
          </div>
          <div className="text-3xl md:text-4xl font-black">{totalReadings}</div>
        </div>
        <div className="bg-blue-100 p-5 md:p-6 rounded-2xl text-blue-800 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start">
          <div className="flex items-center gap-2 mb-0 md:mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold opacity-75">Ortalama Hız</span>
          </div>
          <div className="text-3xl md:text-4xl font-black">{averageWpm} <span className="text-lg font-medium">k/dk</span></div>
        </div>
      </div>

      {/* Chart */}
      {totalReadings > 0 ? (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm h-64 md:h-80">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Gelişim Grafiği</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickMargin={5} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 'auto']} width={30} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="wpm" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-2xl text-center text-gray-400">
          Henüz okuma verisi yok. İlk hikayeni oluşturmak için başla!
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onStartNewReading}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg md:text-xl py-4 rounded-2xl shadow-lg hover:shadow-xl transform transition active:scale-95"
      >
        Yeni Bir Hikaye Oluştur ✨
      </button>
    </div>
  );
};