'use client';

import { useEffect, useRef } from 'react';
import { ST, VIA, LORDER, COL, SEQ, LABEL, LANES, type Pt, type MetroLine } from '@/app/lib/metroData';
import type { BartTrain, BartDeparturesResponse } from '@/app/lib/bart';

// Ambient OLED screensaver: mini-metro BART map, live trains as LED dots.
// Ported from the standalone prototype; the sim mode was dropped in favor of /api/bart/trains.

const NS = 'http://www.w3.org/2000/svg';
const POLL_MS = 15000;
const LW = 0.36; // lane width, grid units
const HOME_POLL_MS = 60000;
const HOME_ROWS = 3; // departures shown per direction
const HOME_CYCLE_MS = 5000;
const STALE_MS = 20000; // hide a train this long after its predicted arrival

function el(tag: string, attrs: Record<string, string | number>, parent?: Element): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e as SVGElement;
}

const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const geom = (a: string, b: string): Pt[] => {
  const key = edgeKey(a, b);
  const via = VIA[key] ?? [];
  return [ST[a], ...(a === key.split('|')[0] ? via : via.slice().reverse()), ST[b]];
};

// Right-hand normal of each leg, so a lane keeps its side through every bend.
function offsetPoly(p: Pt[], d: number): Pt[] {
  const N = p.slice(1).map((q, i): Pt => {
    const dx = q[0] - p[i][0], dy = q[1] - p[i][1];
    const l = Math.hypot(dx, dy);
    return [-dy / l, dx / l];
  });
  return p.map((pt, i) => {
    let n = N[Math.min(i, N.length - 1)];
    let sc = 1;
    if (i > 0 && i < p.length - 1) {
      const a = N[i - 1], b = N[i];
      const mx = a[0] + b[0], my = a[1] + b[1];
      const l = Math.hypot(mx, my);
      n = [mx / l, my / l];
      sc = 1 / (n[0] * a[0] + n[1] * a[1]);
    }
    return [pt[0] + n[0] * d * sc, pt[1] + n[1] * d * sc];
  });
}

type LinePath = { pts: Pt[]; cum: number[]; seq: string[]; stationS: number[] };
type Edge = { a: string; pts: Pt[]; lines: MetroLine[]; off: Partial<Record<MetroLine, Pt[]>> };

function xyAt(P: LinePath, s: number): [number, number, number] {
  const c = P.cum;
  let lo = 0, hi = c.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c[m] <= s) lo = m; else hi = m;
  }
  const a = P.pts[lo], b = P.pts[hi];
  const u = Math.min(1, Math.max(0, (s - c[lo]) / ((c[hi] - c[lo]) || 1)));
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI];
}

