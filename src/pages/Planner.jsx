import React, { useState, useEffect } from 'react';
import { foodDatabase } from '../data/foodDatabase';
import { findSwaps } from '../utils/calculations';
import { Plus, Search, RefreshCw, Trash2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const Planner = () => {
    const [userStats, setUserStats] = useState(null);
    const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

    // Load from local storage or default
    const [meals, setMeals] = useState(() => {
        const savedMeals = localStorage.getItem('cyop_meals');
        return savedMeals ? JSON.parse(savedMeals) : {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        };
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("breakfast");
    const [swapCandidates, setSwapCandidates] = useState(null); // { originalItem, candidates }

    useEffect(() => {
        const savedStats = localStorage.getItem('userStats');
        if (savedStats) {
            setUserStats(JSON.parse(savedStats));
        } else {
            toast.error("User profile not found. Using defaults.");
            setUserStats({ targetCalories: 2000, macros: { protein: 150, carbs: 200, fats: 66 } });
        }

        // If no meals are loaded (first run), populate defaults only if configured to do so
        // Only doing this if keys are empty to respect persistence
        if (!localStorage.getItem('cyop_meals')) {
            setMeals({
                breakfast: [foodDatabase[11], foodDatabase[12]],
                lunch: [foodDatabase[0], foodDatabase[2], foodDatabase[4]],
                dinner: [foodDatabase[1], foodDatabase[3]],
                snacks: [foodDatabase[17]]
            });
        }
    }, []);

    useEffect(() => {
        // Save to local storage whenever meals change
        localStorage.setItem('cyop_meals', JSON.stringify(meals));

        // Recalculate totals
        let cal = 0, p = 0, c = 0, f = 0;
        Object.values(meals).flat().forEach(item => {
            cal += item.calories;
            p += item.protein;
            c += item.carbs;
            f += item.fats;
        });
        setConsumed({ calories: Math.round(cal), protein: Math.round(p), carbs: Math.round(c), fats: Math.round(f) });
    }, [meals]);

    const addToPlate = (item) => {
        setMeals(prev => ({
            ...prev,
            [selectedSlot]: [...prev[selectedSlot], { ...item, uniqueId: Date.now() }]
        }));
        toast.success(`Added ${item.name} to ${selectedSlot}`);
    };

    const removeFromPlate = (slot, uniqueId) => {
        setMeals(prev => ({
            ...prev,
            [slot]: prev[slot].filter(i => i.uniqueId !== uniqueId)
        }));
        toast.success("Removed item");
    };

    const resetDay = () => {
        if (confirm("Are you sure you want to clear your entire plan?")) {
            setMeals({ breakfast: [], lunch: [], dinner: [], snacks: [] });
            toast.success("Meal plan cleared");
        }
    };

    const handleSwapClick = (slot, item) => {
        const alternates = findSwaps(item, foodDatabase);
        if (alternates.length === 0) {
            toast('No similar items found for swap', { icon: '⚠️' });
        }
        setSwapCandidates({ slot, originalItem: item, candidates: alternates });
    };

    const applySwap = (newItem) => {
        if (!swapCandidates) return;
        const { slot, originalItem } = swapCandidates;

        setMeals(prev => ({
            ...prev,
            [slot]: prev[slot].map(i => i.uniqueId === originalItem.uniqueId ? { ...newItem, uniqueId: originalItem.uniqueId, isSwapped: true } : i)
        }));
        setSwapCandidates(null);
        toast.success("Item swapped successfully!");
    };

    const filteredFood = foodDatabase.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Plate Builder */}
            <div className="lg:col-span-2 space-y-8">
                <header className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Your Daily Plate</h2>
                        <p className="text-gray-500">Customize your meals to match your goals.</p>
                    </div>
                    <button onClick={resetDay} className="text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                        Clear Plan
                    </button>
                </header>

                {/* Meal Slots */}
                {['breakfast', 'lunch', 'dinner', 'snacks'].map(slot => (
                    <div key={slot} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="capitalize font-bold text-gray-800 text-lg">{slot}</h3>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{meals[slot].reduce((a, b) => a + b.calories, 0)} kcal</span>
                        </div>
                        <div className="p-4 space-y-3">
                            {meals[slot].length === 0 && (
                                <p className="text-gray-400 text-sm text-center py-4 italic">No items yet. Add some!</p>
                            )}
                            {meals[slot].map(item => (
                                <div key={item.uniqueId} className="flex items-center justify-between group p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                            {item.protein}P
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.calculatedServing || item.servingSize} • {item.calories} kcal
                                                {item.isSwapped && <span className="ml-2 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">SWAPPED</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleSwapClick(slot, item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg tooltip-trigger"
                                            title="Find Alternatives"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button
                                            onClick={() => removeFromPlate(slot, item.uniqueId)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => { setSelectedSlot(slot); document.getElementById('search-box').focus(); }}
                                className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Add Food
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Right: Stats & Search */}
            <div className="space-y-6">
                {/* Calorie Meter */}
                <div className={`p-6 rounded-3xl text-white shadow-lg transition-colors duration-500 ${consumed.calories > (userStats?.targetCalories || 2000) ? 'bg-red-500' : 'bg-gray-900'
                    }`}>
                    <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-2">Calories Consumed</p>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-5xl font-bold">{consumed.calories}</span>
                        <span className="text-xl text-white/60 mb-1">/ {userStats?.targetCalories || 2000}</span>
                    </div>

                    <div className="w-full bg-white/20 rounded-full h-3 mb-6">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${consumed.calories > (userStats?.targetCalories || 2000) ? 'bg-white' : 'bg-emerald-400'
                                }`}
                            style={{ width: `${Math.min((consumed.calories / (userStats?.targetCalories || 2000)) * 100, 100)}%` }}
                        ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-white/10 rounded-lg p-2">
                            <p className="text-xs text-white/50 mb-1">Protein</p>
                            <p className="font-bold">{consumed.protein}g</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2">
                            <p className="text-xs text-white/50 mb-1">Carbs</p>
                            <p className="font-bold">{consumed.carbs}g</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2">
                            <p className="text-xs text-white/50 mb-1">Fats</p>
                            <p className="font-bold">{consumed.fats}g</p>
                        </div>
                    </div>
                </div>

                {/* Search Panel */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Search size={20} /> Add to {selectedSlot}
                    </h3>
                    <div className="relative mb-4">
                        <input
                            id="search-box"
                            type="text"
                            placeholder="Search food (e.g. Dosa, Egg)..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredFood.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addToPlate(item)}
                                className="w-full text-left p-3 rounded-xl hover:bg-gray-50 flex justify-between items-center group transition-colors"
                            >
                                <div>
                                    <p className="font-semibold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.servingSize} • {item.calories} kcal</p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Plus size={16} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Swap Modal / Overlay */}
            {swapCandidates && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                            <h3 className="text-xl font-bold">Swap {swapCandidates.originalItem.name}</h3>
                            <p className="text-emerald-100 text-sm mt-1">Select an alternative to maintain similar calorie intake.</p>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {swapCandidates.candidates.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No similar swaps found.</p>
                            ) : (
                                swapCandidates.candidates.map(cand => (
                                    <button
                                        key={cand.id}
                                        onClick={() => applySwap(cand)}
                                        className="w-full p-4 hover:bg-gray-50 border-b border-gray-50 last:border-none text-left flex justify-between items-center group"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800">{cand.name}</p>
                                            <div className="flex gap-2 text-xs mt-1">
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Use {cand.calculatedServing}</span>
                                                <span className="text-gray-400 line-through">{cand.servingSize}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{cand.calories} kcal</p>
                                            <span className="text-xs text-gray-400">Match</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                            <button onClick={() => setSwapCandidates(null)} className="text-gray-500 font-medium hover:text-gray-700">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planner;
