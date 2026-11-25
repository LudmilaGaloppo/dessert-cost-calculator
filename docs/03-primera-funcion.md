# Función de costo de un ingrediente

`calculateIngredientCost` calcula cuánto aporta a una receta la cantidad utilizada de un insumo. Se implementa en [frontend/src/domain/costs.ts](../frontend/src/domain/costs.ts), independientemente de React y MongoDB.

## Contrato

```ts
calculateIngredientCost(supply: Supply, ingredient: RecipeIngredient): number
```

La función recibe una referencia de compra y el uso de ese insumo. Verifica que los identificadores coincidan, convierte la cantidad utilizada a la unidad de compra y aplica la proporción.

## Ejemplo de llamada

```ts
const supply = {
  id: 'flour',
  name: 'Harina',
  purchaseQuantity: 2.5,
  purchaseUnit: 'kg' as const,
  purchasePrice: 6000,
};

const ingredient = {
  supplyId: 'flour',
  quantity: 375,
  unit: 'g' as const,
};

const cost = calculateIngredientCost(supply, ingredient);
// cost: 900
```

Los identificadores son ilustrativos para la función de dominio. Los registros persistidos reciben identificadores de MongoDB desde la API.

## Responsabilidades

1. Comprobar que el ingrediente referencia el insumo recibido.
2. Validar precio y cantidad comprada.
3. Convertir la cantidad utilizada entre unidades compatibles.
4. Calcular y devolver el importe proporcional.

La función lanza un error cuando los datos son inválidos. No modifica los objetos de entrada ni persiste resultados.

## Presentación del resultado

El valor devuelto es un número, sin símbolo monetario. La interfaz aplica `Intl.NumberFormat` para mostrar pesos argentinos con dos decimales. Los cálculos conservan su precisión hasta esa presentación.

Esta separación permite reutilizar la regla en el cálculo de una receta y verificarla mediante pruebas sin montar la interfaz. Ver [cálculo de ingredientes de una receta](04-calculo-de-receta.md).
