import { useEffect, useState, type FormEvent } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import type { BusinessSettings, Settings, StoreSettings } from '../../data/settings';
import { getSettings, saveSettings, updatePassword } from '../../lib/adminApi';
import { Card, ErrorNote, Field, Loading, PageTitle, RowsEditor, SaveBar, StringListEditor, useToast } from '../ui';

export default function SettingsPage() {
  const [original, setOriginal] = useState<Settings | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload, demo } = useCatalog();

  useEffect(() => {
    getSettings()
      .then((x) => {
        setOriginal(x);
        setS(x);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!s || !original) return <Loading />;

  const b = s.business;
  const st = s.store;
  const setB = (patch: Partial<BusinessSettings>) => setS({ ...s, business: { ...b, ...patch } });
  const setAddr = (patch: Partial<BusinessSettings['address']>) => setB({ address: { ...b.address, ...patch } });
  const setSt = (patch: Partial<StoreSettings>) => setS({ ...s, store: { ...st, ...patch } });

  const businessDirty = JSON.stringify(b) !== JSON.stringify(original.business);
  const storeDirty = JSON.stringify(st) !== JSON.stringify(original.store);

  async function save() {
    if (!st.pickupSlots.length) return toast('Añade al menos un horario de recogida.', 'error');
    setSaving(true);
    try {
      if (businessDirty) await saveSettings('business', b);
      if (storeDirty) await saveSettings('store', st);
      setOriginal(s);
      reload();
      toast('Ajustes guardados');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Ajustes de la tienda" subtitle="Datos de contacto, horarios, entregas y redes sociales que se muestran en la web." />

      <div className="adm-stack-lg">
        <Card title="Contacto">
          <div className="adm-form-grid">
            <Field label="Email">
              <input className="input" type="email" value={b.email} onChange={(e) => setB({ email: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <input className="input" value={b.phone} onChange={(e) => setB({ phone: e.target.value })} />
            </Field>
            <Field label="Dirección" wide>
              <input className="input" value={b.address.street} onChange={(e) => setAddr({ street: e.target.value })} />
            </Field>
            <Field label="Ciudad">
              <input className="input" value={b.address.city} onChange={(e) => setAddr({ city: e.target.value })} />
            </Field>
            <Field label="Estado / provincia">
              <input className="input" value={b.address.region} onChange={(e) => setAddr({ region: e.target.value })} />
            </Field>
            <Field label="Código postal">
              <input className="input" value={b.address.postal} onChange={(e) => setAddr({ postal: e.target.value })} />
            </Field>
            <Field label="País (código)" hint="Ej. US, MX, ES">
              <input className="input" maxLength={2} value={b.address.country} onChange={(e) => setAddr({ country: e.target.value.toUpperCase() })} />
            </Field>
          </div>
        </Card>

        <Card title="Horario de apertura">
          <RowsEditor
            rows={b.hours}
            onChange={(hours) => setB({ hours })}
            blank={() => ({ days: '', time: '' })}
            addLabel="Añadir fila"
            columns={[
              { key: 'days', label: 'Días', placeholder: 'Tuesday – Friday', width: '1fr' },
              { key: 'time', label: 'Horario', placeholder: '9:00 – 18:00', width: '1fr' },
            ]}
          />
        </Card>

        <Card title="Entregas y recogidas">
          <div className="adm-form-grid">
            <Field label="Coste del envío (USD)">
              <input className="input" type="number" min={0} step="any" value={st.deliveryFee} onChange={(e) => setSt({ deliveryFee: Number(e.target.value) })} />
            </Field>
            <Field label="Envío gratis a partir de (USD)">
              <input className="input" type="number" min={0} step="any" value={st.freeDeliveryOver} onChange={(e) => setSt({ freeDeliveryOver: Number(e.target.value) })} />
            </Field>
            <Field label="Zona de reparto (inglés)" hint="Texto que ven los clientes, p. ej. “within 15 miles of the studio”." wide>
              <input className="input" value={st.deliveryRadius} onChange={(e) => setSt({ deliveryRadius: e.target.value })} />
            </Field>
            <Field label="Zona de reparto (español)" hint="Se muestra cuando el cliente elige ES, p. ej. “a menos de 15 millas del estudio”." wide>
              <input className="input" value={st.deliveryRadiusEs ?? ''} onChange={(e) => setSt({ deliveryRadiusEs: e.target.value })} />
            </Field>
          </div>
          <div className="adm-grid-2 adm-mt">
            <div>
              <p className="adm-field__label">Horarios de recogida</p>
              <StringListEditor value={st.pickupSlots} onChange={(pickupSlots) => setSt({ pickupSlots })} placeholder="17:00 – 19:00" />
            </div>
            <div>
              <p className="adm-field__label">Franjas de envío</p>
              <StringListEditor value={st.deliverySlots} onChange={(deliverySlots) => setSt({ deliverySlots })} placeholder="18:00 – 20:00" />
            </div>
          </div>
          <p className="adm-muted adm-small">Los días de cierre semanal se configuran en Disponibilidad.</p>
        </Card>

        <Card title="Redes sociales y anuncio">
          <div className="adm-form-grid">
            <Field label="Instagram (URL)">
              <input className="input" value={b.instagram} onChange={(e) => setB({ instagram: e.target.value })} />
            </Field>
            <Field label="Usuario de Instagram">
              <input className="input" value={b.handle} onChange={(e) => setB({ handle: e.target.value })} placeholder="@sweetdaisy" />
            </Field>
            <Field label="Facebook (URL)">
              <input className="input" value={b.facebook} onChange={(e) => setB({ facebook: e.target.value })} />
            </Field>
            <Field label="TikTok (URL)">
              <input className="input" value={b.tiktok} onChange={(e) => setB({ tiktok: e.target.value })} />
            </Field>
            <Field label="Texto de la barra superior (inglés)" hint="Se muestra junto al aviso de envío gratis. Déjalo vacío para ocultarlo." wide>
              <input className="input" value={b.announcement} onChange={(e) => setB({ announcement: e.target.value })} />
            </Field>
            <Field label="Texto de la barra superior (español)" hint="Se muestra cuando el cliente elige ES. Vacío = se usa el texto en inglés." wide>
              <input className="input" value={b.announcementEs ?? ''} onChange={(e) => setB({ announcementEs: e.target.value })} />
            </Field>
          </div>
        </Card>

        {!demo && <PasswordCard />}
      </div>

      <SaveBar dirty={businessDirty || storeDirty} saving={saving} onSave={save} onReset={() => setS(original)} />
    </>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast('La contraseña debe tener al menos 8 caracteres.', 'error');
    setBusy(true);
    try {
      await updatePassword(pw);
      setPw('');
      toast('Contraseña actualizada');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Tu cuenta">
      <form className="adm-list__add" onSubmit={onSubmit}>
        <input className="input" type="password" autoComplete="new-password" placeholder="Nueva contraseña" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn btn--outline btn--sm" disabled={busy}>
          Cambiar contraseña
        </button>
      </form>
    </Card>
  );
}
