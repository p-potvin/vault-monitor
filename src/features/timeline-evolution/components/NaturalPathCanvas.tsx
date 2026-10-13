import React, { useEffect, useRef } from 'react';
import type { MousePathPoint } from '../types';

interface NaturalPathCanvasProps {
  points: MousePathPoint[];
  width?: number;
  height?: number;
  lang: 'en' | 'qc';
}

export const NaturalPathCanvas: React.FC<NaturalPathCanvasProps> = ({
  points,
  width = 380,
  height = 180,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !points || points.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Coordinate normalization (assumes screen 1920x1080 approx, or bounding box)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const rangeX = Math.max(100, maxX - minX);
    const rangeY = Math.max(100, maxY - minY);
    const padding = 20;

    const scaleX = (width - padding * 2) / rangeX;
    const scaleY = (height - padding * 2) / rangeY;

    // Draw background subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw trajectory line
    ctx.strokeStyle = '#b8882e'; // VaultWares gold
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(184, 136, 46, 0.6)';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    points.forEach((p, idx) => {
      const px = padding + (p.x - minX) * scaleX;
      const py = padding + (p.y - minY) * scaleY;
      if (idx === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw start and end dots
    if (points.length > 0) {
      // Start (cyan/green)
      const startX = padding + (points[0].x - minX) * scaleX;
      const startY = padding + (points[0].y - minY) * scaleY;
      ctx.fillStyle = '#4e9954';
      ctx.beginPath();
      ctx.arc(startX, startY, 4, 0, Math.PI * 2);
      ctx.fill();

      // End / Click target (red/violet)
      const endX = padding + (points[points.length - 1].x - minX) * scaleX;
      const endY = padding + (points[points.length - 1].y - minY) * scaleY;
      ctx.fillStyle = '#8a62c0';
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [points, width, height]);

  return (
    <div className="relative rounded-lg bg-[var(--surface2)] border border-[var(--border)] overflow-hidden">
      <canvas ref={canvasRef} width={width} height={height} className="w-full h-auto block" />
      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[9px] font-mono text-[var(--muted)] bg-[var(--surface3)] px-2 py-0.5 rounded border border-[var(--border)]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4e9954]" />
          {lang === 'qc' ? 'Départ' : 'Start'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#8a62c0]" />
          {lang === 'qc' ? 'Cible (Clic)' : 'Click Target'}
        </span>
        <span>· {points.length} {lang === 'qc' ? 'points 2D' : 'pts'}</span>
      </div>
    </div>
  );
};
