import { useState, useEffect } from 'react'
import { ProductService } from '@/services/product.service'
import { RecipeService } from '@/services/recipe.service'
import type { Product } from '@/types/inventory'
import type { Recipe } from '@/types/recipes'
import { calculateIngredientCost } from '@/utils/units'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Calculator, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

export default function RecipeSimulator() {
    const [loading, setLoading] = useState(true)
    const [rawMaterials, setRawMaterials] = useState<Product[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])

    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
    const [simulatedPrice, setSimulatedPrice] = useState<number>(0)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const storeId = '00000000-0000-0000-0000-000000000001'
            const allProducts = await ProductService.getProducts(storeId)
            const materials = allProducts.filter(p => p.category?.type === 'raw_material')
            setRawMaterials(materials)

            const allRecipes = await RecipeService.getRecipes()
            setRecipes(allRecipes)
        } catch (error) {
            console.error('Error loading data for simulator:', error)
        } finally {
            setLoading(false)
        }
    }

    const selectedMaterial = rawMaterials.find(m => m.id === selectedMaterialId)

    // When material changes, reset the simulated price to its current unit_cost
    useEffect(() => {
        if (selectedMaterial) {
            setSimulatedPrice(selectedMaterial.unit_cost || 0)
        } else {
            setSimulatedPrice(0)
        }
    }, [selectedMaterialId, selectedMaterial])

    // Filter recipes that contain the selected material
    const affectedRecipes = recipes.filter(r =>
        r.ingredients?.some(ing => ing.product_id === selectedMaterialId)
    )

    const calculateMetrics = (recipe: Recipe, baseIngredientCostFn: (ingProductId: string, originalCost: number) => number) => {
        const totalCost = recipe.ingredients?.reduce((acc, ing) => {
            const costToUse = baseIngredientCostFn(ing.product_id, ing.unit_cost || 0)
            const lineCost = calculateIngredientCost(ing.quantity, ing.unit, ing.inventory_unit || 'pz', costToUse)
            return acc + lineCost
        }, 0) || 0

        const costPerPortion = recipe.portions ? (totalCost / recipe.portions) : 0

        const directPrice = recipe.product_price || 0
        const directMargin = directPrice - costPerPortion
        const directMarginPct = directPrice ? (directMargin / directPrice) * 100 : 0

        const uberPrice = recipe.product_uber_price || 0
        const uberCommissionPct = recipe.product_uber_commission || 0.30
        const uberNet = uberPrice * (1 - uberCommissionPct)
        const uberMargin = uberNet - costPerPortion
        const uberMarginPct = uberPrice ? (uberMargin / uberPrice) * 100 : 0

        return { costPerPortion, directMargin, directMarginPct, uberMargin, uberMarginPct }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Calculator className="h-8 w-8 text-blue-600" />
                    Simulador de Costos y Márgenes
                </h1>
                <p className="text-muted-foreground mt-1">
                    Proyecta cómo un aumento en el precio del proveedor afecta la rentabilidad de tus platillos.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Configuración</CardTitle>
                        <CardDescription>Elige un insumo y ajusta su precio simulado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Materia Prima a Simular</Label>
                                    <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona insumo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rawMaterials.map(m => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedMaterial && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <div>
                                            <div className="text-sm font-medium text-muted-foreground mb-1">Costo Actual (por {selectedMaterial.unit_of_measure})</div>
                                            <div className="text-xl font-bold">${selectedMaterial.unit_cost?.toFixed(2)}</div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Precio Simulado (Proyección)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-7 text-lg font-semibold text-blue-600"
                                                    value={simulatedPrice === 0 ? '' : simulatedPrice}
                                                    onChange={(e) => setSimulatedPrice(parseFloat(e.target.value) || 0)}
                                                    step="0.5"
                                                />
                                            </div>
                                            {simulatedPrice > (selectedMaterial.unit_cost || 0) ? (
                                                <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                                    <TrendingUp className="h-3 w-3" />
                                                    Aumento del {(((simulatedPrice / (selectedMaterial.unit_cost || 1)) - 1) * 100).toFixed(1)}%
                                                </div>
                                            ) : simulatedPrice < (selectedMaterial.unit_cost || 0) && simulatedPrice > 0 ? (
                                                <div className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                                    <TrendingDown className="h-3 w-3" />
                                                    Ahorro del {((1 - (simulatedPrice / (selectedMaterial.unit_cost || 1))) * 100).toFixed(1)}%
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Impacto en Recetas ({affectedRecipes.length})</CardTitle>
                        <CardDescription>Muestra cómo cambian los márgenes de los platillos que usan este ingrediente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!selectedMaterialId ? (
                            <div className="text-center p-8 text-muted-foreground italic border rounded-md">
                                Selecciona una materia prima para ver los platillos afectados.
                            </div>
                        ) : affectedRecipes.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground italic border rounded-md">
                                Ninguna receta utiliza <strong>{selectedMaterial?.name}</strong>.
                            </div>
                        ) : (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead>Platillo</TableHead>
                                            <TableHead className="text-right">Costo x Porción</TableHead>
                                            <TableHead className="text-right">Margen Directo</TableHead>
                                            <TableHead className="text-right">Margen Uber</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {affectedRecipes.map(recipe => {
                                            const current = calculateMetrics(recipe, (_id, originalCost) => originalCost)
                                            const simulated = calculateMetrics(recipe, (id, originalCost) => id === selectedMaterialId ? simulatedPrice : originalCost)

                                            // Format helper
                                            const Trend = ({ cur, sim, inverse = false }: { cur: number, sim: number, inverse?: boolean }) => {
                                                const diff = sim - cur
                                                if (Math.abs(diff) < 0.01) return null
                                                const isBad = inverse ? diff > 0 : diff < 0
                                                const Icon = diff > 0 ? TrendingUp : TrendingDown
                                                return (
                                                    <div className={`flex items-center justify-end gap-1 text-xs ${isBad ? 'text-red-500' : 'text-green-500'}`}>
                                                        <Icon className="h-3 w-3" />
                                                        ${Math.abs(diff).toFixed(2)}
                                                    </div>
                                                )
                                            }

                                            return (
                                                <TableRow key={recipe.id}>
                                                    <TableCell className="font-medium">{recipe.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-sm line-through text-muted-foreground">${current.costPerPortion.toFixed(2)}</div>
                                                        <div className="font-semibold flex items-center justify-end gap-1">
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            ${simulated.costPerPortion.toFixed(2)}
                                                        </div>
                                                        <Trend cur={current.costPerPortion} sim={simulated.costPerPortion} inverse={true} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-sm line-through text-muted-foreground">${current.directMargin.toFixed(2)}</div>
                                                        <div className="font-semibold flex items-center justify-end gap-1">
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            ${simulated.directMargin.toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{simulated.directMarginPct.toFixed(1)}%</div>
                                                        <Trend cur={current.directMargin} sim={simulated.directMargin} />
                                                    </TableCell>
                                                    <TableCell className="text-right bg-muted/10">
                                                        <div className="text-sm line-through text-muted-foreground">${current.uberMargin.toFixed(2)}</div>
                                                        <div className="font-semibold flex items-center justify-end gap-1">
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            ${simulated.uberMargin.toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{simulated.uberMarginPct.toFixed(1)}%</div>
                                                        <Trend cur={current.uberMargin} sim={simulated.uberMargin} />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
