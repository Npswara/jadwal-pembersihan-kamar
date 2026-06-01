import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getUser } from '../utils/constants';
import { formatDateShort } from '../utils/dateUtils';

export default function PendingPhotoReview() {
  const { state, currentUserId, confirmPhoto, rejectPhoto } = useApp();
  const [loading, setLoading] = useState(false);
  const pending = state.pendingPhoto;

  if (!pending) return null;

  const sender = getUser(pending.from);
  const isSender = currentUserId === pending.from;
  const isSibling = currentUserId && pending.from !== currentUserId;
  const imageSrc = pending.imageData;

  const handleConfirm = async () => {
    setLoading(true);
    const result = await confirmPhoto();
    setLoading(false);
    alert(result.message);
  };

  const handleReject = async () => {
    if (!window.confirm('Tolak bukti foto ini? Pemegang giliran harus mengirim ulang.')) return;
    setLoading(true);
    const result = await rejectPhoto();
    setLoading(false);
    alert(result.message);
  };

  return (
    <section className="card card--photo-review">
      <h3 className="card__title">
        {isSender ? 'Bukti Foto Menunggu Konfirmasi' : `Bukti Foto dari ${sender.name}`}
      </h3>

      <p className="card__text">
        Dikirim pada {formatDateShort(pending.submittedAt)}
      </p>

      <div className="photo-review__image-wrap">
        <img src={imageSrc} alt={`Bukti kebersihan dari ${sender.name}`} />
      </div>

      {isSender && (
        <p className="message message--info">
          Bukti foto telah dikirim. Silakan menunggu {getUser(sender.siblingId).name}{' '}
          untuk mengonfirmasi kebersihan kamar.
        </p>
      )}

      {isSibling && (
        <div className="photo-review__actions">
          <p className="card__text">
            Setelah Anda mengonfirmasi, giliran pembersihan berikutnya akan menjadi tanggung jawab Anda.
            Foto akan dihapus dari database setelah konfirmasi.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--large"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses…' : 'Konfirmasi Kamar Sudah Bersih'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReject}
            disabled={loading}
          >
            Tolak — Minta Kirim Ulang
          </button>
        </div>
      )}
    </section>
  );
}
