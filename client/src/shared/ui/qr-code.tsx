'use client';

import QRCodeSVG, { type QRCodeProps } from 'react-qr-code';
import { cn } from '@/shared/lib/utils';

/**
 * Базовый компонент для отображения QR-кода
 */
export function QRCode({
  value,
  size = 256,
  className,
  level = 'M',
  bgColor = '#ffffff',
  fgColor = '#000000',
}: QRCodeProps) {
  return (
    <div className={cn('flex items-center justify-center rounded-lg bg-white p-4', className)}>
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        bgColor={bgColor}
        fgColor={fgColor}
        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
      />
    </div>
  );
}
