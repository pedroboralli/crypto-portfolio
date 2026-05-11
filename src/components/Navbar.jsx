import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, TrendingUp, LogOut, UserCircle } from 'lucide-react';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path 
            ? 'text-primary-400 bg-white/5 border-b-2 border-primary-500' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5';
    };

    return (
        <nav className="sticky top-0 z-50 glass-header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-8">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
                                Crypto Portfolio
                            </span>
                        </div>
                        <div className="hidden sm:flex sm:space-x-1 h-full pt-1">
                            <Link
                                to="/dashboard"
                                className={`inline-flex items-center px-4 pt-1 h-full text-sm font-medium transition-all ${isActive('/dashboard')}`}
                            >
                                <Wallet className="w-4 h-4 mr-2" />
                                Portfólio
                            </Link>
                            <Link
                                to="/top100"
                                className={`inline-flex items-center px-4 pt-1 h-full text-sm font-medium transition-all ${isActive('/top100')}`}
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Mercado
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {user && (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800/50 border border-white/5">
                                    <UserCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-300">{user.email}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Sair"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="sm:hidden flex justify-center space-x-2 p-2 border-t border-white/5 bg-dark-900/50 backdrop-blur-md">
                <Link
                    to="/dashboard"
                    className={`flex-1 flex justify-center items-center gap-2 text-sm font-medium px-2 py-2.5 rounded-lg transition-all ${location.pathname === '/dashboard' ? 'text-primary-400 bg-primary-500/10' : 'text-gray-400 hover:bg-white/5'}`}
                >
                    <Wallet className="w-4 h-4" />
                    Portfólio
                </Link>
                <Link
                    to="/top100"
                    className={`flex-1 flex justify-center items-center gap-2 text-sm font-medium px-2 py-2.5 rounded-lg transition-all ${location.pathname === '/top100' ? 'text-primary-400 bg-primary-500/10' : 'text-gray-400 hover:bg-white/5'}`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Mercado
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;
