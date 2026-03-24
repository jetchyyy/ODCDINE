import { QRCodeSVG } from 'qrcode.react';

interface QRCodePreviewProps {
  value: string;
  title?: string;
}

export function QRCodePreview({ value, title = 'Table QR' }: QRCodePreviewProps) {
  return (
    <div className="glass-panel flex flex-col items-center gap-4 p-5 text-center">
      <QRCodeSVG id="table-qr-preview" value={value} size={168} bgColor="#ffffff" fgColor="#1f2937" includeMargin />
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 break-all text-xs leading-5 text-slate-500">{value}</p>
      </div>
    </div>
  );
}
