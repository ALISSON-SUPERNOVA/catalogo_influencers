import { useState, type FormEvent } from "react";
import { Shield, ShieldAlert } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        localStorage.setItem("supernova_admin_auth", "true");
        localStorage.setItem("supernova_admin_email", email);
        onLoginSuccess(email);
      } else {
        setLoginError(result.error || "Falha na autenticação.");
      }
    } catch (err) {
      setLoginError("Erro de comunicação com o servidor.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none bg-canvas-subtle p-4">
      <div className="w-full max-w-md bg-canvas border border-line rounded-2xl shadow-soft p-8 relative">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img
            src="https://aesudwzpjegszprgasez.supabase.co/storage/v1/object/public/Logos/Horizontal%20Preto%20Recortado.png"
            alt="Supernova"
            className="h-11 w-auto"
          />
          <div className="flex items-center gap-2 mt-2">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold font-sans text-ink">Acesso à Plataforma</h2>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs uppercase font-sans font-semibold block mb-1 text-ink-soft">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@supernova.art.br"
              className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-150"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs uppercase font-sans font-semibold block mb-1 text-ink-soft">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-150"
              required
            />
          </div>

          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs flex gap-2 items-start font-medium rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-lg bg-accent text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-ink transition-colors duration-150 cursor-pointer disabled:opacity-50"
          >
            {isLoggingIn ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 border-t border-line pt-4 text-center text-[10px] font-sans text-ink-soft">
          Acesso monitorado. Tentativas consecutivas inválidas resultam em bloqueio automático de IP.
        </div>
      </div>
    </div>
  );
}
