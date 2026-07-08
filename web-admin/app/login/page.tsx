"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/firebase/auth-context";

function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const { login, user } = useAuth();
  const router          = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full h-screen flex flex-col md:flex-row overflow-hidden">
      {/* ── Left Panel: Ember Gradient ── */}
      <section
        className="w-full md:w-1/2 flex flex-col items-center justify-center relative p-12 text-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #8C2510 0%, #BF391B 50%, #E54D2A 100%)" }}
      >
        {/* Decorative overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #000 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #000 0%, transparent 50%)`,
          }}
        />

        {/* Floating circles decoration */}
        <div className="absolute top-16 left-16 w-32 h-32 rounded-full border border-white/10" />
        <div className="absolute bottom-20 right-12 w-24 h-24 rounded-full border border-white/10" />
        <div className="absolute top-1/3 right-8 w-16 h-16 rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo box */}
          <div
            className="mb-8 w-44 h-44 rounded-3xl flex items-center justify-center border border-white/20 p-4 shadow-xl"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
          >
            <img src="/logo.png" alt="Mr Pepe Logo" className="w-full h-full object-contain" />
          </div>

          <h1
            className="text-white font-extrabold mb-4"
            style={{ fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "-0.03em" }}
          >
            Mr Pepe
          </h1>

          <p className="text-white/80 text-lg font-medium max-w-xs leading-snug">
            Control total de tu restaurante
          </p>

          {/* Stats pills */}
          <div className="flex gap-3 mt-10">
            {[
              { value: "40", label: "Mesas" },
              { value: "∞", label: "Pedidos" },
              { value: "24/7", label: "Tiempo real" },
            ].map((s) => (
              <div
                key={s.label}
                className="px-4 py-2 rounded-full text-center border border-white/20"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                <p className="text-white font-extrabold text-lg leading-tight">{s.value}</p>
                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom ember glow */}
        <div
          className="absolute bottom-0 left-0 w-full h-32 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }}
        />
      </section>

      {/* ── Right Panel: Login Form ── */}
      <section className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-16 relative">
        <div className="w-full max-w-md">
          {/* Header */}
          <header className="mb-10">
            <h2
              className="font-extrabold text-[#0D0D0D] mb-2"
              style={{ fontSize: "28px", letterSpacing: "-0.02em" }}
            >
              Bienvenido 👋
            </h2>
            <p className="text-[#9AA0A6] font-medium">
              Ingresa al panel administrativo
            </p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[11px] font-bold text-[#5A413B] uppercase tracking-widest"
              >
                Email
              </label>
              <div className="relative group">
                <span
                  className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA0A6] group-focus-within:text-[#BF391B] transition-colors text-[20px]"
                >
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@mrpepe.com"
                  className="w-full pl-11 pr-4 py-3.5 text-sm text-[#0D0D0D] rounded-[10px] outline-none transition-all"
                  style={{
                    background: "#F8F9FA",
                    border: "1px solid #E4E7EC",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#BF391B")}
                  onBlur={(e)  => (e.target.style.borderColor = "#E4E7EC")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold text-[#5A413B] uppercase tracking-widest"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-[12px] font-bold text-[#BF391B] hover:underline"
                >
                  Olvidé mi contraseña
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA0A6] group-focus-within:text-[#BF391B] transition-colors text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 text-sm text-[#0D0D0D] rounded-[10px] outline-none transition-all"
                  style={{
                    background: "#F8F9FA",
                    border: "1px solid #E4E7EC",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#BF391B")}
                  onBlur={(e)  => (e.target.style.borderColor = "#E4E7EC")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-[#0D0D0D] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center gap-3 py-1">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-[#BF391B]"
              />
              <label htmlFor="remember" className="text-sm font-medium text-[#9AA0A6] cursor-pointer">
                Mantener sesión iniciada
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-red-50 border border-red-100">
                <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                <p className="text-red-600 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white font-bold rounded-[10px] transition-all duration-200 text-sm active:scale-[0.98] disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #8C2510 0%, #BF391B 50%, #E54D2A 100%)",
                boxShadow: "0 4px 16px rgba(140,37,16,0.25)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#9AA0A6]">
              ¿Problemas para acceder?{" "}
              <a href="#" className="text-[#BF391B] font-bold hover:underline">
                Contacta al soporte
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 flex items-center gap-2 text-[#9AA0A6] text-[11px] font-medium">
          <span>Mr. Pepe © {new Date().getFullYear()}</span>
          <span className="w-1 h-1 rounded-full bg-[#E4E7EC]" />
          <span>Todos los derechos reservados</span>
        </footer>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
