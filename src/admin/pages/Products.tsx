import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Icon } from '../../components/Icon';
import { Img } from '../../components/Img';
import { useCatalog } from '../../context/CatalogContext';
import { fromPrice, type Product } from '../../data/products';
import { listCategories, listProducts, reorderProducts, saveProduct } from '../../lib/adminApi';
import { Badge, Empty, ErrorNote, Loading, money, MoveButtons, move, PageTitle, Toggle, useLoad, useToast } from '../ui';

export default function Products() {
  const { data, setData, error, loading, reload } = useLoad(async () => {
    const [products, categories] = await Promise.all([listProducts(), listCategories()]);
    return { products, categories };
  });
  const { reload: reloadStore } = useCatalog();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.products ?? []).filter((p) => (cat === 'all' || p.category === cat) && (!t || p.name.toLowerCase().includes(t)));
  }, [data, q, cat]);

  const canReorder = cat === 'all' && !q;

  const toggleActive = async (p: Product, active: boolean) => {
    const next = { ...p, active };
    try {
      await saveProduct(next, p.slug);
      setData((d) => d && { ...d, products: d.products.map((x) => (x.slug === p.slug ? next : x)) });
      reloadStore();
      toast(active ? `${p.name} ya está visible en la tienda` : `${p.name} se ha ocultado de la tienda`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  };

  const reorder = async (from: number, to: number) => {
    if (!data) return;
    const products = move(data.products, from, to);
    setData({ ...data, products });
    try {
      await reorderProducts(products.map((p) => p.slug));
      reloadStore();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
      reload();
    }
  };

  const catName = (id: string) => data?.categories.find((c) => c.id === id)?.name ?? id;

  return (
    <>
      <PageTitle
        title="Productos"
        subtitle="Tus pasteles y dulces. Desactiva un producto para ocultarlo sin borrarlo."
        actions={
          <Link to="nuevo" className="btn btn--sm">
            <Icon name="plus" /> Nuevo producto
          </Link>
        }
      />

      <div className="adm-toolbar">
        <select className="select adm-select-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtrar por categoría">
          <option value="all">Todas las categorías</option>
          {data?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input className="input adm-search" type="search" placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <Empty>No hay productos. Crea el primero con “Nuevo producto”.</Empty>
      ) : (
        <ul className="adm-products">
          {filtered.map((p) => {
            const index = data!.products.indexOf(p);
            return (
              <li key={p.slug} className={p.active === false ? 'is-off' : ''}>
                <button className="adm-products__main" onClick={() => navigate(p.slug)}>
                  <Img src={p.images[0] ?? ''} alt="" ratio="1 / 1" width={160} sizes="64px" tint={p.tint} />
                  <span>
                    <strong>{p.name}</strong>
                    <span className="adm-muted adm-small">
                      {catName(p.category)} · desde {money(fromPrice(p))} · {p.sizes.length} tamaño(s)
                    </span>
                    <span className="adm-badges">
                      {p.bestseller && <Badge tone="gold">Destacado</Badge>}
                      {p.badge && <Badge>{p.badge}</Badge>}
                      {p.active === false && <Badge tone="danger">Oculto</Badge>}
                    </span>
                  </span>
                </button>
                <div className="adm-products__side">
                  <Toggle checked={p.active !== false} onChange={(v) => toggleActive(p, v)} label="Visible" />
                  {canReorder && <MoveButtons index={index} length={data!.products.length} onMove={(to) => reorder(index, to)} />}
                  <Link to={p.slug} className="icon-btn" aria-label={`Editar ${p.name}`}>
                    <Icon name="chevronRight" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {canReorder && filtered.length > 1 && <p className="adm-muted adm-small">Usa las flechas para cambiar el orden en que aparecen en la tienda.</p>}
    </>
  );
}
