'use server';

import { revalidatePath } from 'next/cache';
import { readConfig, writeConfig, type Category } from '@/app/lib/config';

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function addCategory(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const pattern = String(formData.get('pattern') ?? '').trim();
  const hue = Number(formData.get('hue') ?? 230);
  if (!name || !pattern) return;

  const cfg = await readConfig();
  const cat: Category = { id: genId(), name, pattern, hue };
  await writeConfig({ ...cfg, categories: [...cfg.categories, cat] });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const cfg = await readConfig();
  await writeConfig({ ...cfg, categories: cfg.categories.filter((c) => c.id !== id) });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function updateTransitStation(formData: FormData): Promise<void> {
  const transitStation = String(formData.get('station') ?? '').trim();
  const cfg = await readConfig();
  if (transitStation === cfg.transitStation) return;
  // Line selections are specific to the previous station's live trains — stale otherwise.
  await writeConfig({ ...cfg, transitStation, transitLines: [] });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function updateTransitLines(formData: FormData): Promise<void> {
  const transitLines = formData.getAll('lines').map(String);
  const cfg = await readConfig();
  await writeConfig({ ...cfg, transitLines });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function updateWeatherZip(formData: FormData): Promise<void> {
  const weatherZip = String(formData.get('zip') ?? '').trim();
  if (weatherZip && !/^\d{5}$/.test(weatherZip)) return;

  const cfg = await readConfig();
  if (weatherZip === cfg.weatherZip) return;
  await writeConfig({ ...cfg, weatherZip });
  revalidatePath('/');
  revalidatePath('/admin');
}
