import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let videoElement: HTMLVideoElement | null = null;
    let stream: MediaStream | null = null;

    const startScanning = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoElement = document.getElementById('qr-video') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play();
          setIsScanning(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Failed to access camera. Please ensure you have granted camera permissions.');
      }
    };

    const stopScanning = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
      setIsScanning(false);
    };

    if (isScanning) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isScanning]);

  const handleScan = (result: string) => {
    try {
      const url = new URL(result);
      const path = url.pathname;
      navigate(path);
      toast.success('QR Code scanned successfully!');
    } catch (error) {
      toast.error('Invalid QR Code format');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">QR Code Scanner</h1>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <QrCode className="w-5 h-5 mr-2" />
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {isScanning ? (
            <div className="relative">
              <video
                id="qr-video"
                className="w-full rounded-lg"
                playsInline
              />
              <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none" />
            </div>
          ) : (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                Click "Start Scanning" to begin scanning QR codes
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Scan any QR code from this application to navigate to the corresponding page.</p>
          <p className="mt-2">Make sure you have granted camera permissions to use the scanner.</p>
        </div>
      </div>
    </div>
  );
} 