import { promises as fs } from 'node:fs';
import path from 'node:path';

export type Category = {
  id: string;
  name: string;
  pattern: string; // case-insensitive substring match against event summary
  hue: number;     // 0-360, used as the H value for oklch event colors
};

export type AppConfig = {
  categories: Category[];
  transitStation: string; // BART station abbreviation (e.g. "12TH"); empty hides the panel
  transitLines: string[]; // BART bartLineId() values to show; empty shows everything
  weatherZip: string; // 5-digit US zip code; empty hides the panel
};

const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

const DEFAULT_CONFIG: AppConfig = {
  categories: [],
  transitStation: '',
  transitLines: [],
  weatherZip: '94612',
};

export async function readConfig(): Promise<AppConfig> {
  try {
    const buf = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(buf) as Partial<AppConfig>;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      transitStation: typeof parsed.transitStation === 'string' ? parsed.transitStation : '',
      transitLines: Array.isArray(parsed.transitLines) ? parsed.transitLines : [],
      weatherZip: typeof parsed.weatherZip === 'string' ? parsed.weatherZip : DEFAULT_CONFIG.weatherZip,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return DEFAULT_CONFIG;
    throw err;
  }
}

export async function writeConfig(cfg: AppConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

export function matchCategory(summary: string, categories: Category[]): Category | null {
  const s = summary.toLowerCase();
  for (const c of categories) {
    const p = c.pattern.trim().toLowerCase();
    if (p && s.includes(p)) return c;
  }
  return null;
}
