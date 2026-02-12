import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Login() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const signIn = useAuthStore(state => state.signIn)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await signIn(email)
        setLoading(false)

        if (error) {
            alert('Error en login: ' + error.message)
        } else {
            alert('¡Revisa tu correo para el link de acceso!')
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Asados Proteína ERP</CardTitle>
                    <CardDescription className="text-center">
                        Ingresa tu correo para acceder al sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Enviando link...' : 'Ingresar con Magic Link'}
                        </Button>
                        <div className="text-xs text-center text-muted-foreground">
                            * Solo personal autorizado
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
