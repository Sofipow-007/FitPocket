import { useEffect, useRef } from "react";
import "./WaveDivider.css";

/**
 * WaveDivider
 * Separador animado tipo líquido usando Canvas + requestAnimationFrame.
 * Props:
 *   color: color de la onda (default: var(--vio))
 *   flip: boolean — invierte la onda verticalmente
 *   height: altura del canvas en px (default: 80)
 */

export default function WaveDivider({
  color = "rgba(139, 127, 245, 0.35)",
  flip = false,
  height = 80,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      offsetRef.current += 0.008;

      ctx.beginPath();

      if (flip) {
        ctx.moveTo(0, 0);
      } else {
        ctx.moveTo(0, h);
      }

      // Onda principal
      for (let x = 0; x <= w; x += 2) {
        const y =
          Math.sin((x / w) * Math.PI * 3 + offsetRef.current) * 12 +
          Math.sin((x / w) * Math.PI * 5 + offsetRef.current * 1.3) * 6 +
          (flip ? 18 : h - 18);
        ctx.lineTo(x, y);
      }

      if (flip) {
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
      } else {
        ctx.lineTo(w, 0);
        ctx.lineTo(0, 0);
      }

      ctx.closePath();

      // Gradiente de relleno
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(139, 127, 245, 0.0)");
      grad.addColorStop(0.3, color);
      grad.addColorStop(0.7, color);
      grad.addColorStop(1, "rgba(139, 127, 245, 0.0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Línea de la onda más visible
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y =
          Math.sin((x / w) * Math.PI * 3 + offsetRef.current) * 12 +
          Math.sin((x / w) * Math.PI * 5 + offsetRef.current * 1.3) * 6 +
          (flip ? 18 : h - 18);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [color, flip, height]);

  return (
    <div className="wave-divider" style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} className="wave-divider__canvas" />
    </div>
  );
}
