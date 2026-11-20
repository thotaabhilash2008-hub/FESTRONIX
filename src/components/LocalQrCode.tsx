import React, { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';

interface LocalQrCodeProps {
  value: string;
  size: number;
  alt: string;
}

/** Generates QR images on-device so pass tokens are never sent to a QR vendor. */
export const LocalQrCode: React.FC<LocalQrCodeProps> = ({ value, size, alt }) => {
  const [source, setSource] = useState('');

  useEffect(() => {
    let active = true;
    setSource('');
    if (!value.trim()) return () => { active = false; };

    void toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#07111F', light: '#FFFFFF' },
    }).then(dataUrl => {
      if (active) setSource(dataUrl);
    }).catch(() => {
      if (active) setSource('');
    });

    return () => { active = false; };
  }, [value, size]);

  return source
    ? <img src={source} alt={alt} width={size} height={size} style={{ width: size, height: size, maxWidth: '100%', display: 'block', margin: '0 auto' }} />
    : <div role="img" aria-label={`${alt} is generating`} style={{ width: size, height: size, maxWidth: '100%', background: '#FFFFFF', borderRadius: 8 }} />;
};
