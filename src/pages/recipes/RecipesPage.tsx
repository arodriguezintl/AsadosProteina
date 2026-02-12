import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RecipeService } from '@/services/recipe.service'
import type { Recipe } from '@/types/recipes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Search, ChefHat } from 'lucide-react'

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadRecipes()
    }, [])

    const loadRecipes = async () => {
        try {
            const data = await RecipeService.getRecipes()
            setRecipes(data)
        } catch (error) {
            console.error('Error loading recipes:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Recetas</h1>
                    <p className="text-muted-foreground">Gestión de recetas y costos</p>
                </div>
                <Button asChild>
                    <Link to="/recipes/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Receta
                    </Link>
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar recetas..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Producto Final</TableHead>
                            <TableHead>Porciones</TableHead>
                            <TableHead>Costo Total</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredRecipes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron recetas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRecipes.map((recipe) => (
                                <TableRow key={recipe.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <ChefHat className="h-4 w-4 text-orange-500" />
                                        {recipe.name}
                                    </TableCell>
                                    <TableCell>{recipe.product_name || 'N/A'}</TableCell>
                                    <TableCell>{recipe.portions}</TableCell>
                                    <TableCell>
                                        {/* Sum ingredients cost */}
                                        ${recipe.ingredients?.reduce((acc, curr) => acc + (curr.cost || 0), 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to={`/recipes/${recipe.id}`}>Ver / Editar</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
