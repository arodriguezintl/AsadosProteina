import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuthStore()
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            console.log('Calling signIn...')
            const result = await signIn(email, password)
            console.log('signIn result:', result)
            const { error } = result

            if (error) {
                alert('Error al ingresar: ' + error.message)
            } else {
                navigate('/dashboard')
            }
        } catch (err: any) {
            alert('Error inesperado: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#0B2B26] p-4 font-sans">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo Section */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-[#C1FF72] tracking-tighter">
                        Asados P.
                        <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-sm ml-2 align-middle font-bold tracking-normal">BETA</span>
                    </h1>
                    <p className="text-white/60 text-sm font-medium tracking-wide uppercase">Enterprise Resource Planning</p>
                </div>

                {/* Login Card */}
                <Card className="border-0 shadow-2xl bg-white/5 backdrop-blur-xl text-white ring-1 ring-white/10">
                    <CardHeader className="space-y-1 pb-6 pt-8">
                        <CardTitle className="text-2xl font-bold text-center tracking-tight">Bienvenido</CardTitle>
                        <CardDescription className="text-center text-white/50 text-xs uppercase tracking-wider font-semibold">
                            Ingresa tus credenciales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-8">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-white/30 group-focus-within:text-[#C1FF72] transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 bg-black/20 border-white/5 text-white placeholder:text-white/20 focus:border-[#C1FF72]/50 focus:ring-[#C1FF72]/20 h-11 transition-all rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-white/30 group-focus-within:text-[#C1FF72] transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="Contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 bg-black/20 border-white/5 text-white placeholder:text-white/20 focus:border-[#C1FF72]/50 focus:ring-[#C1FF72]/20 h-11 transition-all rounded-xl"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-[#C1FF72] hover:bg-[#b0ef5d] text-[#0B2B26] font-extrabold h-12 shadow-lg hover:shadow-xl hover:shadow-[#C1FF72]/20 transition-all rounded-xl mt-2 text-base"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-[#0B2B26]/30 border-t-[#0B2B26] rounded-full animate-spin"></div>
                                        Validando...
                                    </span>
                                ) : 'INICIAR SESIÓN'}
                            </Button>

                            <p className="text-[10px] text-center text-white/20 mt-8 font-mono">
                                ID: {new Date().toISOString().split('T')[0]} • REV-2.4
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
