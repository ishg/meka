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
