import { useApp } from '../context/AppContext';

export default function Header({ activeTab, onTabChange }) {
  const { currentUser, logout } = useApp();

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <h1>Jadwal Kebersihan</h1>
        <p className="app-header__user">Masuk sebagai: {currentUser?.name}</p>
      </div>

      <nav className="app-header__nav">
        <button
          type="button"
          className={`tab ${activeTab === 'dashboard' ? 'tab--active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          Dasbor
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'history' ? 'tab--active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          Riwayat & Kas
        </button>
      </nav>

      <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
        Keluar
      </button>
    </header>
  );
}
