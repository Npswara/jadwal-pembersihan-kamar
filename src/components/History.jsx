import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/dateUtils';

export default function History() {
  const { state, currentUserId, clearHistory } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    const result = clearHistory();
    alert(result.message);
    setConfirmClear(false);
  };

  return (
    <div className="history-page">
      <section className="card card--kas">
        <h2 className="card__title">Dana Kas Kebersihan Kamar</h2>
        <p className="kas__amount">{formatRupiah(state.totalKas)}</p>
        <p className="card__text card__text--muted">
          Dana yang terkumpul dari keterlambatan jadwal akan digunakan bersama untuk keperluan
          perawatan kamar.
        </p>
      </section>

      <section className="card">
        <div className="card__header-row">
          <h2 className="card__title">Riwayat Aktivitas</h2>
          {currentUserId === 'kakak' && (
            <button
              type="button"
              className={`btn btn--danger btn--small ${confirmClear ? 'btn--confirm' : ''}`}
              onClick={handleClear}
            >
              {confirmClear ? 'Yakin Hapus Semua?' : 'Hapus Riwayat (Kakak)'}
            </button>
          )}
        </div>

        {state.history.length === 0 ? (
          <p className="card__text card__text--muted">Belum ada riwayat aktivitas.</p>
        ) : (
          <ul className="history-list">
            {state.history.map((entry) => (
              <li key={entry.id} className="history-list__item">
                <p>{entry.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
