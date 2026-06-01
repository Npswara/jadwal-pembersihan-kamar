import { useRef, useState, useEffect } from 'react';

export default function PhotoCapture({ onCapture, onCancel, disabled, submitting = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError(
          'Kamera tidak dapat diakses. Pastikan izin kamera diaktifkan dan gunakan perangkat dengan kamera.'
        );
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleRetake = async () => {
    setPreview(null);
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch {
      setError('Gagal membuka kamera ulang.');
    }
  };

  const handleSubmit = () => {
    if (preview && !submitting) onCapture(preview);
  };

  if (disabled) return null;

  return (
    <div className="photo-capture">
      <h3 className="photo-capture__title">Bukti Foto Kamar (Real-time)</h3>
      <p className="photo-capture__desc">
        Ambil foto langsung dari kamera sebagai bukti kebersihan. Foto dari galeri tidak diizinkan.
      </p>

      {error && <p className="message message--error">{error}</p>}

      {!preview ? (
        <>
          <div className="photo-capture__viewport">
            <video ref={videoRef} playsInline muted className="photo-capture__video" />
            {!ready && !error && <p className="photo-capture__loading">Memuat kamera…</p>}
          </div>
          <canvas ref={canvasRef} className="photo-capture__canvas" />
          <div className="photo-capture__actions">
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleCapture}
              disabled={!ready}
            >
              Ambil Foto
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="photo-capture__viewport">
            <img src={preview} alt="Pratinjau bukti kebersihan" className="photo-capture__preview" />
          </div>
          <div className="photo-capture__actions">
            <button type="button" className="btn btn--secondary" onClick={handleRetake} disabled={submitting}>
              Ambil Ulang
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Mengunggah…' : 'Kirim Bukti ke Saudara'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
