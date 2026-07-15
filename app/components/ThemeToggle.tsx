'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { readStoredTheme, applyTheme, storeTheme, type Theme } from '@/app/lib/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  return (
    <div className="seg">
      <button data-active={theme === 'light' ? 'true' : 'false'} onClick={() => choose('light')}>
        <SunIcon className="ico" /> Light
      </button>
      <button data-active={theme === 'dark' ? 'true' : 'false'} onClick={() => choose('dark')}>
        <MoonIcon className="ico" /> Dark
      </button>
    </div>
  );
}
