import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenLine } from 'lucide-react';
import { Button } from '../ui/Button';

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  isSubmitting?: boolean;
}

/**
 * Canvas-based signature pad. The drawn signature is exported as a PNG
 * data URL and stored against the document by the e-signature endpoint.
 */
export const SignaturePad: React.FC<SignaturePadProps> = ({ onSign, isSubmitting }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Match the canvas bitmap to its CSS size for crisp strokes
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };

  const onPointerUp = () => {
    isDrawingRef.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasInk(false);
    }
  };

  const submit = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onSign(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Draw your signature below</p>
      <canvas
        ref={canvasRef}
        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 touch-none cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" leftIcon={<Eraser size={16} />} onClick={clear}>
          Clear
        </Button>
        <Button
          size="sm"
          leftIcon={<PenLine size={16} />}
          onClick={submit}
          disabled={!hasInk}
          isLoading={isSubmitting}
        >
          Sign Document
        </Button>
      </div>
    </div>
  );
};
