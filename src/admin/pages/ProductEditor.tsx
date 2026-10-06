import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Icon } from '../../components/Icon';
import { Img } from '../../components/Img';
import { useCatalog } from '../../context/CatalogContext';
import { photo } from '../../data/images';
import type { Category, Product } from '../../data/products';
import { deleteProduct, listCategories, listProducts, saveProduct, uploadProductImage } from '../../lib/adminApi';
import { Card, ErrorNote, Field, Loading, PageTitle, prepLabel, RowsEditor, SaveBar, slugify, Toggle, useToast } from '../ui';

const blank = (category: string): Product => ({
  slug: '',
  name: '',
  category,
  short: '',
  description: '',
  images: [],
  sizes: [{ id: 'standard', label: '6" round', servings: '8–10 servings', price: 60 }],
  flavors: [],
  decorations: [],
  message: true,
  leadDays: 2,
  prepHours: 24,
  bestseller: false,
  details: [
    { label: 'Allergens', value: 'Contains wheat, eggs, dairy. Made in a kitchen that handles nuts.' },
    { label: 'Storage', value: 'Keep refrigerated. Serve at room temperature.' },
  ],
  tint: '#F4EDE1',
  active: true,
});

const badgePresets = ['Bestseller', 'Signature', 'New', 'Limited', 'Gift favourite'];