function start(svg: SVGSVGElement): () => void {
  const root = el('g', {}, svg);
  const gTrack = el('g', {}, root), gStation = el('g', {}, root), gLabel = el('g', {}, root), gTrain = el('g', {}, root), hud = el('g', {}, root);

  const edges: Record<string, Edge> = {};
  const lineCount: Record<string, Set<MetroLine>> = {};
  for (const ln of LORDER) {
    const seq = SEQ[ln];
    seq.forEach((c) => (lineCount[c] ||= new Set()).add(ln));
    for (let i = 0; i < seq.length - 1; i++) {
      const k = edgeKey(seq[i], seq[i + 1]);
      (edges[k] ||= { a: seq[i], pts: geom(seq[i], seq[i + 1]), lines: [], off: {} }).lines.push(ln);
    }
  }
  for (const [k, e] of Object.entries(edges)) {
    const n = e.lines.length;
    e.lines.forEach((ln, i) => {
      const pts = offsetPoly(e.pts, (LANES[k]?.[ln] ?? i - (n - 1) / 2) * LW);
      e.off[ln] = pts;
      el('polyline', {
        points: pts.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' '),
        fill: 'none', stroke: COL[ln], 'stroke-width': LW * 0.6, opacity: 0.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }, gTrack);
    });
  }

  // One continuous polyline per line, so a train can be placed anywhere along it.
  const paths = {} as Record<MetroLine, LinePath>;
  for (const ln of LORDER) {
    const seq = SEQ[ln];
    const pts: Pt[] = [];
    const idx: number[] = [];
    for (let i = 0; i < seq.length - 1; i++) {
      const e = edges[edgeKey(seq[i], seq[i + 1])];
      let o = e.off[ln]!;
      if (e.a !== seq[i]) o = o.slice().reverse();
      idx.push(pts.length);
      pts.push(...o);
    }
    idx.push(pts.length - 1);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    paths[ln] = { pts, cum, seq, stationS: idx.map((i) => cum[i]) };
  }

  const rings: Record<string, SVGElement> = {};
  for (const c in ST) {
    const r = lineCount[c].size >= 3 ? 0.62 : 0.46;
    rings[c] = el('circle', { cx: ST[c][0], cy: ST[c][1], r, fill: '#000', stroke: '#8a8d99', 'stroke-width': 0.16 }, gStation);
  }

  // Station names, barely visible so they orient without competing with the trains.
  for (const c in ST) {
    const [name, side] = LABEL[c];
    const [x, y] = ST[c];
    const t = el('text', {
      x: side === 'l' ? x - 1.4 : side === 'r' ? x + 1.4 : x,
      y: side === 'u' ? y - 1.4 : side === 'd' ? y + 2.2 : y + 0.35,
      'text-anchor': side === 'l' ? 'end' : side === 'r' ? 'start' : 'middle',
      'font-size': 1, fill: '#3c3f4a',
    }, gLabel);
    t.textContent = name;
  }

  // HUD in the empty lower-right of the map.
  const clockEl = el('text', { x: 87, y: 16, 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 200, fill: '#eceef2' }, hud);
  const dateEl = el('text', { x: 87, y: 20.5, 'text-anchor': 'middle', 'font-size': 1.6, fill: '#7d808c', 'letter-spacing': 0.3 }, hud);
  let lastClock = '';

  // Home station departures (the station picked in Settings), under the clock.
  const gHome = el('g', {}, hud);
  const text = (x: number, y: number, str: string, attrs: Record<string, string | number>) => {
    const t = el('text', { x, y, ...attrs }, gHome);
    t.textContent = str;
  };
  // Same rotation as the home page: pages of HOME_ROWS, advancing every HOME_CYCLE_MS.
  let home: Extract<BartDeparturesResponse, { configured: true }> | null = null;
  let page = 0;
  const renderHome = () => {
    gHome.replaceChildren();
    if (!home) return;
    text(87, 26, home.stationName.toUpperCase(), { 'text-anchor': 'middle', 'font-size': 1.2, fill: '#5d606c', 'letter-spacing': 0.2 });
    let y = 29.5;
    for (const [arrow, list] of [['↓', home.south], ['↑', home.north]] as const) {
      const start = list.length > HOME_ROWS ? Math.min(page * HOME_ROWS, list.length - HOME_ROWS) : 0;
      for (const d of list.slice(start, start + HOME_ROWS)) {
        text(76, y, arrow, { 'font-size': 1.5, fill: '#5d606c' });
        el('circle', { cx: 79.2, cy: y - 0.5, r: 0.5, fill: d.hexColor }, gHome);
        text(80.6, y, d.destination.slice(0, 14), { 'font-size': 1.5, fill: '#9a9daa' });
        text(98, y, d.label === 'Leaving' ? 'Now' : `${d.label}m`, { 'text-anchor': 'end', 'font-size': 1.5, 'font-weight': 600, fill: '#eceef2' });
        y += 2.4;
      }
      y += 1;
    }
  };
  const loadHome = async () => {
    try {
      const res = await fetch('/api/bart');
      if (!res.ok) return;
      const data = (await res.json()) as BartDeparturesResponse;
      home = data.configured ? data : null;
      page = 0;
      renderHome();
    } catch { /* keep the last departures */ }
  };
  loadHome();
  const homeId = setInterval(loadHome, HOME_POLL_MS);
  const cycleId = setInterval(() => {
    if (!home) return;
    const pages = Math.ceil(Math.max(home.south.length, home.north.length) / HOME_ROWS);
    page = (page + 1) % Math.max(1, pages);
    renderHome();
  }, HOME_CYCLE_MS);

  // Trains are LED dots; pool the elements and reposition every frame.
  let trains: BartTrain[] = [];
  const pool: SVGElement[] = [];
  const poll = async () => {
    try {
      const res = await fetch('/api/bart/trains');
      if (res.ok) trains = ((await res.json()) as { trains: BartTrain[] }).trains;
    } catch { /* keep showing the last known trains */ }
  };
  poll();
  const pollId = setInterval(poll, POLL_MS);

  let raf = 0;
  const frame = (ms: number) => {
    const now = Date.now();
    const live = trains.filter((t) => now - t.arrive < STALE_MS);
    while (pool.length < live.length) {
      pool.push(el('path', { d: 'M-0.8 -0.4 H0.4 A0.4 0.4 0 0 1 0.4 0.4 H-0.8 Z', stroke: '#000', 'stroke-width': 0.12, 'stroke-linejoin': 'round' }, gTrain));
    }
    pool.forEach((g, i) => {
      const t = live[i];
      const P = t && paths[t.line];
      const a = P?.seq.indexOf(t.from) ?? -1;
      const b = P?.seq.indexOf(t.to) ?? -1;
      if (!t || a < 0 || b < 0) return g.setAttribute('display', 'none');
      const progress = Math.min(1, Math.max(0, 1 - (t.arrive - now) / t.seg));
      const [x, y, ang] = xyAt(P, P.stationS[a] + (P.stationS[b] - P.stationS[a]) * progress);
      g.setAttribute('display', '');
      g.setAttribute('fill', COL[t.line]);
      g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(b < a ? ang + 180 : ang).toFixed(1)})`);
    });

    const d = new Date();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '');
    if (time !== lastClock) {
      lastClock = time;
      clockEl.textContent = time;
      dateEl.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
    }

    // OLED care: slow pixel drift, dim overnight.
    const h = d.getHours();
    root.setAttribute('transform', `translate(${(0.35 * Math.sin(ms / 37000)).toFixed(3)} ${(0.35 * Math.cos(ms / 53000)).toFixed(3)})`);
    root.setAttribute('opacity', String(h >= 23 || h < 6 ? 0.4 : 1));
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    clearInterval(pollId);
    clearInterval(homeId);
    clearInterval(cycleId);
    svg.replaceChildren();
  };
}

export default function MetroMap() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => start(svgRef.current!), []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* unsupported */ }
    try { await navigator.wakeLock.request('screen'); } catch { /* unsupported */ }
  };

  return (
    <div className="fixed inset-0 z-50 cursor-none overflow-hidden bg-black" onClick={toggleFullscreen}>
      <svg ref={svgRef} viewBox="-2 -1 100 83" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" />
    </div>
  );
}
