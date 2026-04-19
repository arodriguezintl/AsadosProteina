import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Mail, Eye, EyeOff } from 'lucide-react'

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
        <div className="bg-[#f4f6f8] text-slate-900 font-sans min-h-screen flex items-center justify-center relative overflow-hidden antialiased selection:bg-[#ff6b00]/20 selection:text-[#ff6b00]">
            {/* Background decorative element */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff6b00]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff6b00]/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="relative z-10 w-full max-w-[440px] px-6 py-12">
                {/* Glassmorphism Card (Frosted Light) */}
                <div className="bg-white/70 backdrop-blur-[20px] rounded-2xl p-10 shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-white/60 flex flex-col items-center">
                    
                    {/* Brand Identity */}
                    <div className="mb-12 flex flex-col items-center w-full">
                        <img 
                            src="/src/assets/logo.jpg" 
                            alt="Asados Proteina" 
                            className="h-28 w-auto object-contain rounded-2xl shadow-sm border border-orange-50" 
                        />
                    </div>

                    {/* Transactional Form */}
                    <form onSubmit={handleLogin} className="w-full space-y-10">
                        {/* Input Fields Container */}
                        <div className="space-y-6">
                            
                            {/* Email Input Group */}
                            <div className="relative group">
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        className="w-full bg-transparent text-slate-900 border-0 border-b border-slate-200 px-0 py-3 focus:ring-0 focus:border-[#ff6b00] focus:border-b-2 transition-all placeholder:text-slate-300 text-base"
                                        id="email"
                                        name="email"
                                        placeholder="chef@asados.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Mail className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#ff6b00] transition-colors" />
                                </div>
                            </div>

                            {/* Password Input Group */}
                            <div className="relative group">
                                <div className="flex justify-between items-baseline mb-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400" htmlFor="password">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        className="w-full bg-transparent text-slate-900 border-0 border-b border-slate-200 px-0 py-3 focus:ring-0 focus:border-[#ff6b00] focus:border-b-2 transition-all placeholder:text-slate-300 text-base tracking-widest"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Forgotten Password Link */}
                                <div className="mt-4 text-right">
                                    <a className="text-[11px] font-medium text-slate-400 hover:text-[#ff6b00] transition-colors inline-block pb-0.5 border-b border-transparent hover:border-[#ff6b00]/30" href="#">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Primary CTA (Ember Gradient) */}
                        <div className="pt-2">
                            <button 
                                className="w-full relative overflow-hidden group bg-[#ff6b00] text-white font-bold uppercase tracking-[0.15em] text-xs py-5 rounded shadow-[0_15px_30px_rgba(255,107,0,0.15)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(255,107,0,0.25)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                                type="submit"
                                disabled={loading}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? 'Validando...' : 'Ingresar'}
                                    <span className="material-symbols-outlined text-[18px]">
                                        {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'login'}
                                    </span>
                                </span>
                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Subtle bottom accent line */}
            <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff6b00]/30 to-transparent" />
        </div>
    )
}
