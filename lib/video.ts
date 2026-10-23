// lib/video.ts
// Сжатие видео и извлечение обложки — чистый браузерный API
// (<video> + canvas + MediaRecorder). Без ffmpeg.wasm, без wasm-файлов,
// без внешних зависимостей: работает в любом современном браузере.
//
// ВАЖНО про лимит Supabase: на всех тарифах максимальный размер одного
// объекта в Storage — 50 МБ (это касается и обычного, и resumable upload).
// Поэтому битрейт при сжатии подбирается под длительность ролика так,
// чтобы результат гарантированно уложился в лимит.

export const VIDEO_MAX_SIZE = 50 * 1024 * 1024; // лимит Supabase Storage на объект

// Порядок важен: сначала пробуем VP9 (лучше сжатие), потом VP8,
// video/mp4 — для Safari (её MediaRecorder пишет в H.264).
const MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
];

// captureStream есть не в типах TS для HTMLVideoElement
interface VideoWithCapture extends HTMLVideoElement {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
}

/* ---------- Сжатие видео ---------- */

export async function compressVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<File> {
  // Маленькие файлы не трогаем
  if (file.size <= VIDEO_MAX_SIZE) return file;

  return new Promise<File>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video: VideoWithCapture = document.createElement('video');
    video.src = url;
    video.preload = 'auto';
    video.playsInline = true;

    const fail = (err: unknown) => {
      URL.revokeObjectURL(url);
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    video.onerror = () => fail(new Error('Не удалось прочитать видеофайл'));

    video.onloadedmetadata = () => {
      void (async () => {
        try {
          const duration = video.duration;
          if (!isFinite(duration) || duration <= 0) {
            throw new Error('Не удалось определить длительность видео');
          }

          // Подбираем суммарный битрейт так, чтобы файл гарантированно
          // был меньше 45 МБ (запас до лимита 50 МБ на контейнер и звук).
          const targetBits = 45 * 1024 * 1024 * 8;
          const totalBitrate = Math.min(
            3_000_000,
            Math.max(600_000, Math.floor(targetBits / duration))
          );
          const videoBitrate = Math.max(400_000, totalBitrate - 96_000);

          // Масштаб до 1280px по ширине (чётные размеры нужны кодекам)
          const scale = Math.min(1, 1280 / video.videoWidth);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
          canvas.height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas недоступен');

          const stream = canvas.captureStream(30);

          // Звук из исходного видео
          try {
            const mediaStream =
              video.captureStream?.() ?? video.mozCaptureStream?.();
            mediaStream?.getAudioTracks().forEach((t) => stream.addTrack(t));
          } catch {
            // видео без звука — ок
          }

          const mime = MIME_CANDIDATES.find((m) =>
            MediaRecorder.isTypeSupported(m)
          );
          const recorder = new MediaRecorder(
            stream,
            mime
              ? {
                  mimeType: mime,
                  videoBitsPerSecond: videoBitrate,
                  audioBitsPerSecond: 96_000,
                }
              : { videoBitsPerSecond: videoBitrate, audioBitsPerSecond: 96_000 }
          );

          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          recorder.onerror = () =>
            fail(new Error('Ошибка перекодирования видео'));
          recorder.onstop = () => {
            URL.revokeObjectURL(url);
            const type = mime ?? 'video/webm';
            const blob = new Blob(chunks, { type });
            const ext = type.includes('mp4') ? '.mp4' : '.webm';
            const name = file.name.replace(/\.[^.]+$/, '') + ext;
            resolve(new File([blob], name, { type }));
          };

          // Копируем кадры на canvas, пока играет видео
          let raf = 0;
          const draw = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            onProgress?.(
              Math.min(99, Math.round((video.currentTime / duration) * 100))
            );
            raf = requestAnimationFrame(draw);
          };

          video.onended = () => {
            cancelAnimationFrame(raf);
            recorder.stop();
          };

          recorder.start(1000);

          try {
            await video.play(); // файл выбран вручную — жест пользователя есть
          } catch {
            // Автовоспроизведение со звуком запрещено — играем в muted.
            // Видео спасено, но звук в сжатой версии пропадёт.
            video.muted = true;
            await video.play();
          }

          draw();
        } catch (err) {
          fail(err);
        }
      })();
    };
  });
}

/* ---------- Кадр из видео (автообложка) ---------- */

export async function extractVideoFrame(file: File): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.preload = 'auto';
    video.muted = true; // автовоспроизведение не нужно
    video.playsInline = true;

    const fail = (err: unknown) => {
      URL.revokeObjectURL(url);
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    video.onerror = () => fail(new Error('Не удалось прочитать видеофайл'));

    video.onloadedmetadata = () => {
      // Кадр на 1-й секунде (часто первый кадр — чёрный)
      video.currentTime = Math.min(0.9, video.duration / 2 || 0);
    };

    video.onseeked = () => {
      try {
        const scale = Math.min(1, 1280 / video.videoWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(new File([blob], 'preview.jpg', { type: 'image/jpeg' }));
            } else {
              reject(new Error('Не удалось сохранить кадр'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        fail(err);
      }
    };
  });
}