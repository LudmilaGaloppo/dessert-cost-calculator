import { Plus, RefreshCw } from 'lucide-react';
import SearchableSelect, { type SearchableOption } from './SearchableSelect';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface CatalogPickerProps {
  title: string; label: string; createLabel: string; id: string; value: string;
  options: readonly SearchableOption[]; loading: boolean; disabled: boolean;
  onSelect(value: string): void; onCreate(): void; onRefresh(): void;
}

/** Ubica el buscador, la actualización y la creación en el mismo lugar para los tres catálogos. */
export default function CatalogPicker({ title, label, createLabel, id, value, options, loading, disabled, onSelect, onCreate, onRefresh }: CatalogPickerProps) {
  return <Card className="catalog-picker">
    <div className="card-heading"><h2>{title}</h2><Button type="button" variant="ghost" disabled={disabled || loading} onClick={onRefresh}><RefreshCw aria-hidden="true" />Actualizar</Button></div>
    <div className="catalog-picker-controls"><label className="field" htmlFor={id}>{label}
      <SearchableSelect id={id} value={value} options={options} onChange={onSelect} disabled={disabled || loading} placeholder="Escribí para buscar" />
    </label><Button type="button" disabled={disabled || loading} onClick={onCreate}><Plus aria-hidden="true" />{createLabel}</Button></div>
    {loading && <p className="section-help" role="status">Cargando catálogo…</p>}
    {!loading && options.length === 0 && <p className="section-help">Todavía no hay registros. Empezá con «{createLabel}».</p>}
  </Card>;
}
