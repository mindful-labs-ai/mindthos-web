import { useEffect, useRef, useState } from 'react';

import { RotateCcw } from 'lucide-react';

import { cn } from '@/lib/cn';

interface SharedSignatureSheetProps {
  open: boolean;
  onClose: () => void;
  /** "서명 확인" — 캔버스를 PNG dataURL로 넘긴다. */
  onConfirm: (dataUrl: string) => void;
}

/**
 * 서명 바텀시트 — 캔버스에 터치/마우스로 직접 서명. pointer events로 터치·마우스 통합.
 * 서명 확인 시 PNG base64(dataURL)로 내보낸다(저장은 호출자가 응답에 임베드).
 */
export function SharedSignatureSheet({
  open,
  onClose,
  onConfirm,
}: SharedSignatureSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // 열릴 때 캔버스를 표시 박스 크기(dpr 보정)로 세팅.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#3C3C3C';
    }
    setHasInk(false);
  }, [open]);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !last.current) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };

  const handleUp = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const confirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onConfirm(canvas.toDataURL('image/png'));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl bg-white pb-7 pt-5 lg:max-w-[460px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="px-6 text-sm font-bold text-grey-100">서명하기</h3>

        <div className="px-6 pt-4">
          <canvas
            ref={canvasRef}
            className="h-[194px] w-full touch-none rounded-[2px] border border-grey-40"
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerLeave={handleUp}
          />
        </div>

        <div className="mt-6 flex items-center gap-3 px-6">
          <button
            type="button"
            aria-label="다시 쓰기"
            onClick={clear}
            className="flex h-[41px] w-[41px] flex-shrink-0 items-center justify-center rounded-lg border border-grey-40 text-grey-70 transition-colors active:bg-grey-10"
          >
            <RotateCcw size={22} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            disabled={!hasInk}
            onClick={confirm}
            className={cn(
              'h-[41px] flex-1 rounded-lg text-base font-semibold transition-colors',
              hasInk
                ? 'bg-green-80 text-white'
                : 'cursor-not-allowed bg-grey-20 text-grey-70'
            )}
          >
            서명 확인
          </button>
        </div>
      </div>
    </div>
  );
}
