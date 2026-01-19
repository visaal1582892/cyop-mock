import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, List, Settings, LogOut, UserPlus } from 'lucide-react';
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
                            <NavItem to="/" icon={<User size={20} />} label="Profile & Goals" />
                            <NavItem to="/planner" icon={<LayoutDashboard size={20} />} label="Meal Planner" />
                            <NavItem to="/manage-patients" icon={<List size={20} />} label="Manage Patients" />
                            <NavItem to="/add-patient" icon={<UserPlus size={20} />} label="Add Patient" />
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
            <main className="flex-1 overflow-y-auto pb-32 md:pb-0">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10 safe-area-top">
                    <span className="font-bold text-xl text-emerald-600">CYOP</span>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                        <LogOut size={20} />
                    </button>
                </header>

                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-center gap-8 items-center z-50 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {user.role === 'user' ? (
                    <>
                        <MobileNavItem to="/" icon={<User size={24} />} label="Profile" />
                        <MobileNavItem to="/planner" icon={<LayoutDashboard size={24} />} label="Planner" />
                        <MobileNavItem to="/manage-patients" icon={<List size={24} />} label="Patients" />
                        <MobileNavItem to="/add-patient" icon={<UserPlus size={24} />} label="Add" />
                    </>
                ) : (
                    <MobileNavItem to="/admin" icon={<Settings size={24} />} label="Admin" />
                )}
            </nav>
        </div>
    );
};

const MobileNavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200 ${isActive
                ? 'text-emerald-600'
                : 'text-gray-400 hover:text-gray-600'
            }`
        }
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
);

const NavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-emerald-50 text-emerald-700 shadow-sm font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
        }
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

export default AppLayout;
