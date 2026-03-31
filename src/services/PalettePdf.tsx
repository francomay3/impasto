import { Document, Page, View, Text, Image, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer';
import type { Color, ColorGroup, Pigment } from '../types';
import { findMixData, mixedResultHex, type MixEntry } from './ColorMixer';

export type PalettePdfProps = {
  title: string;
  date: string;
  palette: Color[];
  groups: ColorGroup[];
  filteredImageUrl: string;
  indexedImageUrl: string;
  minPaintPercent: number;
  deltaThreshold: number;
  pigments: Pigment[];
};

const s = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8 },
  title: { fontSize: 18, marginBottom: 3 },
  date: { fontSize: 9, color: '#888', marginBottom: 14 },
  images: { flexDirection: 'row', marginBottom: 14 },
  imgBlock: { flex: 1, marginRight: 8 },
  imgBlockLast: { flex: 1 },
  imgLabel: { fontSize: 7, color: '#888', marginTop: 3 },
  sectionTitle: { fontSize: 11, marginBottom: 8 },
  group: { marginBottom: 10 },
  groupLabel: {
    fontSize: 9,
    color: '#555',
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#bbb',
    marginBottom: 6,
  },
  row: { flexDirection: 'row', breakInside: 'avoid', marginBottom: 14 },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', paddingRight: 10 },
  swatch: { width: 28, height: 28, borderRadius: 2, flexShrink: 0 },
  pie: { flexShrink: 0, marginLeft: 6, marginRight: 6 },
  info: { flex: 1, marginLeft: 6 },
  colorName: { fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 1 },
  hex: { fontSize: 6, color: '#888', marginBottom: 1 },
  recipeLine: { fontSize: 6, color: '#444' },
  swatchLabel: { fontSize: 5, color: '#999', marginTop: 2, textAlign: 'center' },
  swatchCol: { flexDirection: 'column', alignItems: 'center', marginRight: 4, flexShrink: 0 },
});

function arcPath(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`;
}

function Pie({ entries }: { entries: MixEntry[] }) {
  const total = entries.reduce((sum, e) => sum + e.parts, 0);
  const cx = 18, cy = 18, r = 16;
  let angle = -Math.PI / 2;
  return (
    <Svg width={36} height={36} style={s.pie}>
      {entries.map((e, i) => {
        const sweep = (e.parts / total) * Math.PI * 2;
        const d = entries.length === 1
          ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`
          : arcPath(cx, cy, r, angle, angle + sweep);
        angle += sweep;
        return <Path key={i} d={d} fill={e.hex} />;
      })}
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#ccc" strokeWidth={1} />
    </Svg>
  );
}

function SwatchCell({ color, minPaintPercent, deltaThreshold, pigments }: {
  color: Color; minPaintPercent: number; deltaThreshold: number; pigments: Pigment[];
}) {
  const mix = findMixData(color.hex, minPaintPercent, deltaThreshold, pigments);
  const total = mix.reduce((s, e) => s + e.parts, 0);
  const lines = mix.map((e) => `${Math.round((e.parts / total) * 100)}% ${e.name}`);
  const resultHex = mixedResultHex(mix);
  return (
    <View style={s.cell}>
      <View style={s.swatchCol}>
        <View style={[s.swatch, { backgroundColor: color.hex, marginRight: 0 }]} />
        <Text style={s.swatchLabel}>target</Text>
      </View>
      <Pie entries={mix} />
      <View style={s.swatchCol}>
        <View style={[s.swatch, { backgroundColor: resultHex, marginRight: 0 }]} />
        <Text style={s.swatchLabel}>mix</Text>
      </View>
      <View style={s.info}>
        <Text style={s.colorName}>{color.name || color.hex.toLowerCase()}</Text>
        {color.name && <Text style={s.hex}>{color.hex.toLowerCase()}</Text>}
        {lines.map((l, i) => <Text key={i} style={s.recipeLine}>{l}</Text>)}
      </View>
    </View>
  );
}

function SwatchGrid({ colors, minPaintPercent, deltaThreshold, pigments }: {
  colors: Color[]; minPaintPercent: number; deltaThreshold: number; pigments: Pigment[];
}) {
  const rows: Color[][] = [];
  for (let i = 0; i < colors.length; i += 2) rows.push(colors.slice(i, i + 2));
  return (
    <View>
      {rows.map((pair, i) => (
        <View key={i} style={s.row} wrap={false}>
          {pair.map((c) => (
            <SwatchCell key={c.id} color={c} minPaintPercent={minPaintPercent} deltaThreshold={deltaThreshold} pigments={pigments} />
          ))}
          {pair.length === 1 && <View style={s.cell} />}
        </View>
      ))}
    </View>
  );
}

export function PalettePdf({ title, date, palette, groups, filteredImageUrl, indexedImageUrl, minPaintPercent, deltaThreshold, pigments }: PalettePdfProps) {
  const defined = groups.filter((g) => palette.some((c) => c.groupId === g.id));
  const ungrouped = palette.filter((c) => !c.groupId || !groups.find((g) => g.id === c.groupId));
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.date}>{date}</Text>
        <View style={s.images}>
          <View style={s.imgBlock}>
            <Image src={filteredImageUrl} />
            <Text style={s.imgLabel}>Filtered Original</Text>
          </View>
          <View style={s.imgBlockLast}>
            <Image src={indexedImageUrl} />
            <Text style={s.imgLabel}>Indexed Result</Text>
          </View>
        </View>
        <Text style={s.sectionTitle}>Color Palette</Text>
        {defined.map((g) => (
          <View key={g.id} style={s.group}>
            <Text style={s.groupLabel}>{g.name}</Text>
            <SwatchGrid colors={palette.filter((c) => c.groupId === g.id)} minPaintPercent={minPaintPercent} deltaThreshold={deltaThreshold} pigments={pigments} />
          </View>
        ))}
        {ungrouped.length > 0 && (
          <View style={s.group}>
            {defined.length > 0 && <Text style={s.groupLabel}>Ungrouped</Text>}
            <SwatchGrid colors={ungrouped} minPaintPercent={minPaintPercent} deltaThreshold={deltaThreshold} pigments={pigments} />
          </View>
        )}
      </Page>
    </Document>
  );
}
