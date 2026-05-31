import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USERS } from '../utils/constants';

export default function Login() {
  const { login } = useApp();
  const [selectedUser, setSelectedUser] = useState('kakak');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(selectedUser, password);
    setLoading(false);
    if (!result.ok) setError(result.message);
    else setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1>Jadwal Pembersihan Kamar Bersama</h1>
          <p>Sistem estafet kebersihan kamar untuk Kakak dan Adik</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <fieldset className="user-select">
            <legend>Masuk sebagai</legend>
            <div className="user-select__options">
              {Object.values(USERS).map((user) => (
                <label key={user.id} className={`user-select__option ${selectedUser === user.id ? 'user-select__option--active' : ''}`}>
                  <input
                    type="radio"
                    name="user"
                    value={user.id}
                    checked={selectedUser === user.id}
                    onChange={() => setSelectedUser(user.id)}
                  />
                  <span className="user-select__name">{user.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="form-field">
            <span>Kata Sandi</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className="message message--error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="auth-card__hint">
          {selectedUser === 'kakak'
            ? 'Akun Kakak memiliki hak mengelola riwayat log.'
            : 'Akun Adik untuk penggunaan sehari-hari.'}
        </p>
      </div>
    </div>
  );
}
