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
                navigate('/dashboard')
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
                        <div className="relative">
                            <h1 className="text-5xl md:text-6xl text-foreground font-script transform -rotate-6">
                                Asados
                            </h1>
                            <span className="absolute -right-6 -top-2 text-primary">
                                <svg className="w-8 h-8 md:w-10 md:h-10 fill-current" viewBox="0 0 24 24">
                                    <path d="M12,22c4.97,0,9-4.03,9-9c0-4.97-9-13-9-13S3,8.03,3,13C3,17.97,7.03,22,12,22z M12.6,18.8 c-0.6,0.7-1.7,0.6-2.1-0.2c-0.6-1.1-1.3-2.5-0.7-4c0.1-0.2,0.3-0.3,0.5-0.2c0.2,0.1,0.3,0.4,0.2,0.6c-0.5,1.2,0,2.4,0.5,3.3 C11.2,18.7,11.9,19.2,12.6,18.8z"></path>
                                </svg>
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-primary tracking-wide -mt-2 ml-10">
                            Proteina
                        </h2>
                    </div>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Bienvenido de nuevo
                    </p>
                </div>

                <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-soft p-8 space-y-6 border border-gray-100 dark:border-gray-800">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1" htmlFor="email">
                                Correo electrónico
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
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
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
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
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
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
