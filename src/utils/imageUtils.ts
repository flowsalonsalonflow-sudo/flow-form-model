export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.84,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File yang dipilih harus berupa gambar (JPG, PNG, atau WEBP).');
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar (maksimal 20 MB sebelum kompresi).');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Gambar gagal dibaca. Coba pilih foto lain.'));
      element.src = objectUrl;
    });

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    let targetWidth = naturalWidth;
    let targetHeight = naturalHeight;

    if (naturalWidth > maxDimension || naturalHeight > maxDimension) {
      const ratio = Math.min(maxDimension / naturalWidth, maxDimension / naturalHeight);
      targetWidth = Math.max(1, Math.round(naturalWidth * ratio));
      targetHeight = Math.max(1, Math.round(naturalHeight * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Perangkat tidak mendukung pemrosesan gambar.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function isValidIndonesianWhatsapp(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) {
    return false;
  }
  return digits.startsWith('08') || digits.startsWith('628') || digits.startsWith('8');
}

export function formatWhatsappInput(raw: string): string {
  const cleaned = raw.replace(/[^\d+\-\s]/g, '');
  return cleaned.slice(0, 19);
}

export function buildWhatsappLink(normalizedNumber: string, candidateName: string, code: string): string {
  const text = encodeURIComponent(
    `Halo ${candidateName}, kami dari Tim Kurasi Flow Salon. Terima kasih telah mendaftar sebagai kandidat model rambut (${code}). Apakah Anda bersedia kami hubungi lebih lanjut?`,
  );
  return `https://wa.me/${normalizedNumber}?text=${text}`;
}

export function formatIndonesianDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
