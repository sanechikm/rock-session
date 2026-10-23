// lib/image.ts
// Сжатие фото перед загрузкой в Storage.
// Фото с камеры по 4–7 МБ ужимаем в JPEG до 1920px по длинной стороне
// (~300–500 КБ) — для лендинга этого с запасом, а на сайте грузятся мгновенно.

export const IMAGE_MAX_SIZE = 1920;
export const IMAGE_QUALITY = 0.85;

export async function compressImage(
  file: File,
  maxSize: number = IMAGE_MAX_SIZE,
  quality: number = IMAGE_QUALITY
): Promise<File> {
  // SVG и GIF не трогаем — вектор и анимация ломаются
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  try {
    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Картинки с прозрачностью (логотипы, иконки) сохраняем в PNG,
    // чтобы альфа-канал не превращался в белый фон.
    // Фото без прозрачности жмём в лёгкий JPEG.
    let hasAlpha = false;
    try {
      const { data } = ctx.getImageData(0, 0, width, height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          hasAlpha = true;
          break;
        }
      }
    } catch {
      hasAlpha = false;
    }

    if (!hasAlpha) {
      // Белая подложка под исходную картинку — только для JPEG
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
    }
    bitmap.close();

    const mime = hasAlpha ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, quality)
    );
    if (!blob) return file;

    const ext = hasAlpha ? 'png' : 'jpg';
    const name = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    return new File([blob], name, { type: mime });
  } catch {
    // Если браузер не смог декодировать — грузим оригинал
    return file;
  }
}