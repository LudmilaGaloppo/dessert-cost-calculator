import IngredientCalculator from './pages/IngredientCalculator';
import RecipeEditor from './pages/RecipeEditor';
import { useState } from 'react';
import PackagingCalculator from './pages/PackagingCalculator';
import { Button } from './components/ui/button';
import { useNavigationGuard } from './components/UnsavedChanges';

/** Navega entre las tres secciones y protege los formularios antes de desmontarlos. */
export default function App() {
  const [page, setPage] = useState<'supplies' | 'recipes' | 'packaging'>('supplies');
  const { requestDiscard, busy } = useNavigationGuard();
  /** Cambia de pantalla después de resolver los cambios pendientes y anuncia el nuevo contenido. */
  function navigate(next: typeof page) {
    if (next === page) return;
    requestDiscard(() => { setPage(next); requestAnimationFrame(() => document.getElementById('main')?.focus()); });
  }
  return <>
    <a href="#main" className="skip-link">Ir al contenido</a>
    <header className="topbar">
      <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">dc</span><span>Desserts Cost</span></a>
      <nav className="page-nav" aria-label="Secciones">
        <Button variant="ghost" disabled={busy} aria-current={page === 'supplies' ? 'page' : undefined} onClick={() => navigate('supplies')}>Insumos</Button>
        <Button variant="ghost" disabled={busy} aria-current={page === 'recipes' ? 'page' : undefined} onClick={() => navigate('recipes')}>Recetas</Button>
        <Button variant="ghost" disabled={busy} aria-current={page === 'packaging' ? 'page' : undefined} onClick={() => navigate('packaging')}>Packaging</Button>
      </nav>
    </header>
    {page === 'supplies' ? <IngredientCalculator /> : page === 'recipes' ? <RecipeEditor /> : <PackagingCalculator />}
  </>;
}
