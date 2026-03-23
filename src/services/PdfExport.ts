import { jsPDF } from 'jspdf';
import type { ProjectState, Color, Pigment } from '../types';
import { findMixData, type MixEntry } from './ColorMixer';

const ROW_H = 32;
const SWATCH_SIZE = 12;
const PIE_SIZE = 12; // mm, same as swatch

function drawPieDataUrl(entries: MixEntry[]): string {
  const px = 64; // canvas pixels
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

  // Outer border
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function renderSwatches(
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
  // text area starts after swatch + gap + pie + gap
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

    // Color swatch
    const [r, g, b] = [
      parseInt(color.hex.slice(1, 3), 16),
      parseInt(color.hex.slice(3, 5), 16),
      parseInt(color.hex.slice(5, 7), 16),
    ];
    doc.setFillColor(r, g, b);
    doc.rect(x, acy, SWATCH_SIZE, SWATCH_SIZE, 'F');
    doc.setDrawColor(100);
    doc.setLineWidth(0.2);
    doc.rect(x, acy, SWATCH_SIZE, SWATCH_SIZE, 'S');

    // Mix data
    const mixData = findMixData(color.hex, granularity, deltaThreshold, pigments);
    const recipe = color.mixRecipe || mixData.map(e => `${e.parts} part${e.parts !== 1 ? 's' : ''} ${e.name}`).join(', ');

    // Pie chart
    try {
      const pieUrl = drawPieDataUrl(mixData);
      doc.addImage(pieUrl, 'PNG', x + SWATCH_SIZE + 2, acy, PIE_SIZE, PIE_SIZE);
    } catch { /* skip */ }

    // Name / hex + recipe text
    doc.setFontSize(8);
    doc.setTextColor(0);
    const displayName = color.name || color.hex.toUpperCase();
    doc.text(displayName, x + textX, acy + 5);
    let recipeY = acy + 10;
    if (color.name) {
      doc.setFontSize(6);
      doc.setTextColor(120);
      doc.text(color.hex.toUpperCase(), x + textX, acy + 9);
      doc.setFontSize(8);
      doc.setTextColor(0);
      recipeY = acy + 13;
    }
    if (recipe) {
      const lines = doc.splitTextToSize(recipe, textW);
      doc.text(lines, x + textX, recipeY);
    }
  });

  const rowCount = Math.ceil(colors.length / 3);
  return y + rowCount * ROW_H;
}

export function exportPdf(
  state: ProjectState,
  filteredCanvas: HTMLCanvasElement,
  indexedCanvas: HTMLCanvasElement,
  granularity: number,
  deltaThreshold: number,
  pigments: Pigment[],
  title: string = state.name,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 10;

  // Title
  doc.setFontSize(18);
  doc.text(title, margin, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 27);
  doc.setTextColor(0);

  // Side-by-side images
  const imgW = (pageW - margin * 3) / 2;
  const imgH = (imgW / filteredCanvas.width) * filteredCanvas.height;

  try {
    const filteredDataUrl = filteredCanvas.toDataURL('image/jpeg', 0.8);
    doc.addImage(filteredDataUrl, 'JPEG', margin, 35, imgW, imgH);
    doc.setFontSize(8);
    doc.text('Filtered Original', margin, 35 + imgH + 4);
  } catch { /* skip if tainted */ }

  try {
    const indexedDataUrl = indexedCanvas.toDataURL('image/jpeg', 0.8);
    doc.addImage(indexedDataUrl, 'JPEG', margin * 2 + imgW, 35, imgW, imgH);
    doc.setFontSize(8);
    doc.text('Indexed Result', margin * 2 + imgW, 35 + imgH + 4);
  } catch { /* skip if tainted */ }

  let y = 35 + imgH + 15;
  doc.setFontSize(12);
  doc.text('Color Palette', margin, y);
  y += 6;

  const groups = state.groups ?? [];

  if (groups.length === 0) {
    renderSwatches(doc, state.palette, y, margin, pageW, granularity, deltaThreshold, pigments);
  } else {
    for (const group of groups) {
      const groupColors = state.palette.filter(c => c.groupId === group.id);
      if (groupColors.length === 0) continue;

      if (y > 260) { doc.addPage(); y = 20; }

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(group.name, margin, y);
      doc.setDrawColor(80);
      doc.line(margin + doc.getTextWidth(group.name) + 2, y - 0.5, pageW - margin, y - 0.5);
      doc.setTextColor(0);
      y += 5;

      y = renderSwatches(doc, groupColors, y, margin, pageW, granularity, deltaThreshold, pigments);
      y += 6;
    }

    const ungrouped = state.palette.filter(c => !c.groupId || !groups.find(g => g.id === c.groupId));
    if (ungrouped.length > 0) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text('Ungrouped', margin, y);
      doc.setDrawColor(80);
      doc.line(margin + doc.getTextWidth('Ungrouped') + 2, y - 0.5, pageW - margin, y - 0.5);
      doc.setTextColor(0);
      y += 5;
      renderSwatches(doc, ungrouped, y, margin, pageW, granularity, deltaThreshold, pigments);
    }
  }

  doc.save(`${title.replace(/\s+/g, '_')}_palette.pdf`);
}
