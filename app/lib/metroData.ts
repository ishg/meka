// Schematic BART map, loosely geographic like the official map, 0/45/90 degree lines. Shared by the live-train
// API (to place trains) and the screensaver (to draw them).

export type Pt = [number, number];
export type MetroLine = 'RED' | 'YELLOW' | 'ORANGE' | 'GREEN' | 'BLUE' | 'OAK';

export const ST: Record<string, Pt> = {
  // Richmond diagonal → MacArthur trunk
  RICH: [22, 4], DELN: [24.4, 6.4], PLZA: [26.8, 8.8], NBRK: [29.2, 11.2], DBRK: [31.6, 13.6], ASHB: [34, 16],
  MCAR: [36, 24], '19TH': [36, 28], '12TH': [36, 32],
  // Yellow: up to Concord, then east to Antioch
  ROCK: [40.3, 21.7], ORIN: [42.6, 19.4], LAFY: [44.9, 17.1], WCRK: [47.2, 14.8], PHIL: [49.5, 12.5], CONC: [51.8, 10.2],
  NCON: [57, 10.2], PITT: [62.5, 10.2], PCTR: [68, 10.2], ANTC: [73.5, 10.2],
  // Transbay → San Francisco → Peninsula
  WOAK: [31, 34.5], EMBR: [24.5, 37], MONT: [22, 39.5], POWL: [19.5, 42], CIVC: [17, 44.5],
  '16TH': [15, 49.5], '24TH': [15, 52.5], GLEN: [15, 55.5], BALB: [15, 58.5], DALY: [15, 61.5], COLM: [15, 64.5],
  SSAN: [15, 67.5], SBRN: [15, 70.5], SFIA: [20, 75.5], MLBR: [23, 78.5],
  // East Bay diagonal to Fremont, then south to Berryessa; Dublin and Oakland Airport spurs
  LAKE: [41, 39], FTVL: [43.5, 41.5], COLS: [46, 44], SANL: [48.5, 46.5], BAYF: [51, 49], HAYW: [54.5, 52.5],
  SHAY: [58, 56], UCTY: [61.5, 59.5], FRMT: [65, 63], WARM: [68, 69.5], MLPT: [68, 73], BERY: [68, 76.5],
  CAST: [63.5, 49], WDUB: [72, 49], DUBL: [78.5, 49], OAKL: [43.5, 50],
};

// Bends between two stations, keyed by sorted station pair, listed from the
// alphabetically-first station to the second.
export const VIA: Record<string, Pt[]> = {
  'ASHB|MCAR': [[36, 18]],
  'MCAR|ROCK': [[38, 24]],
  '12TH|WOAK': [[36, 34.5]],             // Red/Yellow turn west at the bottom of the trunk
  '12TH|LAKE': [[36, 34]],               // Orange continues down the trunk, then bends SE
  'LAKE|WOAK': [[36.5, 34.5]],           // Blue/Green skip 12th: straight west from the SE diagonal
  'EMBR|WOAK': [[27, 34.5]],
  '16TH|CIVC': [[15, 46.5]],
  'COLS|OAKL': [[46, 47.5]],
  'FRMT|WARM': [[68, 66]],
};

