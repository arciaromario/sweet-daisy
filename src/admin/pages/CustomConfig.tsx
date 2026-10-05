import { useEffect, useState } from 'react';
import { Img } from '../../components/Img';
import { useCatalog } from '../../context/CatalogContext';
import { photo } from '../../data/images';
import type { CustomCakeSettings } from '../../data/settings';
import { getSettings, saveSettings, uploadProductImage } from '../../lib/adminApi';
import { Card, ErrorNote, Field, Loading, PageTitle, RowsEditor, SaveBar, StringListEditor, useToast } from '../ui';

export default function CustomConfig() {
  const [original, setOriginal] = useState<CustomCakeSettings | null>(null);
  const [c, setC] = useState<CustomCakeSettings | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload } = useCatalog();

  useEffect(() => {
    getSettings()
      .then((s) => {
        setOriginal(s.custom);
        setC(s.custom);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!c || !original) return <Loading />;

  const set = (patch: Partial<CustomCakeSettings>) => setC({ ...c, ...patch });
  const dirty = JSON.stringify(c) !== JSON.stringify(original);

  async function save() {
    if (!c!.sizes.length || c!.sizes.some((s) => !s.label.trim())) return toast('Cada tamaño necesita un nombre.', 'error');
    for (const [name, list] of [
      ['sabor', c!.flavors],
      ['relleno', c!.fillings],
      ['cobertura', c!.frostings],
      ['estilo de decoración', c!.styles],
    ] as const) {
      if (!list.length) return toast(`Añade al menos un ${name}.`, 'error');
    }
    setSaving(true);
    try {
      await saveSettings('custom', c!);
      setOriginal(c);
      reload();
      toast('Opciones de pasteles guardadas');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Opciones de pasteles personalizados" subtitle="Lo que tus clientes pueden elegir en el diseñador de pasteles (/custom-cakes)." />

      <div className="adm-stack-lg">
        <Card title="Reglas">
          <div className="adm-form-grid">
            <Field label="Antelación mínima (días)" hint="Cuántos días antes del evento hay que pedir.">
              <input className="input" type="number" min={1} max={120} value={c.leadDays} onChange={(e) => set({ leadDays: Math.max(1, Number(e.target.value)) })} />
            </Field>
            <Field label="Depósito para reservar (%)" hint="Se menciona en la web y en tus respuestas.">
              <input className="input" type="number" min={0} max={100} value={c.depositPercent} onChange={(e) => set({ depositPercent: Math.min(100, Math.max(0, Number(e.target.value))) })} />
            </Field>
          </div>
        </Card>

        <Card title="Tamaños y precio base">
          <RowsEditor
            rows={c.sizes}
            onChange={(sizes) => set({ sizes })}
            blank={() => ({ label: '', servings: '', price: 0 })}
            addLabel="Añadir tamaño"
            columns={[
              { key: 'label', label: 'Tamaño', placeholder: 'Two tiers', width: '1.2fr' },
              { key: 'servings', label: 'Raciones', placeholder: '30–45 servings', width: '1.2fr' },
              { key: 'price', label: 'Desde (USD)', type: 'number', width: '0.8fr' },
            ]}
          />
        </Card>

        <div className="adm-grid-2">
          <Card title="Sabores del bizcocho">
            <StringListEditor value={c.flavors} onChange={(flavors) => set({ flavors })} placeholder="Ej. Coconut & lime" />
          </Card>
          <Card title="Rellenos">
            <StringListEditor value={c.fillings} onChange={(fillings) => set({ fillings })} placeholder="Ej. Mango curd" />
          </Card>
        </div>

        <Card title="Coberturas">
          <RowsEditor
            rows={c.frostings}
            onChange={(frostings) => set({ frostings })}
            blank={() => ({ label: '', note: '' })}
            addLabel="Añadir cobertura"
            columns={[
              { key: 'label', label: 'Cobertura', width: '1fr' },
              { key: 'note', label: 'Descripción breve', width: '1.4fr' },
            ]}
          />
        </Card>

        <Card title="Estilos de decoración">
          <RowsEditor
            rows={c.styles}
            onChange={(styles) => set({ styles })}
            blank={() => ({ label: '', image: '', extra: 0 })}
            addLabel="Añadir estilo"
            columns={[
              { key: 'image', label: 'Foto', width: '150px', render: (row, setRow) => <StyleImage value={row.image} onChange={(image) => setRow({ image })} /> },
              { key: 'label', label: 'Estilo', width: '1.4fr' },
              { key: 'extra', label: 'Extra (USD)', type: 'number', width: '0.7fr' },
            ]}
          />
        </Card>

        <Card title="Ocasiones">
          <StringListEditor value={c.occasions} onChange={(occasions) => set({ occasions })} placeholder="Ej. Graduation" />
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setC(original)} />
    </>
  );
}

function StyleImage({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <div className="adm-style-img">
      <Img src={value || 'vanilla'} alt="" ratio="1 / 1" width={160} sizes="56px" />
      <div>
        <label className="adm-link">
          {busy ? 'Subiendo…' : 'Cambiar'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              try {
                onChange(await uploadProductImage(f));
              } catch (err) {
                toast(err instanceof Error ? err.message : 'Error', 'error');
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        <select className="adm-mini-select" value={value in photo ? value : ''} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label="Foto de ejemplo">
          <option value="">Foto de ejemplo…</option>
          {Object.keys(photo).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