export default function ProductEditor() {
  const { slug } = useParams();
  const isNew = !slug;
  const navigate = useNavigate();
  const toast = useToast();
  const { reload: reloadStore } = useCatalog();

  const [categories, setCategories] = useState<Category[]>([]);
  const [original, setOriginal] = useState<Product | null>(null);
  const [p, setP] = useState<Product | null>(null);
  const [all, setAll] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  useEffect(() => {
    Promise.all([listCategories(), listProducts()])
      .then(([cats, products]) => {
        setCategories(cats);
        setAll(products);
        if (isNew) {
          const b = { ...blank(cats[0]?.id ?? 'cakes'), sort: products.length };
          setP(b);
          setOriginal(b);
        } else {
          const found = products.find((x) => x.slug === slug);
          if (!found) setError('No se encontró el producto.');
          setP(found ?? null);
          setOriginal(found ?? null);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar.'));
  }, [slug, isNew]);

  if (error) return <ErrorNote message={error} />;
  if (!p) return <Loading />;

  const set = (patch: Partial<Product>) => setP({ ...p, ...patch });
  const dirty = JSON.stringify(p) !== JSON.stringify(original);

  function validate(): string {
    if (!p!.name.trim()) return 'El producto necesita un nombre.';
    if (!/^[a-z0-9-]+$/.test(p!.slug)) return 'El identificador (slug) solo puede tener letras minúsculas, números y guiones.';
    if (all.some((x) => x.slug === p!.slug && x.slug !== slug)) return 'Ya hay otro producto con ese identificador.';
    if (p!.sizes.length === 0) return 'Añade al menos un tamaño con precio.';
    if (p!.sizes.some((s) => !s.label.trim() || !(s.price > 0))) return 'Cada tamaño necesita un nombre y un precio mayor que 0.';
    return '';
  }

  async function save() {
    const msg = validate();
    if (msg) return toast(msg, 'error');
    const clean: Product = {
      ...p!,
      name: p!.name.trim(),
      sizes: uniqueIds(p!.sizes.map((s) => ({ ...s, id: s.id || slugify(s.label) || 'size' }))),
      decorations: p!.decorations?.length ? uniqueIds(p!.decorations.map((d) => ({ ...d, id: d.id || slugify(d.label) || 'option' }))) : undefined,
      flavors: p!.flavors?.length ? p!.flavors.filter((f) => f.label.trim()) : undefined,
      details: p!.details.filter((d) => d.label.trim() && d.value.trim()),
      badge: p!.badge?.trim() || undefined,
    };
    setSaving(true);
    try {
      await saveProduct(clean, isNew ? undefined : slug);
      reloadStore();
      toast(isNew ? 'Producto creado' : 'Cambios guardados');
      setOriginal(clean);
      setP(clean);
      if (isNew || clean.slug !== slug) navigate(`../${clean.slug}`, { replace: true, relative: 'path' });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Borrar “${p!.name}” definitivamente? Si solo quieres ocultarlo, desactiva “Visible en la tienda”.`)) return;
    try {
      await deleteProduct(slug!);
      reloadStore();
      toast('Producto borrado');
      navigate('..', { relative: 'path' });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo borrar', 'error');
    }
  }

  return (
    <>
      <Link to=".." relative="path" className="adm-back">
        <Icon name="arrowLeft" /> Productos
      </Link>
      <PageTitle
        title={isNew ? 'Nuevo producto' : p.name || 'Producto'}
        actions={
          !isNew && (
            <a href={`${import.meta.env.BASE_URL}products/${p.slug}`} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">
              <Icon name="eye" /> Ver en la tienda
            </a>
          )
        }
      />

      <div className="adm-editor">
        <div className="adm-editor__main">
          <Card title="Información básica">
            <div className="adm-form-grid">
              <Field label="Nombre" wide>
                <input
                  className="input"
                  value={p.name}
                  onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
                  placeholder="Ej. Strawberry Dream Cake"
                />
              </Field>
              <Field label="Identificador en la URL (slug)" hint={`/products/${p.slug || '…'}`}>
                <input
                  className="input"
                  value={p.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set({ slug: slugify(e.target.value) });
                  }}
                />
              </Field>
              <Field label="Categoría">
                <select className="select" value={p.category} onChange={(e) => set({ category: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Descripción corta" hint="Aparece en las tarjetas de la tienda (1 línea)." wide>
                <input className="input" value={p.short} maxLength={140} onChange={(e) => set({ short: e.target.value })} />
              </Field>
              <Field label="Descripción completa" wide>
                <textarea className="textarea" rows={5} value={p.description} onChange={(e) => set({ description: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card title="Fotos">
            <ImagesEditor images={p.images} tint={p.tint} onChange={(images) => set({ images })} />
          </Card>

          <Card title="Tamaños y precios">
            <RowsEditor
              rows={p.sizes}
              onChange={(sizes) => set({ sizes })}
              blank={() => ({ id: '', label: '', servings: '', price: 0 })}
              addLabel="Añadir tamaño"
              columns={[
                { key: 'label', label: 'Tamaño', placeholder: '8" round', width: '1.2fr' },
                { key: 'servings', label: 'Raciones', placeholder: '14–18 servings', width: '1.2fr' },
                { key: 'price', label: 'Precio (USD)', type: 'number', width: '0.8fr' },
              ]}
            />
          </Card>

          <Card title="Sabores" actions={<span className="adm-muted adm-small">Opcional · precio extra si aplica</span>}>
            <RowsEditor
              rows={p.flavors ?? []}
              onChange={(flavors) => set({ flavors })}
              blank={() => ({ label: '', price: 0 })}
              addLabel="Añadir sabor"
              columns={[
                { key: 'label', label: 'Sabor', placeholder: 'Vanilla bean sponge', width: '2fr' },
                { key: 'price', label: 'Extra (USD)', type: 'number', width: '0.8fr' },
              ]}
            />
          </Card>

          <Card title="Decoraciones" actions={<span className="adm-muted adm-small">Opcional · la primera es la opción por defecto</span>}>
            <RowsEditor
              rows={p.decorations ?? []}
              onChange={(decorations) => set({ decorations })}
              blank={() => ({ id: '', label: '', price: 0 })}
              addLabel="Añadir decoración"
              columns={[
                { key: 'label', label: 'Decoración', placeholder: 'Fresh seasonal flowers', width: '2fr' },
                { key: 'price', label: 'Extra (USD)', type: 'number', width: '0.8fr' },
              ]}
            />
          </Card>

          <Card title="Detalles (alérgenos, conservación…)">
            <RowsEditor
              rows={p.details}
              onChange={(details) => set({ details })}
              blank={() => ({ label: '', value: '' })}
              addLabel="Añadir detalle"
              columns={[
                { key: 'label', label: 'Título', placeholder: 'Allergens', width: '0.8fr' },
                { key: 'value', label: 'Texto', width: '2fr' },
              ]}
            />
          </Card>
        </div>

        <aside className="adm-editor__side">
          <Card title="Publicación">
            <div className="stack">
              <Toggle checked={p.active !== false} onChange={(active) => set({ active })} label="Visible en la tienda" />
              <Toggle checked={!!p.bestseller} onChange={(bestseller) => set({ bestseller })} label="Destacado en la portada" />
              <Toggle checked={!!p.message} onChange={(message) => set({ message })} label="Permitir mensaje personalizado" />
            </div>
          </Card>
          <Card title="Pedido">
            <div className="stack">
              <PrepTimeField hours={p.prepHours} onChange={(prepHours) => set({ prepHours })} />
              <Field label="Días de antelación mínima" hint="Con cuántos días de aviso se puede pedir. 0 = para hoy.">
                <input className="input" type="number" min={0} max={60} value={p.leadDays} onChange={(e) => set({ leadDays: Math.max(0, Number(e.target.value)) })} />
              </Field>
              {(p.prepHours ?? 0) > p.leadDays * 24 && (
                <p className="adm-warn">
                  La elaboración ({prepLabel(p.prepHours)}) tarda más que la antelación mínima ({p.leadDays} {p.leadDays === 1 ? 'día' : 'días'}). Los clientes podrían
                  pedir con menos tiempo del necesario: sube los días de antelación.
                </p>
              )}
              <Field label="Etiqueta" hint="Se muestra sobre la foto. Déjala vacía si no quieres ninguna.">
                <input className="input" list="badge-presets" value={p.badge ?? ''} onChange={(e) => set({ badge: e.target.value })} />
                <datalist id="badge-presets">
                  {badgePresets.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </Field>
              <Field label="Color de fondo" hint="Se ve mientras carga la foto.">
                <input className="adm-color" type="color" value={p.tint} onChange={(e) => set({ tint: e.target.value })} />
              </Field>
            </div>
          </Card>
          {!isNew && (
            <button className="adm-link adm-danger" onClick={remove}>
              <Icon name="trash" /> Borrar producto
            </button>
          )}
        </aside>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setP(original)} />
    </>
  );
}

/** Average preparation time, entered in hours or days and stored in hours. */
function PrepTimeField({ hours, onChange }: { hours?: number; onChange: (h: number | undefined) => void }) {
  const [unit, setUnit] = useState<'hours' | 'days'>(hours != null && hours >= 24 && hours % 12 === 0 ? 'days' : 'hours');
  const value = hours == null ? '' : unit === 'days' ? String(hours / 24) : String(hours);
  return (
    <Field label="Tiempo promedio de elaboración" hint={`Lo ven tus clientes en la tienda (${prepLabel(hours)}).`}>
      <div className="adm-inline">
        <input
          className="input"
          type="number"
          min={0}
          step={unit === 'days' ? 0.5 : 1}
          value={value}
          placeholder="Ej. 24"
          onChange={(e) => {
            const n = e.target.value === '' ? undefined : Math.max(0, Number(e.target.value));
            onChange(n == null ? undefined : unit === 'days' ? n * 24 : n);
          }}
        />
        <select className="select" value={unit} onChange={(e) => setUnit(e.target.value as 'hours' | 'days')} aria-label="Unidad">
          <option value="hours">horas</option>
          <option value="days">días</option>
        </select>
      </div>
    </Field>
  );
}

function uniqueIds<T extends { id?: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.map((r) => {
    let id = r.id!;
    let n = 2;
    while (seen.has(id)) id = `${r.id}-${n++}`;
    seen.add(id);
    return { ...r, id };
  });
}

function ImagesEditor({ images, tint, onChange }: { images: string[]; tint: string; onChange: (v: string[]) => void }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue;
        if (f.size > 8 * 1024 * 1024) {
          toast(`${f.name} pesa más de 8 MB`, 'error');
          continue;
        }
        urls.push(await uploadProductImage(f));
      }
      onChange([...images, ...urls]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo subir la foto', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="adm-images">
      <ul>
        {images.map((src, i) => (
          <li key={src + i}>
            <Img src={src} alt="" ratio="4 / 5" width={300} sizes="140px" tint={tint} />
            {i === 0 && <span className="adm-images__main">Principal</span>}
            <div className="adm-images__actions">
              {i > 0 && (
                <button type="button" onClick={() => onChange([src, ...images.filter((_, j) => j !== i)])}>
                  Hacer principal
                </button>
              )}
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label="Quitar foto">
                <Icon name="trash" />
              </button>
            </div>
          </li>
        ))}
        <li>
          <label className="adm-images__upload">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => upload(e.target.files)} disabled={uploading} />
            {uploading ? <span className="spinner" /> : <Icon name="upload" />}
            <span>{uploading ? 'Subiendo…' : 'Subir fotos'}</span>
          </label>
        </li>
      </ul>
      <div className="adm-list__add">
        <input className="input" placeholder="…o pega la URL de una imagen" value={url} onChange={(e) => setUrl(e.target.value)} list="photo-keys" />
        <datalist id="photo-keys">
          {Object.keys(photo).map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => {
            if (!url.trim()) return;
            onChange([...images, url.trim()]);
            setUrl('');
          }}
        >
          Añadir
        </button>
      </div>
      <p className="adm-muted adm-small">La primera foto es la principal. Formato vertical (4:5) recomendado, JPG o WebP de hasta 8 MB.</p>
    </div>
  );
}
