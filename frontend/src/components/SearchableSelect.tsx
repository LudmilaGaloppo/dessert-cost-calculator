import { useId } from 'react';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from './ui/combobox';

export interface SearchableOption { value: string; label: string; searchText?: string }
interface SearchableSelectProps {
  value: string; options: readonly SearchableOption[]; onChange(value: string): void;
  placeholder: string; emptyOption?: string; disabled?: boolean;
  invalid?: boolean; describedBy?: string; id?: string;
}

/** Normaliza mayúsculas y tildes para buscar nombres y detalles del catálogo. */
function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

/** Reutiliza el combobox de shadcn: flechas, Enter, Escape, foco y selección accesibles. */
export default function SearchableSelect({ value, options, onChange, placeholder, emptyOption, disabled = false, invalid = false, describedBy, id }: SearchableSelectProps) {
  const generatedId = useId();
  const items = emptyOption ? [{ value: '', label: emptyOption }, ...options] : [...options];
  return <Combobox<SearchableOption> items={items} value={items.find((item) => item.value === value) ?? null}
    onValueChange={(item) => { if (item) onChange(item.value); }}
    isItemEqualToValue={(item, selected) => item.value === selected.value}
    filter={(item, query) => normalizeSearch(item.label + ' ' + (item.searchText ?? '')).includes(normalizeSearch(query.trim()))}
    disabled={disabled}>
    <ComboboxInput id={id ?? generatedId} placeholder={placeholder} aria-invalid={invalid} aria-describedby={describedBy} showTrigger={false} />
    <ComboboxContent><ComboboxEmpty>No encontramos coincidencias.</ComboboxEmpty>
      <ComboboxList>{(item: SearchableOption) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList>
    </ComboboxContent>
  </Combobox>;
}