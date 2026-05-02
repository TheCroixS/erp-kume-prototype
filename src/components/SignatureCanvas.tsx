import React, { useRef, useEffect, useState } from 'react';
import { Pen, Trash2, Check } from 'lucide-react';

interface Props {
  label: string;
  value?: string;
  onChange: (base64: string | undefined) => void;
}

export default function SignatureCanvas({ label, value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [showCanvas, setShowCanvas] = useState(!value);

  useEffect(() => {
    if (!showCanvas || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = '#1e3a2f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [showCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current.getContext('2d')!;
    const { x, y } = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d')!;
    const { x, y } = getPos(e, canvasRef.current);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
    onChange(undefined);
  };

  const save = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onChange(dataUrl);
    setHasSignature(true);
    setShowCanvas(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {hasSignature && !showCanvas && (
          <button onClick={() => { setShowCanvas(true); setHasSignature(false); }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <Pen className="w-3 h-3" />Volver a firmar
          </button>
        )}
      </div>

      {hasSignature && !showCanvas && value ? (
        <div className="border border-green-300 dark:border-green-700 rounded-lg p-2 bg-green-50 dark:bg-green-900/20">
          <img src={value} alt="Firma" className="h-16 object-contain" />
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><Check className="w-3 h-3" />Firma guardada</p>
        </div>
      ) : showCanvas ? (
        <div className="space-y-2">
          <canvas ref={canvasRef} width={400} height={120}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white cursor-crosshair touch-none"
            style={{ height: '120px' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
          <p className="text-xs text-gray-400 text-center">Dibuja la firma en el recuadro</p>
          <div className="flex gap-2">
            <button onClick={clear} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Limpiar
            </button>
            <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
              <Check className="w-3.5 h-3.5" />Guardar Firma
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCanvas(true)}
          className="w-full h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
          <Pen className="w-4 h-4" /><span className="text-sm">Hacer clic para firmar</span>
        </button>
      )}
    </div>
  );
}
