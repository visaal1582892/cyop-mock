import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, List, Settings, LogOut } from 'lucide-react';

const AppLayout = ({ children }) => {
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
                    <NavItem to="/" icon={<User size={20} />} label="Profile & Goals" />
                    <NavItem to="/planner" icon={<LayoutDashboard size={20} />} label="Meal Planner" />
                    <NavItem to="/admin" icon={<Settings size={20} />} label="Admin Panel" />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full">
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
                    <span className="font-bold text-xl text-emerald-600">CYOP</span>
                    <button className="p-2 text-gray-600 rounded-lg hover:bg-gray-100">
                        <List size={24} />
                    </button>
                </header>

                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

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
