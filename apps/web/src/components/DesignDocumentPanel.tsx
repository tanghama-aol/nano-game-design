import { BookOpen, ClipboardList, Gamepad2, Layers3, Palette, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '../i18n';
import { useTreeStore } from '../store/treeStore';

export function DesignDocumentPanel() {
  const { t } = useI18n();
  const designDocument = useTreeStore((state) => state.designDocument);

  return (
    <section className="panel p-4">
      <div className="panel-header mb-4">
        <h2 className="panel-title">
          <BookOpen size={17} className="text-emerald-300" />
          {t('designDocument')}
        </h2>
      </div>

      {!designDocument ? (
        <div className="min-h-32 rounded-md border border-dashed border-slate-700 bg-slate-950/45 px-4 py-5">
          <div className="text-sm font-bold text-slate-200">{t('noDesignDocumentYet')}</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{t('noDesignDocumentHelp')}</p>
        </div>
      ) : (
        <article className="space-y-4 text-sm">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              {designDocument.genre}
            </div>
            <h2 className="break-words text-2xl font-black leading-tight text-white">{designDocument.title}</h2>
          </div>

          <TextBlock label={t('playerFantasy')} value={designDocument.playerFantasy} />
          <TextBlock label={t('artDirection')} value={designDocument.artDirection} />

          <ListBlock icon={<Gamepad2 size={15} />} label={t('coreLoop')} items={designDocument.coreLoop} />
          <ListBlock icon={<Target size={15} />} label={t('keyMechanics')} items={designDocument.keyMechanics} />
          <ListBlock icon={<Layers3 size={15} />} label={t('contentPillars')} items={designDocument.contentPillars} />
          <ListBlock icon={<ClipboardList size={15} />} label={t('productionNotes')} items={designDocument.productionNotes} />
        </article>
      )}
    </section>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <section className="border-t border-slate-800 pt-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Palette size={14} />
        {label}
      </div>
      <p className="break-words text-sm leading-6 text-slate-200">{value}</p>
    </section>
  );
}

function ListBlock({ icon, label, items }: { icon: ReactNode; label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-slate-800 pt-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-200">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
