/**
 * Utility functions for measuring and converting recipe ingredients.
 * The system supports exact grammage, ml, and piece conversions.
 * Base inventory units:
 * - 'kg' or 'kilo'
 * - 'L' or 'litro'
 * - 'pz' or 'pieza'
 */

export function calculateIngredientCost(quantity: number, recipeUnit: string, inventoryUnit: string, unitCost: number): number {
    const rUnit = recipeUnit.toLowerCase().trim()
    const iUnit = inventoryUnit.toLowerCase().trim()

    // Weight conversions (Recipe in G, Inventory in KG)
    if ((rUnit === 'g' || rUnit === 'gr' || rUnit === 'gramo' || rUnit === 'gramos') && (iUnit === 'kg' || iUnit === 'kilo' || iUnit === 'kilos')) {
        return (quantity / 1000) * unitCost
    }

    // Weight conversions (Recipe in KG, Inventory in G - less likely but possible)
    if ((rUnit === 'kg' || rUnit === 'kilo') && (iUnit === 'g' || iUnit === 'gr')) {
        return (quantity * 1000) * unitCost
    }

    // Volume conversions (Recipe in ML, Inventory in L)
    if ((rUnit === 'ml' || rUnit === 'mililitro' || rUnit === 'mililitros') && (iUnit === 'l' || iUnit === 'litro' || iUnit === 'litros')) {
        return (quantity / 1000) * unitCost
    }

    // Exact matches (pz=pz, kg=kg, g=g, L=L) or unrecognized units defaults to 1:1
    return quantity * unitCost
}

export function formatUnit(unit: string): string {
    const u = unit.toLowerCase().trim()
    if (u === 'g' || u === 'gr' || u === 'gramo' || u === 'gramos') return 'g'
    if (u === 'kg' || u === 'kilo' || u === 'kilos') return 'kg'
    if (u === 'ml' || u === 'mililitro' || u === 'mililitros') return 'ml'
    if (u === 'l' || u === 'litro' || u === 'litros') return 'L'
    if (u === 'pz' || u === 'pza' || u === 'pieza' || u === 'piezas') return 'pz'
    return unit
}
