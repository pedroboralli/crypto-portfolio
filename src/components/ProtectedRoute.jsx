import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { user, token, loading, authError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Token continua valendo, o servidor é que não respondeu: espera a nova
  // tentativa em vez de mandar o usuário para o login e perder a sessão.
  if (!user && token && authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-200 font-medium">Reconectando ao servidor...</p>
          <p className="text-gray-500 text-sm mt-1">Sua sessão continua ativa. Tentando novamente.</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
