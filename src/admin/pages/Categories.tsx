import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import type { Category } from '../../data/products';
import { listCategories, saveCategories } from '../../lib/adminApi';
import { Card, ErrorNote, Loading, PageTitle, RowsEditor, SaveBar, slugify, useToast } from '../ui';

/** Flat rows for the table: the Spanish copy sits next to the English instead of nested in i18n. */
type Row = Category & { nameEs: string; blurbEs: string };

const toRow = (c: Category): Row => ({ ...c, nameEs: c.i18n?.es?.name ?? '', blurbEs: c.i18n?.es?.blurb ?? '' });
const fromRow = ({ nameEs, blurbEs, ...c }: Row): Category => ({
  ...c,
  i18n: { ...c.i18n, es: { name: nameEs.trim() || undefined, blurb: blurbEs.trim() || undefined } },
});

export default function Categories() {
  const [original, setOriginal] = useState<Row[] | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload } = useCatalog();

  useEffect(() => {
    listCategories()
      .then((c) => {
        setOriginal(c.map(toRow));
        setRows(c.map(toRow));
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!rows || !original) return <Loading />;

  const dirty = JSON.stringify(rows) !== JSON.stringify(original);

  async function save() {
    const clean = rows!.map((c) => ({ ...c, name: c.name.trim(), id: c.id || slugify(c.name) })).filter((c) => c.name);
    if (new Set(clean.map((c) => c.id)).size !== clean.length) return toast('Hay dos categorías con el mismo nombre.', 'error');
    const removed = original!.map((c) => c.id).filter((id) => !clean.some((c) => c.id === id));
    setSaving(true);
    try {
      await saveCategories(clean.map(fromRow), removed);
      setOriginal(clean);
      setRows(clean);
      reload();
      toast('Categorías guardadas');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Categorías" subtitle="Los filtros de la tienda. El orden aquí es el orden en la tienda." />
      <Card>
        <RowsEditor
          rows={rows}
          onChange={setRows}
          blank={() => ({ id: '', name: '', blurb: '', nameEs: '', blurbEs: '' })}
          addLabel="Añadir categoría"
          columns={[
            { key: 'name', label: 'Nombre', placeholder: 'NY Cookies', width: '1fr' },
            { key: 'blurb', label: 'Descripción breve', width: '1.6fr' },
            { key: 'nameEs', label: 'Nombre en español', placeholder: 'Galletas NY', width: '1fr' },
            { key: 'blurbEs', label: 'Descripción en español', width: '1.6fr' },
          ]}
        />
        <p className="adm-muted adm-small">
          La página “Cookies” del menú muestra la categoría de galletas; las demás categorías aparecen en la tienda completa (/shop). Los textos en español
          se muestran cuando el cliente elige ES; si los dejas vacíos se usa el inglés.
        </p>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setRows(original)} />
    </>
  );
}
