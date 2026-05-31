import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import History from './components/History';

function AppContent() {
  const { currentUserId } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUserId) {
    return <Login />;
  }

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-main">
        {activeTab === 'dashboard' ? <Dashboard /> : <History />}
      </main>
      <footer className="app-footer">
        <p>Jadwal estafet 30 hari · Kakak & Adik</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
