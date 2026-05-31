import { useApp } from '../context/AppContext';
import { getUser } from '../utils/constants';
import { formatDateShort } from '../utils/dateUtils';

export default function PendingPhotoReview() {
  const { state, currentUserId, confirmPhoto, rejectPhoto } = useApp();
  const pending = state.pendingPhoto;

  if (!pending) return null;

  const sender = getUser(pending.from);
  const isSender = currentUserId === pending.from;
  const isSibling = currentUserId && pending.from !== currentUserId;

  return (
    <section className="card card--photo-review">
      <h3 className="card__title">
        {isSender ? 'Bukti Foto Menunggu Konfirmasi' : `Bukti Foto dari ${sender.name}`}
      </h3>

      <p className="card__text">
        Dikirim pada {formatDateShort(pending.submittedAt)}
      </p>

      <div className="photo-review__image-wrap">
        <img src={pending.imageData} alt={`Bukti kebersihan dari ${sender.name}`} />
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
          </p>
          <button
            type="button"
            className="btn btn--primary btn--large"
            onClick={() => {
              const result = confirmPhoto();
              alert(result.message);
            }}
          >
            Konfirmasi Kamar Sudah Bersih
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              if (window.confirm('Tolak bukti foto ini? Pemegang giliran harus mengirim ulang.')) {
                const result = rejectPhoto();
                alert(result.message);
              }
            }}
          >
            Tolak — Minta Kirim Ulang
          </button>
        </div>
      )}
    </section>
  );
}
