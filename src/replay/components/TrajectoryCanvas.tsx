import React, { useRef, useEffect, useState } from 'react';
import type { ReplaySession, ViewMode } from '../types';
import type { Vector3 } from '../../game/types';

interface TrajectoryCanvasProps {
  replay: ReplaySession;
  currentIndex: number;
  viewMode: ViewMode;
  showTrajectory: boolean;
  showKeyNodes: boolean;
  onKeyNodeClick: (keyNodeId: string) => void;
}

const project3D = (
  point: Vector3,
  cameraPos: Vector3,
  cameraTarget: Vector3,
  fov: number,
  width: number,
  height: number
): { x: number; y: number; depth: number; visible: boolean } => {
  const dx = point.x - cameraPos.x;
  const dy = point.y - cameraPos.y;
  const dz = point.z - cameraPos.z;

  const fwdX = cameraTarget.x - cameraPos.x;
  const fwdY = cameraTarget.y - cameraPos.y;
  const fwdZ = cameraTarget.z - cameraPos.z;
  const fwdLen = Math.sqrt(fwdX * fwdX + fwdY * fwdY + fwdZ * fwdZ) || 1;
  const nfx = fwdX / fwdLen;
  const nfy = fwdY / fwdLen;
  const nfz = fwdZ / fwdLen;

  const depth = dx * nfx + dy * nfy + dz * nfz;

  if (depth <= 0.1) {
    return { x: 0, y: 0, depth, visible: false };
  }

  const upX = 0;
  const upY = 1;
  const upZ = 0;

  const rightX = nfy * upZ - nfz * upY;
  const rightY = nfz * upX - nfx * upZ;
  const rightZ = nfx * upY - nfy * upX;
  const rightLen = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ) || 1;
  const nrx = rightX / rightLen;
  const nry = rightY / rightLen;
  const nrz = rightZ / rightLen;

  const realUpX = nry * nfz - nrz * nfy;
  const realUpY = nrz * nfx - nrx * nfz;
  const realUpZ = nrx * nfy - nry * nfx;

  const projX = dx * nrx + dy * nry + dz * nrz;
  const projY = dx * realUpX + dy * realUpY + dz * realUpZ;

  const f = (height / 2) / Math.tan((fov * Math.PI) / 360);
  const scale = f / depth;

  const screenX = width / 2 + projX * scale;
  const screenY = height / 2 - projY * scale;

  return {
    x: screenX,
    y: screenY,
    depth,
    visible: screenX >= -100 && screenX <= width + 100 && screenY >= -100 && screenY <= height + 100,
  };
};

const calculateCamera = (
  replay: ReplaySession,
  index: number,
  viewMode: ViewMode
): { position: Vector3; target: Vector3; fov: number } => {
  const tp = replay.trajectory[index];
  if (!tp) {
    return { position: { x: 0, y: 100, z: -100 }, target: { x: 0, y: 50, z: 0 }, fov: 60 };
  }

  const pos: Vector3 = { x: tp.x, y: tp.y, z: tp.z };
  const safeIdx = (i: number) => Math.max(0, Math.min(replay.trajectory.length - 1, i));
  const next = replay.trajectory[safeIdx(index + 10)] || tp;
  const prev = replay.trajectory[safeIdx(index - 8)] || tp;

  const dir = {
    x: next.x - pos.x,
    y: next.y - pos.y,
    z: next.z - pos.z,
  };
  const dlen = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
  const nd = { x: dir.x / dlen, y: dir.y / dlen, z: dir.z / dlen };

  const bdir = {
    x: pos.x - prev.x,
    y: pos.y - prev.y,
    z: pos.z - prev.z,
  };
  const blen = Math.sqrt(bdir.x * bdir.x + bdir.y * bdir.y + bdir.z * bdir.z) || 1;
  const nb = { x: bdir.x / blen, y: bdir.y / blen, z: bdir.z / blen };

  switch (viewMode) {
    case 'follow': {
      const backDist = 55;
      return {
        position: {
          x: pos.x - nd.x * backDist,
          y: pos.y + 28,
          z: pos.z - nd.z * backDist,
        },
        target: { ...pos },
        fov: 60,
      };
    }
    case 'chase': {
      const chaseDist = 38;
      return {
        position: {
          x: pos.x - nb.x * chaseDist,
          y: pos.y + 16 - nb.y * chaseDist,
          z: pos.z - nb.z * chaseDist,
        },
        target: { ...pos },
        fov: 72,
      };
    }
    case 'top_down': {
      return {
        position: { x: pos.x, y: pos.y + 220, z: pos.z + 0.1 },
        target: { ...pos },
        fov: 52,
      };
    }
    case 'cockpit': {
      return {
        position: {
          x: pos.x - nd.x * 2,
          y: pos.y + 3,
          z: pos.z - nd.z * 2,
        },
        target: {
          x: pos.x + nd.x * 80,
          y: pos.y + nd.y * 80,
          z: pos.z + nd.z * 80,
        },
        fov: 90,
      };
    }
    case 'cinematic': {
      const phase = (index % 150) / 150;
      const angle = phase * Math.PI * 2;
      const radius = 90;
      return {
        position: {
          x: pos.x + Math.cos(angle) * radius,
          y: pos.y + 50 + Math.sin(angle * 2) * 20,
          z: pos.z + Math.sin(angle) * radius,
        },
        target: { x: pos.x, y: pos.y + 10, z: pos.z },
        fov: 55,
      };
    }
    case 'free':
    default: {
      return {
        position: { x: pos.x, y: pos.y + 30, z: pos.z - 65 },
        target: { x: pos.x, y: pos.y, z: pos.z },
        fov: 60,
      };
    }
  }
};

