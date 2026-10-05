import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import type { Category } from '../../data/products';
import { listCategories, saveCategories } from '../../lib/adminApi';
import { Card, ErrorNote, Loading, PageTitle, RowsEditor, SaveBar, slugify, useToast } from '../ui';

export default function Categories() {
  const [original, setOriginal] = useState<Category[] | null>(null);
  const [rows, setRows] = useState<Category[] | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload } = useCatalog();

  useEffect(() => {
    listCategories()
      .then((c) => {
        setOriginal(c);
        setRows(c);
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
      await saveCategories(clean, removed);
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
          blank={() => ({ id: '', name: '', blurb: '' })}
          addLabel="Añadir categoría"
          columns={[
            { key: 'name', label: 'Nombre', placeholder: 'Wedding Cakes', width: '1fr' },
            { key: 'blurb', label: 'Descripción breve', width: '2fr' },
          ]}
        />
        <p className="adm-muted adm-small">
          Las páginas “Cakes” y “Treats” del menú muestran las categorías por defecto; las categorías nuevas aparecen en la tienda completa (/shop).
        </p>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setRows(original)} />
    </>
  );
}
