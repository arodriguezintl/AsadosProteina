import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RecipeService } from '@/services/recipe.service'
import { ProductService } from '@/services/product.service'
import type { Recipe, CreateRecipeDTO, CreateRecipeIngredientDTO } from '@/types/recipes'
import type { Product } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
            setProducts(allProducts.filter(p => !p.name.includes('Materia Prima')))
            setRawMaterials(allProducts)

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
    const margin = (recipe?.product_price || 0) - costPerPortion
    const marginPercent = recipe?.product_price ? (margin / recipe.product_price * 100) : 0

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/recipes')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{id ? 'Editar Receta' : 'Nueva Receta'}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column Stack */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Básicos</CardTitle>
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
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="product">Producto Final (Inventario)</Label>
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
                                    <Label htmlFor="instructions">Instrucciones</Label>
                                    <Input
                                        id="instructions"
                                        value={formData.instructions || ''}
                                        onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {id ? 'Guardar Cambios' : 'Crear Receta'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {id && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Rentabilidad</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Costo Total Receta</div>
                                        <div className="text-xl font-bold">${totalCost.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Rendimiento</div>
                                        <div className="text-xl font-bold">{recipe?.portions} u</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Costo Unitario</div>
                                        <div className="text-xl font-bold text-red-600">${costPerPortion.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Precio Venta</div>
                                        <div className="text-xl font-bold text-blue-600">
                                            {recipe?.product_price ? `$${recipe.product_price.toFixed(2)}` : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {recipe?.product_price && (
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold">Margen Bruto</span>
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${margin.toFixed(2)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {marginPercent.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Ingredients (Only visible if editing) */}
                {id && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Ingredientes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Ingredient Form */}
                            <div className="flex items-end gap-2 p-4 border rounded-md bg-secondary/20">
                                <div className="grid gap-2 flex-1">
                                    <Label>Ingrediente</Label>
                                    <Select
                                        value={newIngredient.product_id}
                                        onValueChange={(val: string) => setNewIngredient({ ...newIngredient, product_id: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Buscar..." />
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
                                <div className="grid gap-2 w-24">
                                    <Label>Cant.</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newIngredient.quantity}
                                        onChange={e => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <Button onClick={handleAddIngredient}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Ingredients List */}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ingrediente</TableHead>
                                        <TableHead>Cant.</TableHead>
                                        <TableHead className="text-right">Costo</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipe?.ingredients?.map(ing => (
                                        <TableRow key={ing.id}>
                                            <TableCell>{ing.product_name}</TableCell>
                                            <TableCell>{ing.quantity} {ing.unit}</TableCell>
                                            <TableCell className="text-right">${(ing.cost || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(ing.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