export const TrajectoryCanvas: React.FC<TrajectoryCanvasProps> = ({
  replay,
  currentIndex,
  viewMode,
  showTrajectory,
  showKeyNodes,
  onKeyNodeClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDims({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || replay.trajectory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.w * dpr;
    canvas.height = dims.h * dpr;
    canvas.style.width = `${dims.w}px`;
    canvas.style.height = `${dims.h}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, dims.w, dims.h);

    const bg = ctx.createLinearGradient(0, 0, 0, dims.h);
    bg.addColorStop(0, '#0c4a6e');
    bg.addColorStop(0.5, '#1e3a5f');
    bg.addColorStop(1, '#334155');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dims.w, dims.h);

    const camera = calculateCamera(replay, currentIndex, viewMode);

    const project = (p: Vector3) =>
      project3D(p, camera.position, camera.target, camera.fov, dims.w, dims.h);

    const horizonY = dims.h * 0.45;
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, dims.h);
    groundGrad.addColorStop(0, 'rgba(52, 211, 153, 0.15)');
    groundGrad.addColorStop(1, 'rgba(52, 211, 153, 0.05)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, dims.w, dims.h - horizonY);

    const drawGrid = () => {
      const step = 50;
      const size = 400;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      for (let gx = -size; gx <= size; gx += step) {
        const s = project({ x: gx, y: 0, z: -size });
        const e = project({ x: gx, y: 0, z: size });
        if (s.visible || e.visible) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();
        }
      }
      for (let gz = -size; gz <= size; gz += step) {
        const s = project({ x: -size, y: 0, z: gz });
        const e = project({ x: size, y: 0, z: gz });
        if (s.visible || e.visible) {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();
        }
      }
    };
    drawGrid();

    if (showTrajectory && replay.trajectory.length > 1) {
      const step = Math.max(1, Math.floor(replay.trajectory.length / 300));
      let prev: { x: number; y: number; depth: number; visible: boolean } | null = null;

      for (let i = 0; i < replay.trajectory.length; i += step) {
        const tp = replay.trajectory[i];
        const p = project({ x: tp.x, y: tp.y, z: tp.z });

        if (prev && prev.visible && p.visible) {
          const t = i / replay.trajectory.length;
          const isCurrent = i <= currentIndex;
          const h = Math.floor(t * 200);
          const color = isCurrent
            ? `hsl(${200 + t * 60}, 85%, ${55 + t * 15}%)`
            : `hsla(${h}, 30%, 50%, 0.25)`;

          const depthFactor = Math.max(0.3, 1 - p.depth / 400);
          ctx.strokeStyle = color;
          ctx.lineWidth = isCurrent ? 2.5 * depthFactor : 1.5 * depthFactor;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        prev = p;
      }
    }

    if (showKeyNodes && replay.keyNodes.length > 0) {
      replay.keyNodes.forEach((kn) => {
        const knTp = replay.trajectory[kn.trajectoryIndex];
        if (!knTp) return;
        const p = project({ x: knTp.x, y: knTp.y, z: knTp.z });
        if (!p.visible) return;

        const depthFactor = Math.max(0.4, 1 - p.depth / 300);
        const r = 8 * depthFactor;
        const pulse = 1 + Math.sin(Date.now() / 300 + kn.trajectoryIndex) * 0.15;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `${kn.color}22`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = kn.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = `${Math.round(10 * depthFactor)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(kn.icon, p.x, p.y);
        ctx.restore();
      });
    }

    const currentTp = replay.trajectory[currentIndex];
    if (currentTp) {
      const cp = project({ x: currentTp.x, y: currentTp.y, z: currentTp.z });
      if (cp.visible) {
        const depthFactor = Math.max(0.5, 1 - cp.depth / 250);

        const angle = Math.atan2(currentTp.vz, currentTp.vx) * (180 / Math.PI);

        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20 * depthFactor;

        ctx.translate(cp.x, cp.y);
        ctx.rotate((-angle * Math.PI) / 180);

        const kiteW = 22 * depthFactor;
        const kiteH = 16 * depthFactor;

        ctx.beginPath();
        ctx.moveTo(kiteW, 0);
        ctx.lineTo(0, -kiteH);
        ctx.lineTo(-kiteW * 0.7, 0);
        ctx.lineTo(0, kiteH);
        ctx.closePath();

        const kiteGrad = ctx.createLinearGradient(-kiteW, 0, kiteW, 0);
        kiteGrad.addColorStop(0, '#f472b6');
        kiteGrad.addColorStop(0.5, '#fbbf24');
        kiteGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = kiteGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, kiteH);
        ctx.quadraticCurveTo(6 * depthFactor, kiteH + 10 * depthFactor, 0, kiteH + 20 * depthFactor);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();

        const tailLen = 15;
        if (currentIndex > tailLen) {
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cp.x, cp.y);
          for (let ti = 1; ti <= tailLen; ti++) {
            const ttp = replay.trajectory[currentIndex - ti];
            if (!ttp) break;
            const tp = project({ x: ttp.x, y: ttp.y - 2, z: ttp.z });
            if (!tp.visible) break;
            const fade = 1 - ti / tailLen;
            ctx.globalAlpha = fade * 0.7;
            ctx.lineWidth = 2 + (1 - fade) * 1;
            ctx.lineTo(tp.x, tp.y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    const directionLabels = [
      { label: '北', angle: 0, x: 0, z: -100 },
      { label: '东', angle: 90, x: 100, z: 0 },
      { label: '南', angle: 180, x: 0, z: 100 },
      { label: '西', angle: 270, x: -100, z: 0 },
    ];

    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    directionLabels.forEach((d) => {
      const p = project({
        x: d.x + (currentTp?.x || 0),
        y: 5,
        z: d.z + (currentTp?.z || 0),
      });
      if (p.visible && p.depth > 50) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillText(d.label, p.x, p.y);
      }
    });
    ctx.restore();
  }, [replay, currentIndex, viewMode, showTrajectory, showKeyNodes, dims]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !showKeyNodes) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const camera = calculateCamera(replay, currentIndex, viewMode);
    const project = (p: Vector3) =>
      project3D(p, camera.position, camera.target, camera.fov, dims.w, dims.h);

    for (const kn of replay.keyNodes) {
      const tp = replay.trajectory[kn.trajectoryIndex];
      if (!tp) continue;
      const p = project({ x: tp.x, y: tp.y, z: tp.z });
      if (!p.visible) continue;
      const dx = mx - p.x;
      const dy = my - p.y;
      if (dx * dx + dy * dy < 400) {
        onKeyNodeClick(kn.id);
        return;
      }
    }
  };

  return (
    <div ref={containerRef} className="replay-3d-view">
      <canvas
        ref={canvasRef}
        className="trajectory-canvas"
        onClick={handleClick}
      />
    </div>
  );
};
