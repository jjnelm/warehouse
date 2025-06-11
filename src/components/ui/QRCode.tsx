import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Download } from 'lucide-react';

interface QRCodeProps {
  value: string;
  size?: number;
  title?: string;
  showDownload?: boolean;
}

export default function QRCode({ value, size = 200, title, showDownload = true }: QRCodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${title || 'download'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <QRCodeSVG
        id="qr-code-svg"
        value={value}
        size={size}
        level="H"
        includeMargin={true}
        className="bg-white p-2 rounded-lg shadow"
      />
      {showDownload && isHovered && (
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          title="Download QR Code"
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
} 