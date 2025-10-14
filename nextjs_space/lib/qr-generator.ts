
import QRCode from 'qrcode';

export interface QRCodeData {
  customerId: string;
  clinicId: string;
  timestamp: number;
}

/**
 * Generate QR code for customer stamp registration
 */
export async function generateCustomerQRCode(
  customerId: string,
  clinicId: string
): Promise<string> {
  const data: QRCodeData = {
    customerId,
    clinicId,
    timestamp: Date.now(),
  };

  const qrData = JSON.stringify(data);
  
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code for display screen (encodes URL)
 */
export async function generateDisplayQRCode(
  displayUrl: string
): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(displayUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate QR code data
 */
export function validateQRCodeData(data: string): QRCodeData | null {
  try {
    const parsed = JSON.parse(data) as QRCodeData;
    
    if (!parsed.customerId || !parsed.clinicId || !parsed.timestamp) {
      return null;
    }

    // Check if QR code is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > maxAge) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}
