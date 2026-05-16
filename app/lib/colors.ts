// Default hue used when no category matches (the original blueberry blue)
export const DEFAULT_EVENT_HUE = 230;
// Hue used for multi-day span bars when uncategorized (the original coral)
export const DEFAULT_SPAN_HUE = 30;

export const PALETTE: { label: string; hue: number }[] = [
  { label: 'Blue',   hue: 230 },
  { label: 'Coral',  hue: 30  },
  { label: 'Green',  hue: 150 },
  { label: 'Yellow', hue: 90  },
  { label: 'Purple', hue: 290 },
  { label: 'Pink',   hue: 350 },
  { label: 'Teal',   hue: 200 },
  { label: 'Orange', hue: 60  },
];

export type EventColors = {
  fill: string;
  ink: string;
  dot: string;
};

export function colorsForHue(hue: number, dark: boolean): EventColors {
  if (dark) {
    return {
      fill: `oklch(0.32 0.06 ${hue})`,
      ink:  `oklch(0.86 0.08 ${hue})`,
      dot:  `oklch(0.62 0.18 ${hue})`,
    };
  }
  return {
    fill: `oklch(0.90 0.10 ${hue})`,
    ink:  `oklch(0.38 0.15 ${hue})`,
    dot:  `oklch(0.62 0.18 ${hue})`,
  };
}
