import React, { useRef, useState } from 'react';
import { Check, RotateCcw, Trash2, Undo2 } from 'lucide-react';

interface SignaturePadProps {
  onCreate: (dataUrl: string, aspectRatio: number) => void;
}

interface Stroke {
  color: string;
  thickness: number;
  points: Array<{ x: number; y: number }>;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 320;

function paintStroke(context: CanvasRenderingContext2D, stroke: Stroke) {
  if (!stroke.points.length) return;
  context.beginPath();
  context.strokeStyle = stroke.color;
  context.lineWidth = stroke.thickness;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (const point of stroke.points.slice(1)) context.lineTo(point.x, point.y);
  if (stroke.points.length === 1) {
    context.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
  }
  context.stroke();
}

function paintAll(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  strokes.forEach(stroke => paintStroke(context, stroke));
}

function croppedSignature(canvas: HTMLCanvasElement) {
  const source = canvas.getContext('2d');
  if (!source) throw new Error('Signature drawing is not available in this browser.');
  const pixels = source.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width;
  let top = canvas.height;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels.data[(y * canvas.width + x) * 4 + 3] > 8) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right <= left || bottom <= top) throw new Error('Draw a signature before adding it to the document.');

  const padding = 20;
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(canvas.width - 1, right + padding);
  bottom = Math.min(canvas.height - 1, bottom + padding);
  const result = document.createElement('canvas');
  result.width = right - left + 1;
  result.height = bottom - top + 1;
  const context = result.getContext('2d');
  if (!context) throw new Error('Could not prepare the signature image.');
  context.drawImage(canvas, left, top, result.width, result.height, 0, 0, result.width, result.height);
  return { dataUrl: result.toDataURL('image/png'), aspectRatio: result.width / result.height };
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onCreate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState('#132238');
  const [thickness, setThickness] = useState(5);
  const [drawing, setDrawing] = useState(false);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke: Stroke = { color, thickness, points: [pointFromEvent(event)] };
    activeStrokeRef.current = stroke;
    setDrawing(true);
    const context = event.currentTarget.getContext('2d');
    if (context) paintStroke(context, stroke);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const stroke = activeStrokeRef.current;
    const canvas = canvasRef.current;
    if (!stroke || !canvas) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    stroke.points.push(point);
    const context = canvas.getContext('2d');
    if (context) paintStroke(context, { ...stroke, points: stroke.points.slice(-2) });
  };

  const finishStroke = () => {
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    activeStrokeRef.current = null;
    setDrawing(false);
    setStrokes(previous => {
      const next = [...previous, stroke];
      const context = canvasRef.current?.getContext('2d');
      if (context && canvasRef.current) paintAll(context, next);
      return next;
    });
  };

  const undo = () => {
    setStrokes(previous => {
      const next = previous.slice(0, -1);
      const context = canvasRef.current?.getContext('2d');
      if (context && canvasRef.current) paintAll(context, next);
      return next;
    });
  };

  const clear = () => {
    activeStrokeRef.current = null;
    setDrawing(false);
    setStrokes([]);
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context && canvas) paintAll(context, []);
  };

  const create = () => {
    try {
      if (!canvasRef.current) throw new Error('The signature pad is not ready.');
      const result = croppedSignature(canvasRef.current);
      onCreate(result.dataUrl, result.aspectRatio);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create the signature image.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          Pen color
          <input aria-label="Pen color" type="color" value={color} onChange={event => setColor(event.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          Stroke thickness
          <input aria-label="Stroke thickness" type="range" min="2" max="14" value={thickness} onChange={event => setThickness(Number(event.target.value))} />
        </label>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={undo} disabled={!strokes.length || drawing} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40">
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </button>
          <button type="button" onClick={clear} disabled={!strokes.length && !drawing} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white dark:border-slate-700">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="Draw your signature with your finger, mouse, or stylus"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onLostPointerCapture={finishStroke}
          className="block h-32 w-full touch-none cursor-crosshair sm:h-40"
        />
      </div>
      <p className="text-xs text-slate-500">Touch, mouse, or stylus input is supported. Scrolling is paused only while drawing on the canvas.</p>
      <button type="button" onClick={create} disabled={!strokes.length || drawing} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
        <Check className="h-4 w-4" /> Use this signature
      </button>
    </div>
  );
};
