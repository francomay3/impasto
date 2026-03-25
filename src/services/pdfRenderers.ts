import type { jsPDF } from 'jspdf';
import type { Color, Pigment } from '../types';
import { findMixData, type MixEntry } from './ColorMixer';

const ROW_H = 32;
const SWATCH_SIZE = 12;
const PIE_SIZE = 12;

export function drawPieDataUrl(entries: MixEntry[]): string {
  const px = 64;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  const cx = px / 2;
  const cy = px / 2;
  const r = px / 2 - 1;

  const total = entries.reduce((s, e) => s + e.parts, 0);
  let angle = -Math.PI / 2;

  for (const entry of entries) {
    const sweep = (entry.parts / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = entry.hex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    angle += sweep;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export function renderSwatches(
  doc: jsPDF,
  colors: Color[],
  startY: number,
  margin: number,
  pageW: number,
  granularity: number,
  deltaThreshold: number,
  pigments: Pigment[],
): number {
  const colW = (pageW - margin * 2) / 3;
  const textX = SWATCH_SIZE + 2 + PIE_SIZE + 3;
  const textW = colW - textX - 2;
  let y = startY;

  colors.forEach((color, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * colW;
    const cy = y + row * ROW_H;

    if (cy > 265) {
      doc.addPage();
      y = 20 - row * ROW_H;
    }

    const acy = y + Math.floor(i / 3) * ROW_H;
    const [r, g, b] = [parseInt(color.hex.slice(1, 3), 16), parseInt(color.hex.slice(3, 5), 16), parseInt(color.hex.slice(5, 7), 16)];
    doc.setFillColor(r, g, b);
    doc.rect(x, acy, SWATCH_SIZE, SWATCH_SIZE, 'F');
    doc.setDrawColor(100);
    doc.setLineWidth(0.2);
    doc.rect(x, acy, SWATCH_SIZE, SWATCH_SIZE, 'S');

    const mixData = findMixData(color.hex, granularity, deltaThreshold, pigments);
    const recipe = color.mixRecipe || mixData.map(e => `${e.parts} part${e.parts !== 1 ? 's' : ''} ${e.name}`).join(', ');

    try {
      doc.addImage(drawPieDataUrl(mixData), 'PNG', x + SWATCH_SIZE + 2, acy, PIE_SIZE, PIE_SIZE);
    } catch { /* skip */ }

    doc.setFontSize(8);
    doc.setTextColor(0);
    const displayName = color.name || color.hex.toLowerCase();
    doc.text(displayName, x + textX, acy + 5);
    let recipeY = acy + 10;
    if (color.name) {
      doc.setFontSize(6);
      doc.setTextColor(120);
      doc.text(color.hex.toLowerCase(), x + textX, acy + 9);
      doc.setFontSize(8);
      doc.setTextColor(0);
      recipeY = acy + 13;
    }
    if (recipe) doc.text(doc.splitTextToSize(recipe, textW), x + textX, recipeY);
  });

  return y + Math.ceil(colors.length / 3) * ROW_H;
}