export const LORDER: MetroLine[] = ['RED', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE', 'OAK'];

export const COL: Record<MetroLine, string> = {
  RED: '#ff4d5a', YELLOW: '#ffd23f', ORANGE: '#ff9a2e', GREEN: '#3fd07a', BLUE: '#4d8dff', OAK: '#b9b2a0',
};

const s = (str: string) => str.split(' ');
export const SEQ: Record<MetroLine, string[]> = {
  RED: s('RICH DELN PLZA NBRK DBRK ASHB MCAR 19TH 12TH WOAK EMBR MONT POWL CIVC 16TH 24TH GLEN BALB DALY COLM SSAN SBRN SFIA MLBR'),
  YELLOW: s('ANTC PCTR PITT NCON CONC PHIL WCRK LAFY ORIN ROCK MCAR 19TH 12TH WOAK EMBR MONT POWL CIVC 16TH 24TH GLEN BALB DALY COLM SSAN SBRN SFIA MLBR'),
  ORANGE: s('BERY MLPT WARM FRMT UCTY SHAY HAYW BAYF SANL COLS FTVL LAKE 12TH 19TH MCAR ASHB DBRK NBRK PLZA DELN RICH'),
  GREEN: s('BERY MLPT WARM FRMT UCTY SHAY HAYW BAYF SANL COLS FTVL LAKE WOAK EMBR MONT POWL CIVC 16TH 24TH GLEN BALB DALY'),
  BLUE: s('DUBL WDUB CAST BAYF SANL COLS FTVL LAKE WOAK EMBR MONT POWL CIVC 16TH 24TH GLEN BALB DALY'),
  OAK: ['COLS', 'OAKL'],
};

// Lane offsets (in lane widths) for edges where lines run side by side, measured to the
// right of the edge's travel direction (the first line's order in SEQ). Edges not
// listed here are centred. Consecutive stations in a group share the offsets.
const LANE_GROUPS: [string, Partial<Record<MetroLine, number>>][] = [
  ['RICH DELN PLZA NBRK DBRK ASHB MCAR', { RED: 0.5, ORANGE: -0.5 }],
  ['MCAR 19TH 12TH', { RED: 1, YELLOW: 0, ORANGE: -1 }],
  ['12TH WOAK', { RED: 1, YELLOW: 0 }],
  ['WOAK EMBR MONT POWL CIVC 16TH 24TH GLEN BALB DALY', { RED: 1, YELLOW: 0, BLUE: -1, GREEN: -2 }],
  ['DALY COLM SSAN SBRN SFIA MLBR', { RED: 1, YELLOW: 0 }],
  ['12TH LAKE', { ORANGE: 1 }],
  ['LAKE WOAK', { BLUE: -1, GREEN: -2 }],
  ['LAKE FTVL COLS SANL BAYF', { ORANGE: 1, BLUE: -1, GREEN: -2 }],
  ['BAYF HAYW SHAY UCTY FRMT WARM MLPT BERY', { ORANGE: 0.5, GREEN: -0.5 }],
];
export const LANES: Record<string, Partial<Record<MetroLine, number>>> = {};
for (const [stations, offsets] of LANE_GROUPS) {
  const list = stations.split(' ');
  for (let i = 0; i < list.length - 1; i++) {
    const [x, y] = list[i] < list[i + 1] ? [list[i], list[i + 1]] : [list[i + 1], list[i]];
    LANES[`${x}|${y}`] = offsets;
  }
}

// Station name and which side of the dot to draw it on (left/right/up/down).
export type Side = 'l' | 'r' | 'u' | 'd';
export const LABEL: Record<string, [string, Side]> = {
  RICH: ['Richmond', 'l'], DELN: ['El Cerrito del Norte', 'l'], PLZA: ['El Cerrito Plaza', 'l'], NBRK: ['North Berkeley', 'l'],
  DBRK: ['Downtown Berkeley', 'l'], ASHB: ['Ashby', 'l'], MCAR: ['MacArthur', 'l'], '19TH': ['19th St', 'r'], '12TH': ['12th St', 'r'],
  LAKE: ['Lake Merritt', 'r'], FTVL: ['Fruitvale', 'r'], COLS: ['Coliseum', 'r'], SANL: ['San Leandro', 'r'], BAYF: ['Bay Fair', 'l'],
  HAYW: ['Hayward', 'r'], SHAY: ['South Hayward', 'r'], UCTY: ['Union City', 'r'], FRMT: ['Fremont', 'r'], WARM: ['Warm Springs', 'r'],
  MLPT: ['Milpitas', 'r'], BERY: ['Berryessa', 'r'],
  CAST: ['Castro Valley', 'd'], WDUB: ['West Dublin', 'u'], DUBL: ['Dublin/Pleasanton', 'r'], OAKL: ['Oakland Airport', 'l'],
  ROCK: ['Rockridge', 'r'], ORIN: ['Orinda', 'r'], LAFY: ['Lafayette', 'r'], WCRK: ['Walnut Creek', 'r'], PHIL: ['Pleasant Hill', 'l'],
  CONC: ['Concord', 'u'], NCON: ['North Concord', 'd'], PITT: ['Pittsburg/Bay Point', 'u'], PCTR: ['Pittsburg Center', 'd'], ANTC: ['Antioch', 'u'],
  WOAK: ['West Oakland', 'u'], EMBR: ['Embarcadero', 'l'], MONT: ['Montgomery', 'l'], POWL: ['Powell', 'l'], CIVC: ['Civic Center', 'l'],
  '16TH': ['16th St Mission', 'l'], '24TH': ['24th St Mission', 'l'], GLEN: ['Glen Park', 'l'], BALB: ['Balboa Park', 'l'], DALY: ['Daly City', 'l'],
  COLM: ['Colma', 'l'], SSAN: ['South San Francisco', 'l'], SBRN: ['San Bruno', 'l'], SFIA: ['SFO', 'r'], MLBR: ['Millbrae', 'r'],
};
