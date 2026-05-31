import { CYCLE_DAYS } from '../utils/constants';
import { getCountdown } from '../utils/dateUtils';

export default function Countdown({ deadline, cycleStartedAt }) {
  const { days, hours, minutes, expired, noDeadline, waiting } = getCountdown(
    deadline,
    cycleStartedAt
  );

  if (noDeadline) {
    return (
      <div className="countdown countdown--idle">
        <p className="countdown__label">Timer belum dimulai</p>
        <p className="countdown__hint">
          Timer {CYCLE_DAYS} hari dimulai tanggal 1 bulan berikutnya setelah saudara mengonfirmasi bukti
          foto pembersihan.
        </p>
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="countdown countdown--idle">
        <p className="countdown__label">Menunggu awal periode giliran</p>
        <p className="countdown__hint">
          Timer {CYCLE_DAYS} hari dimulai tanggal 1 bulan berikutnya. Sisa waktu menuju awal periode:
        </p>
        <div className="countdown__grid">
          <div className="countdown__unit">
            <span className="countdown__value">{days}</span>
            <span className="countdown__name">Hari</span>
          </div>
          <div className="countdown__unit">
            <span className="countdown__value">{hours}</span>
            <span className="countdown__name">Jam</span>
          </div>
          <div className="countdown__unit">
            <span className="countdown__value">{minutes}</span>
            <span className="countdown__name">Menit</span>
          </div>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="countdown countdown--expired">
        <p className="countdown__label">Batas waktu telah terlewati</p>
        <div className="countdown__grid">
          <div className="countdown__unit">
            <span className="countdown__value">0</span>
            <span className="countdown__name">Hari</span>
          </div>
          <div className="countdown__unit">
            <span className="countdown__value">0</span>
            <span className="countdown__name">Jam</span>
          </div>
          <div className="countdown__unit">
            <span className="countdown__value">0</span>
            <span className="countdown__name">Menit</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown">
      <p className="countdown__label">Sisa waktu menuju jatuh tempo</p>
      <div className="countdown__grid">
        <div className="countdown__unit">
          <span className="countdown__value">{days}</span>
          <span className="countdown__name">Hari</span>
        </div>
        <div className="countdown__unit">
          <span className="countdown__value">{hours}</span>
          <span className="countdown__name">Jam</span>
        </div>
        <div className="countdown__unit">
          <span className="countdown__value">{minutes}</span>
          <span className="countdown__name">Menit</span>
        </div>
      </div>
    </div>
  );
}
