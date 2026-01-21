import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit2, FolderOpen, ArrowLeft, Save, X, Calendar, FolderHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SavedPlans = () => {
    const { selectedPatientId, setSelectedPatientId, patients, user } = useAuth();
    const navigate = useNavigate();
    const [savedPlans, setSavedPlans] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");

    // Helper to get plan count
    const getPlanCount = (id) => {
        try {
            const saved = localStorage.getItem(`saved_plans_${id}`);
            return saved ? Object.keys(JSON.parse(saved)).length : 0;
        } catch (e) {
            console.error("Error getting plan count for ID:", id, e);
            return 0;
        }
    };

    // Helper to calculate covered calories
    const getPlanCalories = (plan) => {
        if (!plan || !plan.meals) return 0;
        const days = Object.keys(plan.meals);
        if (days.length === 0) return 0;

        let totalCals = 0;
        days.forEach(day => {
            // Meals
            ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(slot => {
                const items = plan.meals[day]?.[slot] || [];
                items.forEach(item => totalCals += (item.calories || 0));
            });

            // Beverages
            const bevs = plan.beverages?.[day];
            if (bevs) {
                if (bevs.morningTea) totalCals += 40;
                if (bevs.eveningTea) totalCals += 40;
                if (bevs.sugar && (bevs.morningTea || bevs.eveningTea)) totalCals += 30;
            }
        });

        return Math.round(totalCals / days.length);
    };

    useEffect(() => {
        loadPlans();
    }, [selectedPatientId]);

    const loadPlans = () => {
        const storageKey = `saved_plans_${selectedPatientId}`;
        const plans = JSON.parse(localStorage.getItem(storageKey) || '{}');
        setSavedPlans(plans);
    };

    const deletePlan = (planName) => {
        if (window.confirm(`Are you sure you want to delete "${planName}"?`)) {
            const newPlans = { ...savedPlans };
            delete newPlans[planName];
            localStorage.setItem(`saved_plans_${selectedPatientId}`, JSON.stringify(newPlans));
            setSavedPlans(newPlans);
            toast.success('Plan deleted successfully');
        }
    };

    const startEdit = (name) => {
        setEditingId(name);
        setEditName(name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
    };

    const saveEdit = (oldName) => {
        if (!editName.trim()) return toast.error("Plan name cannot be empty");
        if (editName === oldName) {
            cancelEdit();
            return;
        }
        if (savedPlans[editName]) return toast.error("A plan with this name already exists");

        const newPlans = { ...savedPlans };
        newPlans[editName] = newPlans[oldName];
        delete newPlans[oldName];

        localStorage.setItem(`saved_plans_${selectedPatientId}`, JSON.stringify(newPlans));
        setSavedPlans(newPlans);
        setEditingId(null);
        toast.success("Plan renamed successfully");
    };

    const openPlan = (planName) => {
        navigate('/planner', { state: { loadPlan: planName } });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Saved Plans</h2>
                    <p className="text-gray-500 mt-2">Manage and organize meal plans.</p>
                </div>

                {/* User Selector */}
                <div className="relative min-w-[250px]">
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full p-3 pl-10 rounded-xl border border-emerald-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-bold text-emerald-800 cursor-pointer"
                    >
                        <option value="self">Myself ({getPlanCount('self')} plans)</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({getPlanCount(p.id)} plans)</option>
                        ))}
                    </select>
                    <FolderHeart className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(savedPlans).length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <FolderOpen size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Saved Plans</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">You haven't saved any meal plans for this profile yet. Create a plan in the Planner and save it to see it here.</p>
                        <button
                            onClick={() => navigate('/planner')}
                            className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                        >
                            Go to Planner
                        </button>
                    </div>
                ) : (
                    Object.keys(savedPlans).map(name => (
                        <div key={name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

                            {editingId === name ? (
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full p-2 border border-emerald-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><X size={18} /></button>
                                        <button onClick={() => saveEdit(name)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Save size={18} /></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 line-clamp-1" title={name}>{name}</h3>
                                                <div className="flex gap-2 text-xs text-gray-500 font-medium mt-1">
                                                    <span>{savedPlans[name]?.meals ? Object.keys(savedPlans[name].meals).length : 0} Days</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-600 font-bold">{getPlanCalories(savedPlans[name])} kcal/day</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => openPlan(name)}
                                            className="flex-1 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                        >
                                            Open
                                        </button>
                                        <button
                                            onClick={() => startEdit(name)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Rename"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => deletePlan(name)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SavedPlans;
