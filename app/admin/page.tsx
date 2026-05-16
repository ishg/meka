import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { readConfig } from '@/app/lib/config';
import { PALETTE, colorsForHue } from '@/app/lib/colors';
import { addCategory, deleteCategory } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cfg = await readConfig();

  return (
    <div className="admin">
      <div className="admin-hd">
        <div>
          <h1>Settings</h1>
          <div className="sub">Configure event categories</div>
        </div>
        <Link href="/" className="link-btn">
          <ArrowLeftIcon className="ico" /> Back to calendar
        </Link>
      </div>

      <section className="admin-section">
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
    </div>
  );
}
