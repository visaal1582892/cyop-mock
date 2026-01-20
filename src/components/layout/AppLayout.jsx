import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, List, Settings, LogOut, UserPlus, FolderHeart, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AppLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show layout on login page (though routing usually handles this, extra safety)
    if (location.pathname === '/login') return children;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return children; // Allow inner routes to handle redirect

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                        CYOP
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                        Wellness Planner
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {user.role === 'user' && (
                        <>
                            <NavItem to="/" icon={<User size={20} />} label="Profile" />
                            <NavItem to="/planner" icon={<Utensils size={20} />} label="Meal Planner" />
                            <NavItem to="/saved-plans" icon={<FolderHeart size={20} />} label="Saved Plans" />
                        </>
                    )}
                    {user.role === 'admin' && (
                        <NavItem to="/admin" icon={<Settings size={20} />} label="Admin Panel" />
                    )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="px-4 py-2 mb-2">
                        <p className="text-xs text-gray-400 font-medium">Logged in as</p>
                        <p className="text-sm font-bold text-gray-700 truncate">{user.name}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-32 md:pb-0 bg-gray-50/50">
                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10 safe-area-top shadow-sm">
                    <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">CYOP</span>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50">
                        <LogOut size={20} />
                    </button>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/20 px-6 py-4 flex justify-between gap-2 items-center z-50 rounded-2xl shadow-2xl safe-area-bottom">
                {user.role === 'user' ? (
                    <>
                        <MobileNavItem to="/" icon={<User size={22} />} label="Profile" />
                        <MobileNavItem to="/planner" icon={<Utensils size={22} />} label="Planner" />
                        <MobileNavItem to="/saved-plans" icon={<FolderHeart size={22} />} label="Plans" />
                    </>
                ) : (
                    <MobileNavItem to="/admin" icon={<Settings size={22} />} label="Admin" />
                )}
            </nav>
        </div>
    );
};

const MobileNavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-300 relative group px-2 ${isActive
                ? 'text-emerald-600 scale-105 font-bold'
                : 'text-gray-400 hover:text-gray-600'
            }`
        }
    >
        {({ isActive }) => (
            <>
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-100 shadow-sm' : ''}`}>{icon}</div>
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </>
        )}
    </NavLink>
);

const NavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-50'
                : 'text-gray-500 hover:bg-white hover:text-emerald-600 hover:shadow-md'
            }`
        }
    >
        {({ isActive }) => (
            <>
                {React.cloneElement(icon, { size: 20, className: isActive ? 'text-white' : 'group-hover:scale-110 transition-transform' })}
                <span className="font-medium tracking-wide">{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </>
        )}
    </NavLink>
);

export default AppLayout;
