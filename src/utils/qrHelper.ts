import QRCode from 'qrcode';

/**
 * Generate a QR Code data URL from text/payload.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    return '';
  }
}

/**
 * Payload format for BOM Part QR codes.
 * Format: WGBOM:{partId}:{projectCode}:{itemNo}
 */
export function formatPartQrPayload(part: { id: string; projectId?: string; itemNo?: number }): string {
  return `WGBOM:${part.id}`;
}

export function parsePartQrPayload(qrText: string): string | null {
  if (!qrText) return null;
  const trimmed = qrText.trim();
  if (trimmed.startsWith('WGBOM:')) {
    const parts = trimmed.split(':');
    return parts[1] || null;
  }
  // Fallback: raw part ID
  return trimmed;
}
