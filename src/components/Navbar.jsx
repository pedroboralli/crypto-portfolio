import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900';
    };

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-gray-900">Crypto Portfolio</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                to="/dashboard"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/dashboard')}`}
                            >
                                Portfólio
                            </Link>
                            <Link
                                to="/top100"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/top100')}`}
                            >
                                Top 100
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {user && (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
                                <button
                                    onClick={logout}
                                    className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="sm:hidden flex justify-center space-x-8 py-2 border-t border-gray-100">
                <Link
                    to="/dashboard"
                    className={`text-sm font-medium px-2 py-1 ${location.pathname === '/dashboard' ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-500'}`}
                >
                    Portfólio
                </Link>
                <Link
                    to="/top100"
                    className={`text-sm font-medium px-2 py-1 ${location.pathname === '/top100' ? 'text-blue-600 bg-blue-50 rounded' : 'text-gray-500'}`}
                >
                    Top 100
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;
