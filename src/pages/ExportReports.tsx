import { useTranslation } from 'react-i18next';

export default function ExportReports() {
  const { t } = useTranslation('export');

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
      </header>
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">
        {t('subtitle')}
      </div>
    </section>
  );
}
