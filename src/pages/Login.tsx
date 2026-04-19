import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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
                // Get the updated role from the store state
                const currentRole = useAuthStore.getState().role
                if (currentRole === 'external_client') {
                    navigate('/pos')
                } else {
                    navigate('/dashboard')
                }
            }
        } catch (err: any) {
            alert('Error inesperado: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background min-h-[max(884px,100dvh)] flex flex-col items-center justify-center p-6 transition-colors duration-300 font-sans text-foreground">
            {/* Opcional: El darkMode toggle está omitido o podrías importarlo si existe en el proyecto */}
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="inline-flex flex-col items-center justify-center">
                        <img src="/src/assets/logo.jpg" alt="Asados Proteina Logo" className="h-24 w-auto mb-4 rounded-2xl shadow-lg border-2 border-orange-100" />
                        <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">
                            Asados<span className="text-primary italic">Proteína</span>
                        </h1>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground font-medium">
                        Sistema de Gestión Empresarial
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-soft p-8 space-y-6 border border-gray-100">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1" htmlFor="email">
                                Correo electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                                    id="email"
                                    name="email"
                                    placeholder="nombre@ejemplo.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </div>
                            </div>
                        </div>



                        <button
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-glow text-sm font-semibold text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : null}
                            {loading ? 'Validando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-primary to-orange-600"></div>
        </div>
    )
}
