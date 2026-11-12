// Canvas drawing for Fish Range. Reads the game state and paints it. No game rules here.
import { CHEST_Y, GameState, H, LANES, Target, W } from "./gameEngine";

function drawBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1e293b");
  bg.addColorStop(1, "#0f172a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // carnival awning along the top
  const stripe = 60;
  for (let i = 0; i * stripe < W; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#dc2626" : "#fef3c7";
    ctx.beginPath();
    ctx.moveTo(i * stripe, 0);
    ctx.lineTo((i + 1) * stripe, 0);
    ctx.lineTo((i + 1) * stripe, 34);
    ctx.lineTo(i * stripe + stripe / 2, 50);
    ctx.lineTo(i * stripe, 34);
    ctx.closePath();
    ctx.fill();
  }

  // chest rail
  ctx.fillStyle = "#854d0e";
  ctx.fillRect(0, CHEST_Y + 36, W, 5);

  // wooden target shelves
  for (const y of LANES) {
    ctx.fillStyle = "#7c4a1e";
    ctx.fillRect(0, y + 42, W, 12);
    ctx.fillStyle = "#a16207";
    ctx.fillRect(0, y + 42, W, 3);
  }

  // front counter
  ctx.fillStyle = "#5b3a1a";
  ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = "#7c4a1e";
  ctx.fillRect(0, H - 36, W, 6);
}

function drawTarget(ctx: CanvasRenderingContext2D, t: Target) {
  ctx.save();
  ctx.translate(t.x, t.y);
  if (t.hitT !== null) {
    // hit animation: spin, fall and fade
    ctx.globalAlpha = Math.max(0, 1 - t.hitT / 0.5);
    ctx.translate(0, t.hitT * 260);
    ctx.rotate(t.hitT * 10 * (t.vx >= 0 ? 1 : -1));
  }
  const r = t.r;

  if (t.kind === "can") {
    const w = r * 1.5, h = r * 2;
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, "#9ca3af");
    grad.addColorStop(0.5, "#f3f4f6");
    grad.addColorStop(1, "#6b7280");
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-w / 2, -h / 6, w, h / 3);
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w / 2, h / 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  } else if (t.kind === "bull") {
    const colors = ["#dc2626", "#ffffff", "#dc2626", "#ffffff", "#dc2626"];
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(0, 0, r * (1 - i * 0.2), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (t.kind === "decoy") {
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = "#a16207";
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(7, -r - 11);
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(7, -r - 11, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.font = `bold ${Math.round(r)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", 0, 2);
  } else {
    // chest (power-up)
    const pulse = 0.5 + 0.5 * Math.sin(t.phase * 2);
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 10 + 14 * pulse;
    ctx.fillStyle = "#92400e";
    ctx.fillRect(-28, -20, 56, 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#b45309";
    ctx.fillRect(-28, -20, 56, 16);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(-28, -6, 56, 4);
    ctx.fillRect(-5, -8, 10, 14);
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 2;
    ctx.strokeRect(-28, -20, 56, 40);
  }
  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, g: GameState, mouse: { x: number; y: number }) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (g.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 14 * g.shake, (Math.random() - 0.5) * 14 * g.shake);
  }
  drawBackground(ctx);
  for (const t of g.targets) drawTarget(ctx, t);

  for (const r of g.rings) {
    ctx.globalAlpha = Math.max(0, r.life);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 8 + (1 - r.life) * 26, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of g.floats) {
    ctx.globalAlpha = Math.min(1, f.life * 1.5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  // power-up screen tints
  if (g.powers.slow > 0) { ctx.fillStyle = "rgba(56,189,248,0.10)"; ctx.fillRect(0, 0, W, H); }
  if (g.powers.freeze > 0) { ctx.fillStyle = "rgba(165,243,252,0.08)"; ctx.fillRect(0, 0, W, H); }
  if (g.powers.double > 0) { ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, H - 6); }
  ctx.restore();

  // soft vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.65);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // banner (top centre)
  if (g.bannerT > 0 && g.banner) {
    ctx.globalAlpha = Math.min(1, g.bannerT * 2);
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(g.banner).width + 50;
    ctx.fillStyle = "rgba(2,6,23,0.8)";
    ctx.fillRect(W / 2 - tw / 2, 62, tw, 50);
    ctx.fillStyle = "#fde68a";
    ctx.fillText(g.banner, W / 2, 88);
    ctx.globalAlpha = 1;
  }

  // crosshair
  if (g.phase === "playing" || g.phase === "countdown") {
    const wide = g.powers.wide > 0;
    const rad = wide ? 30 : 16;
    ctx.strokeStyle = wide ? "#fbbf24" : "#22d3ee";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, rad, 0, Math.PI * 2);
    ctx.moveTo(mouse.x - rad - 8, mouse.y);
    ctx.lineTo(mouse.x - 4, mouse.y);
    ctx.moveTo(mouse.x + 4, mouse.y);
    ctx.lineTo(mouse.x + rad + 8, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - rad - 8);
    ctx.lineTo(mouse.x, mouse.y - 4);
    ctx.moveTo(mouse.x, mouse.y + 4);
    ctx.lineTo(mouse.x, mouse.y + rad + 8);
    ctx.stroke();
  }
}