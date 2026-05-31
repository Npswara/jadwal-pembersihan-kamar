import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getUser, FINE_PER_DAY } from '../utils/constants';
import { formatDateId, getDaysLate, getFineAmount, formatRupiah } from '../utils/dateUtils';
import Countdown from './Countdown';
import PhotoCapture from './PhotoCapture';
import PendingPhotoReview from './PendingPhotoReview';

export default function Dashboard() {
  const { state, currentUserId, submitPhotoProof } = useApp();
  const [showCamera, setShowCamera] = useState(false);
  const [message, setMessage] = useState('');

  const isHolder = state.currentHolder === currentUserId;
  const holder = getUser(state.currentHolder);
  const sibling = getUser(getUser(currentUserId).siblingId);
  const daysLate = state.deadline ? getDaysLate(state.deadline) : 0;
  const fine = state.deadline ? getFineAmount(state.deadline) : 0;
  const hasPending = !!state.pendingPhoto;

  const handlePhotoCapture = (imageData) => {
    const result = submitPhotoProof(imageData);
    setMessage(result.message);
    if (result.ok) setShowCamera(false);
  };

  return (
    <div className="dashboard">
      <section className="card card--status">
        {isHolder ? (
          <>
            <h2 className="card__title status__title">
              Jadwal Pembersihan Bulan Ini: {holder.name}
            </h2>
            {state.deadline ? (
              <p className="card__text">
                Batas waktu pembersihan berikutnya adalah {formatDateId(state.deadline)}.
              </p>
            ) : (
              <p className="card__text">
                Giliran pertama Anda. Mulai timer 30 hari untuk mencatat batas waktu.
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="card__title status__title">
              Jadwal Pembersihan Bulan Ini: {holder.name}
            </h2>
            {state.deadline ? (
              <p className="card__text">
                Saat ini {holder.name} sedang bertanggung jawab hingga {formatDateId(state.deadline)}.
              </p>
            ) : (
              <p className="card__text">
                Saat ini {holder.name} sedang memegang giliran awal.
              </p>
            )}
          </>
        )}
      </section>

      <Countdown deadline={state.deadline} />

      <section className={`card card--fine${daysLate > 0 ? ' card--fine-late' : ''}`}>
        <h2 className="card__title">Aturan Denda</h2>
        <p className="card__text fine-info">
          Setiap pemegang giliran diberi waktu <strong>30 hari</strong> untuk membersihkan kamar.
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
              Masa tenggang 30 hari telah terlewati ({daysLate} hari terlambat). Akumulasi denda
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
        <section className="card card--action">
          {!showCamera ? (
            <>
              <button
                type="button"
                className="btn btn--primary btn--large btn--block"
                onClick={() => setShowCamera(true)}
              >
                Saya Sudah Selesai Membersihkan Kamar
              </button>
              <p className="card__text card__text--muted card__text--center">
                Tombol ini membuka kamera untuk mengambil bukti foto real-time yang akan dikirim ke{' '}
                {sibling.name} untuk dikonfirmasi.
              </p>
            </>
          ) : (
            <PhotoCapture
              onCapture={handlePhotoCapture}
              onCancel={() => setShowCamera(false)}
              disabled={false}
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
