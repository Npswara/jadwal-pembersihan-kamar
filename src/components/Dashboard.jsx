import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getUser,
  FINE_PER_DAY,
  CYCLE_DAYS,
  ADIK_CYCLE_DAYS,
  CLEANING_TASKS,
  getCycleDaysForUser,
} from '../utils/constants';
import { formatDateId, getDaysLate, getFineAmount, formatRupiah, isBeforeCycleStart } from '../utils/dateUtils';
import Countdown from './Countdown';
import CleaningChecklist from './CleaningChecklist';
import PhotoCapture from './PhotoCapture';
import PendingPhotoReview from './PendingPhotoReview';

export default function Dashboard() {
  const { state, currentUserId, submitPhotoProof, syncing, syncError } = useApp();
  const [showCamera, setShowCamera] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState({});

  const isHolder = state.currentHolder === currentUserId;
  const holder = getUser(state.currentHolder);
  const holderCycleDays = getCycleDaysForUser(state.currentHolder);
  const sibling = getUser(getUser(currentUserId).siblingId);
  const daysLate = state.deadline ? getDaysLate(state.deadline) : 0;
  const fine = state.deadline ? getFineAmount(state.deadline) : 0;
  const waitingForCycle = state.cycleStartedAt && isBeforeCycleStart(state.cycleStartedAt);
  const hasPending = !!state.pendingPhoto;
  const allTasksDone = CLEANING_TASKS.every((_, i) => checkedTasks[i]);

  useEffect(() => {
    setCheckedTasks({});
  }, [state.currentHolder]);

  const toggleTask = (index) => {
    setCheckedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const deadlineText = state.deadline
    ? waitingForCycle
      ? `Timer dimulai ${formatDateId(state.cycleStartedAt)}. Batas waktu pembersihan: ${formatDateId(state.deadline)}.`
      : `Batas waktu pembersihan berikutnya adalah ${formatDateId(state.deadline)}.`
    : null;

  const handlePhotoCapture = async (imageData) => {
    setUploading(true);
    setMessage('');
    const result = await submitPhotoProof(imageData);
    setUploading(false);
    setMessage(result.message);
    if (result.ok) setShowCamera(false);
  };

  if (syncing) {
    return <p className="message message--info">Memuat data dari Firebase…</p>;
  }

  if (syncError) {
    return <p className="message message--error">{syncError}</p>;
  }

  return (
    <div className="dashboard">
      <section className="card card--status">
        {isHolder ? (
          <>
            <h2 className="card__title status__title">
              Jadwal Pembersihan Bulan Ini: {holder.name}
            </h2>
            {deadlineText ? (
              <p className="card__text">{deadlineText}</p>
            ) : (
              <p className="card__text">
                Giliran pertama Anda. Timer {holderCycleDays} hari dimulai tanggal 1 bulan berikutnya
                setelah konfirmasi pembersihan.
                {state.currentHolder === 'adik' &&
                  ` (Adik: ${ADIK_CYCLE_DAYS} hari.)`}
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="card__title status__title">
              Jadwal Pembersihan Bulan Ini: {holder.name}
            </h2>
            {deadlineText ? (
              <p className="card__text">
                {waitingForCycle
                  ? `${holder.name} menunggu awal periode. ${deadlineText}`
                  : `Saat ini ${holder.name} sedang bertanggung jawab hingga ${formatDateId(state.deadline)}.`}
              </p>
            ) : (
              <p className="card__text">
                Saat ini {holder.name} sedang memegang giliran awal.
              </p>
            )}
          </>
        )}
      </section>

      <Countdown deadline={state.deadline} cycleStartedAt={state.cycleStartedAt} />

      <section className={`card card--fine${daysLate > 0 ? ' card--fine-late' : ''}`}>
        <h2 className="card__title">Aturan Denda</h2>
        <p className="card__text fine-info">
          Setelah pembersihan dikonfirmasi, timer dimulai tanggal <strong>1 bulan berikutnya</strong>.
          Kakak diberi waktu <strong>{CYCLE_DAYS} hari</strong>, Adik diberi waktu{' '}
          <strong>{ADIK_CYCLE_DAYS} hari</strong> sejak tanggal tersebut.
          Jika batas waktu terlewati, denda sebesar <strong>{formatRupiah(FINE_PER_DAY)}</strong> per
          hari keterlambatan akan dihitung otomatis dan masuk ke dana kas kebersihan bersama.
        </p>

        {daysLate === 0 ? (
          <>
            <p className="fine-text fine-text--ok">
              {isHolder
                ? 'Status saat ini: tepat waktu. Terima kasih telah menjaga kebersihan kamar bersama.'
                : `Status saat ini: ${holder.name} masih dalam batas waktu jadwal kebersihan.`}
            </p>
            <p className="fine-reminder">
              Tolong inisiatifnya ya — bersihkan kamar sebelum jatuh tempo agar tidak kena denda!
            </p>
          </>
        ) : (
          <>
            <p className="fine-text fine-text--late">
              Masa tenggang {holderCycleDays} hari telah terlewati ({daysLate} hari terlambat). Akumulasi denda
              saat ini: <strong>{formatRupiah(fine)}</strong>.
              {!isHolder && ` (Tanggung jawab ${holder.name})`}
            </p>
            <p className="fine-reminder">
              Tolong inisiatifnya ya — segera bersihkan kamar dan kirim bukti foto agar denda tidak
              terus bertambah!
            </p>
          </>
        )}
      </section>

      <PendingPhotoReview />

      {isHolder && !hasPending && (
        <section className="card card--checklist">
          <CleaningChecklist checked={checkedTasks} onToggle={toggleTask} />
        </section>
      )}

      {isHolder && !hasPending && (
        <section className="card card--action">
          {!showCamera ? (
            <>
              <button
                type="button"
                className="btn btn--primary btn--large btn--block"
                onClick={() => setShowCamera(true)}
                disabled={!allTasksDone}
              >
                Saya Sudah Selesai Membersihkan Kamar
              </button>
              {!allTasksDone && (
                <p className="card__text card__text--muted card__text--center">
                  Selesaikan semua checklist pembersihan terlebih dahulu.
                </p>
              )}
              {allTasksDone && (
                <p className="card__text card__text--muted card__text--center">
                  Tombol ini membuka kamera untuk mengambil bukti foto real-time yang akan dikirim ke{' '}
                  {sibling.name} untuk dikonfirmasi.
                </p>
              )}
            </>
          ) : (
            <PhotoCapture
              onCapture={handlePhotoCapture}
              onCancel={() => setShowCamera(false)}
              disabled={false}
              submitting={uploading}
            />
          )}
        </section>
      )}

      {!isHolder && (
        <section className="card card--disabled">
          <button type="button" className="btn btn--primary btn--large btn--block" disabled>
            Saya Sudah Selesai Membersihkan Kamar
          </button>
          <p className="card__text card__text--muted card__text--center">
            Akses tombol pembersihan dinonaktifkan sementara karena bukan giliran Anda.
          </p>
        </section>
      )}

      {isHolder && hasPending && !showCamera && (
        <section className="card card--disabled">
          <button type="button" className="btn btn--primary btn--large btn--block" disabled>
            Saya Sudah Selesai Membersihkan Kamar
          </button>
          <p className="card__text card__text--muted card__text--center">
            Menunggu konfirmasi bukti foto dari {sibling.name}.
          </p>
        </section>
      )}

      {message && <p className="message message--info">{message}</p>}
    </div>
  );
}
