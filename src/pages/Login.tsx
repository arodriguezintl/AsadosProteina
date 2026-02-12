import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [usePassword, setUsePassword] = useState(true)
    const [loading, setLoading] = useState(false)
    const signIn = useAuthStore(state => state.signIn)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            console.log('Calling signIn...')
            const result = await signIn(email, usePassword ? password : undefined)
            console.log('signIn result:', result)
            const { error } = result

            if (error) {
                alert('Error al ingresar: ' + error.message)
            } else if (!usePassword) {
                alert('¡Revisa tu correo para el link de acceso!')
            } else {
                // Should potentially wait for checkSession to complete via auth listener,
                // but local navigation is good UX.
                navigate('/dashboard')
            }
        } catch (err: any) {
            alert('Error inesperado: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center relative inline-block">
                        Asados Proteína ERP
                        <span className="absolute -top-1 -right-8 text-[10px] bg-blue-500 text-white px-1 rounded-sm">BETA</span>
                    </CardTitle>
                    <CardDescription className="text-center">
                        Ingresa tus credenciales para acceder
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {usePassword && (
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Procesando...' : (usePassword ? 'Iniciar Sesión' : 'Enviar Magic Link')}
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setUsePassword(!usePassword)}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                {usePassword ? 'Ingresar con Magic Link' : 'Ingresar con Contraseña'}
                            </button>
                        </div>

                        <div className="text-xs text-center text-muted-foreground mt-4">
                            * Solo personal autorizado
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
