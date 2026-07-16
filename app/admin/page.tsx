import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { readConfig } from '@/app/lib/config';
import { PALETTE, colorsForHue } from '@/app/lib/colors';
import { fetchBartLineOptions, type BartLineOption } from '@/app/lib/bart';
import ThemeToggle from '@/app/components/ThemeToggle';
import { addCategory, deleteCategory, updateTransitLines } from './actions';

export const dynamic = 'force-dynamic';

function titleCase(s: string): string {
  return s.length ? s[0] + s.slice(1).toLowerCase() : s;
}

export default async function AdminPage() {
  const [cfg, lineOptions] = await Promise.all([
    readConfig(),
    fetchBartLineOptions().catch(() => null as BartLineOption[] | null),
  ]);

  const northLines = lineOptions?.filter((l) => l.direction === 'North') ?? [];
  const southLines = lineOptions?.filter((l) => l.direction === 'South') ?? [];

  return (
    <div className="admin">
      <div className="admin-hd">
        <div>
          <h1>Settings</h1>
          <div className="sub">General preferences, plus settings for each module</div>
        </div>
        <Link href="/" className="link-btn">
          <ArrowLeftIcon className="ico" /> Back to home
        </Link>
      </div>

      <section className="admin-section">
        <h2>General</h2>
        <p className="muted">Choose how Meka looks. Saved on this device.</p>
        <ThemeToggle />
      </section>

      <section className="admin-section">
        <span className="section-eyebrow">Calendar</span>
        <h2>Categories</h2>
        <p className="muted">
          Color events whose title contains a given text (case-insensitive). First match wins.
        </p>

        {cfg.categories.length === 0 ? (
          <p className="muted small">No categories yet.</p>
        ) : (
          <ul className="cat-list">
            {cfg.categories.map((c) => {
              const colors = colorsForHue(c.hue, false);
              return (
                <li key={c.id} className="cat-item">
                  <span className="swatch" style={{ background: colors.fill, borderLeft: `4px solid ${colors.dot}` }} />
                  <div className="cat-info">
                    <span className="cat-name">{c.name}</span>
                    <span className="cat-pat mono">contains &ldquo;{c.pattern}&rdquo;</span>
                  </div>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="btn ghost" title="Delete category">
                      <TrashIcon className="ico" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <form action={addCategory} className="cat-form">
          <input
            type="text"
            name="name"
            placeholder="Category name (e.g. Work)"
            className="input"
            required
          />
          <input
            type="text"
            name="pattern"
            placeholder="Title contains… (e.g. on-call)"
            className="input"
            required
          />
          <select name="hue" defaultValue={230} className="select">
            {PALETTE.map((p) => (
              <option key={p.hue} value={p.hue}>{p.label}</option>
            ))}
          </select>
          <button type="submit" className="btn primary">
            <PlusIcon className="ico" /> Add
          </button>
        </form>
      </section>

      <section className="admin-section">
        <span className="section-eyebrow">Transit</span>
        <h2>BART lines</h2>
        <p className="muted">
          Departures for 12th St. Oakland City Center.{' '}
          {cfg.transitLines.length === 0
            ? 'Showing every live departure until you select specific lines below.'
            : 'Only the checked lines below show on the dashboard.'}
        </p>

        {lineOptions === null ? (
          <p className="muted small">Couldn&rsquo;t load live BART lines right now. Try again later.</p>
        ) : (
          <form action={updateTransitLines} className="transit-form">
            <div className="transit-cols">
              <div className="transit-col">
                <span className="section-eyebrow">Northbound</span>
                {northLines.length === 0 ? (
                  <p className="muted small">No northbound trains right now.</p>
                ) : (
                  <ul className="line-list">
                    {northLines.map((l) => (
                      <li key={l.id} className="line-item">
                        <label>
                          <input
                            type="checkbox"
                            name="lines"
                            value={l.id}
                            defaultChecked={cfg.transitLines.includes(l.id)}
                          />
                          <span className="line-dot" style={{ background: l.hexColor }} />
                          <span className="line-name">{l.destination}</span>
                          <span className="line-tag">{titleCase(l.line)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="transit-col">
                <span className="section-eyebrow">Southbound</span>
                {southLines.length === 0 ? (
                  <p className="muted small">No southbound trains right now.</p>
                ) : (
                  <ul className="line-list">
                    {southLines.map((l) => (
                      <li key={l.id} className="line-item">
                        <label>
                          <input
                            type="checkbox"
                            name="lines"
                            value={l.id}
                            defaultChecked={cfg.transitLines.includes(l.id)}
                          />
                          <span className="line-dot" style={{ background: l.hexColor }} />
                          <span className="line-name">{l.destination}</span>
                          <span className="line-tag">{titleCase(l.line)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button type="submit" className="btn primary">Save</button>
          </form>
        )}
      </section>
    </div>
  );
}
