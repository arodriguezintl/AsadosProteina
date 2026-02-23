import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RecipeService } from '@/services/recipe.service'
import { ProductService } from '@/services/product.service'
import type { Recipe, CreateRecipeDTO, CreateRecipeIngredientDTO } from '@/types/recipes'
import type { Product } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Plus, Trash2, Save, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

export default function RecipeForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [rawMaterials, setRawMaterials] = useState<Product[]>([])

    // Form state for creating recipe
    const [formData, setFormData] = useState<CreateRecipeDTO>({
        name: '',
        product_id: '',
        portions: 1,
        instructions: ''
    })

    // Form state for adding ingredient
    const [newIngredient, setNewIngredient] = useState<CreateRecipeIngredientDTO>({
        recipe_id: '',
        product_id: '',
        quantity: 1,
        unit: 'kg'
    })

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load all products to select 'Final Product' and 'Ingredients'
            const storeId = '00000000-0000-0000-0000-000000000001'
            const allProducts = await ProductService.getProducts(storeId)

            // Filter products for "Final Product" selection (finished products or no category)
            setProducts(allProducts.filter(p => !p.category || p.category.type === 'finished_product'))

            // Filter raw materials (ingredients) - STRICTLY only category type 'raw_material'
            const filteredRaw = allProducts.filter(p => p.category?.type === 'raw_material')
            setRawMaterials(filteredRaw)

            if (id) {
                const data = await RecipeService.getRecipeById(id)
                setRecipe(data)
                setFormData({
                    name: data.name,
                    product_id: data.product_id,
                    portions: data.portions,
                    instructions: data.instructions
                })
                setNewIngredient(prev => ({ ...prev, recipe_id: id }))
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (id) {
                await RecipeService.updateRecipe(id, formData)
                const updated = await RecipeService.getRecipeById(id)
                setRecipe(updated)
                alert("Receta actualizada correctamente")
            } else {
                const newRecipe = await RecipeService.createRecipe(formData)
                navigate(`/recipes/${newRecipe.id}`)
            }
        } catch (error) {
            console.error('Error saving recipe:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddIngredient = async () => {
        if (!newIngredient.product_id) return
        try {
            await RecipeService.addIngredient(newIngredient)
            if (id) {
                const updated = await RecipeService.getRecipeById(id)
                setRecipe(updated)
            }
            setNewIngredient(prev => ({ ...prev, product_id: '', quantity: 1 }))
        } catch (error) {
            console.error('Error adding ingredient:', error)
        }
    }

    const handleRemoveIngredient = async (ingredientId: string) => {
        try {
            await RecipeService.removeIngredient(ingredientId)
            if (id) {
                const updated = await RecipeService.getRecipeById(id)
                setRecipe(updated)
            }
        } catch (error) {
            console.error('Error removing ingredient:', error)
        }
    }

    const totalCost = recipe?.ingredients?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0
    const costPerPortion = recipe?.portions ? (totalCost / recipe.portions) : 0

    // Direct Sale
    const directPrice = recipe?.product_price || 0
    const directMargin = directPrice - costPerPortion
    const directMarginPercent = directPrice ? (directMargin / directPrice * 100) : 0

    // Uber Apps
    const uberPrice = recipe?.product_uber_price || 0
    const uberCommissionPct = recipe?.product_uber_commission || 0.30
    const uberNetIncome = uberPrice * (1 - uberCommissionPct)
    const uberMargin = uberNetIncome - costPerPortion
    const uberMarginPercent = uberPrice ? (uberMargin / uberPrice * 100) : 0

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/recipes')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">{id ? `Receta: ${formData.name}` : 'Nueva Receta'}</h1>
                </div>
                {id && (
                    <Button onClick={handleCreateUpdate} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Todo
                    </Button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Basic Info & Cost */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Datos Básicos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                Datos Básicos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateUpdate} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre de Receta</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ej: Lunch de Pollo"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="portions">Porciones (Rendimiento)</Label>
                                    <Input
                                        type="number"
                                        id="portions"
                                        value={formData.portions}
                                        onChange={e => setFormData({ ...formData, portions: parseInt(e.target.value) })}
                                        min={1}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="product">Producto Final Relacionado (Inventario)</Label>
                                    <Select
                                        value={formData.product_id}
                                        onValueChange={(val: string) => setFormData({ ...formData, product_id: val })}
                                        disabled={!!id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar producto..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Este es el producto cuyo stock se descontará automáticamente al vender.</p>
                                </div>

                                {!id && (
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Crear Receta y Continuar
                                    </Button>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Rentabilidad */}
                    {id && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen Financiero</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-md">
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase">Costo Total</div>
                                        <div className="text-lg font-bold">${totalCost.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase">Costo x Porción</div>
                                        <div className="text-lg font-bold text-red-600">${costPerPortion.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    {/* Direct Sale */}
                                    <div className="border rounded-md p-3">
                                        <div className="font-semibold text-sm mb-2">Venta Directa</div>
                                        {directPrice ? (
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Precio Venta</span>
                                                    <span>${directPrice.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-green-700">Utilidad Bruta</span>
                                                    <div className="text-right">
                                                        <span className="text-green-600">${directMargin.toFixed(2)}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">({directMarginPercent.toFixed(1)}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-amber-600">Sin precio asignado</div>
                                        )}
                                    </div>

                                    {/* Uber/Apps */}
                                    <div className="border rounded-md p-3">
                                        <div className="font-semibold text-sm mb-2">Plataformas (Uber/Didi)</div>
                                        {uberPrice ? (
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Precio App</span>
                                                    <span>${uberPrice.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground text-xs">
                                                    <span>- Comisión ({(uberCommissionPct * 100).toFixed(0)}%)</span>
                                                    <span className="text-red-500">-${(uberPrice * uberCommissionPct).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between pt-1 border-t font-medium">
                                                    <span className="text-green-700">Utilidad Neta</span>
                                                    <div className="text-right">
                                                        <span className={uberMargin > 0 ? "text-green-600" : "text-red-600"}>${uberMargin.toFixed(2)}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">({uberMarginPercent.toFixed(1)}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-amber-600">Sin precio de plataforma asignado en inventario.</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Ingredients & Instructions */}
                {id && (
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ingredients */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ingredientes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add Ingredient Form */}
                                <div className="flex items-end gap-2 p-3 border rounded-md bg-muted/50">
                                    <div className="grid gap-2 flex-1 text-sm">
                                        <Label>Materia Prima</Label>
                                        <Select
                                            value={newIngredient.product_id}
                                            onValueChange={(val: string) => setNewIngredient({ ...newIngredient, product_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Buscar ingrediente..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {rawMaterials.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} ({p.unit_of_measure}) - ${p.unit_cost}/u
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2 w-20 text-sm">
                                        <Label>Cant.</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={newIngredient.quantity}
                                            onChange={e => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2 w-24 text-sm">
                                        <Label>Unidad</Label>
                                        <Select
                                            value={newIngredient.unit}
                                            onValueChange={(val: string) => setNewIngredient({ ...newIngredient, unit: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Unidad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="kg">kg</SelectItem>
                                                <SelectItem value="g">g (gramo)</SelectItem>
                                                <SelectItem value="L">L</SelectItem>
                                                <SelectItem value="ml">ml</SelectItem>
                                                <SelectItem value="pz">pieza</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAddIngredient} size="icon">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Ingredients List */}
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead>Ingrediente</TableHead>
                                                <TableHead className="text-center">Cant.</TableHead>
                                                <TableHead className="text-right">Costo</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(!recipe?.ingredients || recipe.ingredients.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground italic">
                                                        No hay ingredientes agregados.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                recipe.ingredients.map(ing => (
                                                    <TableRow key={ing.id}>
                                                        <TableCell className="font-medium text-sm">{ing.product_name}</TableCell>
                                                        <TableCell className="text-center text-sm">{ing.quantity} {ing.unit}</TableCell>
                                                        <TableCell className="text-right text-sm">${(ing.cost || 0).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(ing.id)} className="h-8 w-8 text-red-400 hover:text-red-600">
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Instrucciones de Preparación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <Label htmlFor="instructions" className="sr-only">Instrucciones</Label>
                                    <Textarea
                                        id="instructions"
                                        placeholder="Describe los pasos para preparar esta receta..."
                                        className="min-h-[200px] resize-none"
                                        value={formData.instructions || ''}
                                        onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                        * Los cambios en las instrucciones se guardan al hacer clic en "Guardar Todo".
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
