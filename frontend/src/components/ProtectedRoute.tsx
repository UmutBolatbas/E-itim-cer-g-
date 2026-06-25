import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

interface Props {
  children: ReactNode;
  requiredRole?: Role;
}

/**
 * Giris yapmamis kullanicilari /login'e yonlendirir.
 * requiredRole verilmisse ve kullanicinin rolu uymuyorsa ana sayfaya yonlendirir
 * (orn. standart kullanici /admin'e gitmeye calisirsa).
 */
export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Yukleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
