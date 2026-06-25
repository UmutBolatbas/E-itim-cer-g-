import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/"); // App.tsx role'e gore yonlendirecek
    } catch (err: any) {
      setError(err.response?.data?.message || "Giris basarisiz oldu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-xl font-bold text-white mb-1">Ambulans Egitim Sistemi</h1>
        <p className="text-slate-400 text-sm mb-6">Hesabiniza giris yapin</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="ornek@kurum.gov.tr"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Sifre</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="********"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md py-2 font-medium transition"
          >
            {submitting ? "Giris yapiliyor..." : "Giris Yap"}
          </button>
        </form>

        <p className="text-sm text-slate-400 mt-4 text-center">
          Hesabiniz yok mu?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Kayit olun
          </Link>
        </p>
      </div>
    </div>
  );
}
