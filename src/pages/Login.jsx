import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (role) => {
        login(role);
        navigate(role === 'admin' ? '/admin' : '/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mb-2">
                        CYOP
                    </h1>
                    <p className="text-gray-500 font-medium">Wellness Planner Login</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleLogin('user')}
                        className="w-full p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-800">Regular User</h3>
                            <p className="text-xs text-gray-500">Access planner, profile & goals</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleLogin('admin')}
                        className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-gray-800">Admin Access</h3>
                            <p className="text-xs text-gray-500">Manage system settings</p>
                        </div>
                    </button>
                </div>

                <p className="text-xs text-gray-400">
                    Use these dummy credentials to explore the application roles.
                </p>
            </div>
        </div>
    );
};

export default Login;
