import React, { useRef, useEffect, useState } from 'react';
import { useWhiteboardStore } from '../store/whiteboardStore';
import { useSocket } from '../context/SocketContext';
import { 
  Pencil, Highlighter, Square, Circle as CircleIcon, 
  ArrowUpRight, Type, FileText, Undo2, Redo2, Trash2 
} from 'lucide-react';
import { WhiteboardElement } from '../types';

export const WhiteboardCanvas: React.FC = () => {
  const { socket } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const {
    elements,
    tool,
    color,
    size,
    setTool,
    setColor,
    setSize,
    setElements,
    addElement,
    clearCanvas,
    undo,
    redo,
    saveHistory
  } = useWhiteboardStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textVal, setTextVal] = useState('');

  const currentElementRef = useRef<WhiteboardElement | null>(null);

  // Redraw all vector elements onto canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((el) => {
      ctx.beginPath();
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'pen' || el.type === 'highlighter') {
        if (el.type === 'highlighter') {
          ctx.save();
          ctx.globalAlpha = 0.4;
        }
        if (el.points && el.points.length > 0) {
          ctx.moveTo(el.points[0][0], el.points[0][1]);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i][0], el.points[i][1]);
          }
          ctx.stroke();
        }
        if (el.type === 'highlighter') {
          ctx.restore();
        }
      } else if (el.type === 'rectangle') {
        if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      } else if (el.type === 'circle') {
        if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          const rx = el.width / 2;
          const ry = el.height / 2;
          const cx = el.x + rx;
          const cy = el.y + ry;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(rx, ry);
          ctx.arc(0, 0, 1, 0, 2 * Math.PI);
          ctx.restore();
          ctx.stroke();
        }
      } else if (el.type === 'arrow') {
        if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          const fromx = el.x;
          const fromy = el.y;
          const tox = el.x + el.width;
          const toy = el.y + el.height;
          
          // Draw arrow line
          ctx.moveTo(fromx, fromy);
          ctx.lineTo(tox, toy);
          ctx.stroke();

          // Draw arrow head
          const angle = Math.atan2(toy - fromy, tox - fromx);
          ctx.beginPath();
          ctx.moveTo(tox, toy);
          ctx.lineTo(tox - 15 * Math.cos(angle - Math.PI / 6), toy - 15 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(tox - 15 * Math.cos(angle + Math.PI / 6), toy - 15 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = el.color;
          ctx.fill();
        }
      } else if (el.type === 'text') {
        if (el.x !== undefined && el.y !== undefined && el.text) {
          ctx.font = `${el.size * 5 + 12}px Inter`;
          ctx.fillStyle = el.color;
          ctx.fillText(el.text, el.x, el.y);
        }
      } else if (el.type === 'sticky') {
        if (el.x !== undefined && el.y !== undefined && el.width !== undefined && el.height !== undefined) {
          // Draw sticky card block
          ctx.save();
          ctx.fillStyle = el.color === '#e11d48' ? '#ffe4e6' : el.color + '40'; // tint sticky backgrounds
          ctx.strokeStyle = el.color;
          ctx.fillRect(el.x, el.y, el.width, el.height);
          ctx.strokeRect(el.x, el.y, el.width, el.height);

          // Write centered text
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Inter';
          ctx.fillText(el.text || '', el.x + 8, el.y + 20, el.width - 16);
          ctx.restore();
        }
      }
    });
  };

  // Re-size canvas coordinates correctly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fixed dimension sizes inside container wrapper
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  // Connect socket sync listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('element-drawn', (incomingElements: WhiteboardElement[]) => {
      setElements(incomingElements);
    });

    socket.on('whiteboard-state', (initialState: WhiteboardElement[]) => {
      setElements(initialState);
    });

    socket.on('canvas-cleared', () => {
      setElements([]);
    });

    return () => {
      socket.off('element-drawn');
      socket.off('whiteboard-state');
      socket.off('canvas-cleared');
    };
  }, [socket, setElements]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTextInput({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    saveHistory();

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    if (tool === 'pen' || tool === 'highlighter') {
      currentElementRef.current = {
        id,
        type: tool,
        points: [[x, y]],
        color,
        size
      };
    } else {
      currentElementRef.current = {
        id,
        type: tool,
        x,
        y,
        width: 0,
        height: 0,
        color,
        size
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElementRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'highlighter') {
      const pts = currentElementRef.current.points || [];
      const updatedPts = [...pts, [x, y] as [number, number]];
      currentElementRef.current = {
        ...currentElementRef.current,
        points: updatedPts
      };
    } else {
      const startX = currentElementRef.current.x || 0;
      const startY = currentElementRef.current.y || 0;
      currentElementRef.current = {
        ...currentElementRef.current,
        width: x - startX,
        height: y - startY
      };
    }

    // Direct redraw logic on mouse movements prior to sync commit
    const updatedElements = [...elements, currentElementRef.current];
    setElements(updatedElements);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElementRef.current) return;
    setIsDrawing(false);

    const finalElements = [...elements];
    addElement(currentElementRef.current);
    
    // Broadcast coordinates
    socket?.emit('draw-element', { elements: [...finalElements, currentElementRef.current] });
    currentElementRef.current = null;
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput || !textVal.trim()) {
      setTextInput(null);
      return;
    }

    saveHistory();
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const textElement: WhiteboardElement = {
      id,
      type: tool === 'sticky' ? 'sticky' : 'text',
      x: textInput.x,
      y: textInput.y,
      width: tool === 'sticky' ? 120 : undefined,
      height: tool === 'sticky' ? 80 : undefined,
      color,
      size,
      text: textVal
    };

    addElement(textElement);
    socket?.emit('draw-element', { elements: [...elements, textElement] });

    setTextInput(null);
    setTextVal('');
  };

  const handleLocalClear = () => {
    clearCanvas();
    socket?.emit('clear-canvas');
  };

  const handleLocalUndo = () => {
    const previousState = undo();
    if (previousState !== null) {
      socket?.emit('draw-element', { elements: previousState });
    }
  };

  const handleLocalRedo = () => {
    const nextState = redo();
    if (nextState !== null) {
      socket?.emit('draw-element', { elements: nextState });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 relative shadow-sm">
      {/* Top Whiteboard toolbar panel */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 shrink-0">
        {/* Tool selectors */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'pen', icon: Pencil, label: 'Pen' },
            { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
            { id: 'rectangle', icon: Square, label: 'Rectangle' },
            { id: 'circle', icon: CircleIcon, label: 'Circle' },
            { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'sticky', icon: FileText, label: 'Sticky Note' }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = tool === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTool(item.id as any)}
                title={item.label}
                className={`p-2 rounded-lg transition-colors ${
                  isSel ? 'bg-brand-600 text-white' : 'text-slate-550 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        {/* Color picker & sizes */}
        <div className="flex items-center gap-3">
          {/* Colors */}
          <div className="flex items-center gap-1">
            {['#e11d48', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-5 w-5 rounded-full border transition-all ${
                  color === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-slate-250 scale-100 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Sizes */}
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded px-1.5 py-1 focus:outline-none"
          >
            <option value={2}>Small</option>
            <option value={4}>Medium</option>
            <option value={7}>Large</option>
          </select>
        </div>

        {/* Action controllers (undo/redo/clear) */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <button
            onClick={handleLocalUndo}
            title="Undo"
            className="p-2 rounded hover:bg-slate-200/50 text-slate-500 hover:text-slate-900"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleLocalRedo}
            title="Redo"
            className="p-2 rounded hover:bg-slate-200/50 text-slate-500 hover:text-slate-900"
          >
            <Redo2 size={16} />
          </button>
          <button
            onClick={handleLocalClear}
            title="Clear all drawings"
            className="p-2 rounded hover:bg-red-50 text-red-650 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Canvas wrapper */}
      <div className="flex-1 relative bg-slate-50 min-h-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="block h-full w-full cursor-crosshair"
        />

        {/* Text Input Dialog box overlay */}
        {textInput && (
          <form
            onSubmit={handleTextSubmit}
            className="absolute p-2 bg-white border border-slate-200 rounded-lg shadow-xl z-20"
            style={{ left: textInput.x, top: textInput.y - 10 }}
          >
            <input
              autoFocus
              type="text"
              placeholder={tool === 'sticky' ? 'Note text...' : 'Type text...'}
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
            />
            <div className="flex justify-end gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setTextInput(null)}
                className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2 py-0.5 bg-brand-600 rounded text-[10px] text-white font-bold"
              >
                Insert
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
