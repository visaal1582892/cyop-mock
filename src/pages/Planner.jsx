import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, RotateCcw, Save, Flame, RefreshCw, Users, X } from 'lucide-react';
import { calculateMealTargets, calculateSmartPortion, findSwaps } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Planner = () => {
    const { selectedPatientId, patients, user, foodDatabase } = useAuth(); // Get context

    // Helper to get display name
    const getPatientName = () => {
        if (selectedPatientId === 'self') return user?.name || 'Myself';
        const p = patients.find(p => p.id === selectedPatientId);
        return p?.name || 'Unknown Patient';
    };

    const [meals, setMeals] = useState({
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
    });

    const [userStats, setUserStats] = useState({ targetCalories: 2000, goal: 'maintenance' });
    const [mealTargets, setMealTargets] = useState({ breakfast: 500, lunch: 800, snacks: 200, dinner: 500 });

    const [searchQuery, setSearchQuery] = useState("");
    const [activeMealSlot, setActiveMealSlot] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [swapCandidates, setSwapCandidates] = useState(null);

    // Load data when selectedPatientId changes
    useEffect(() => {
        // 1. Load Meals
        const mealKey = `meals_${selectedPatientId}`;
        const savedMeals = localStorage.getItem(mealKey);
        if (savedMeals) {
            setMeals(JSON.parse(savedMeals));
        } else {
            setMeals({ breakfast: [], lunch: [], dinner: [], snacks: [] });
        }

        // 2. Load Stats (Targets)
        const statsKey = `userStats_${selectedPatientId}`;
        const savedStats = localStorage.getItem(statsKey);
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            setUserStats(parsed);
            setMealTargets(calculateMealTargets(parsed.targetCalories, parsed.goal));
        } else {
            // Default fallbacks if no profile set yet
            setUserStats({ targetCalories: 2000, goal: 'maintenance' });
            setMealTargets(calculateMealTargets(2000, 'maintenance'));
        }
    }, [selectedPatientId]);

    // Save meals when they change
    useEffect(() => {
        const mealKey = `meals_${selectedPatientId}`;
        localStorage.setItem(mealKey, JSON.stringify(meals));
    }, [meals, selectedPatientId]);

    // Calculations
    const getMealTotal = (mealType) => {
        return meals[mealType].reduce((acc, item) => acc + item.calories, 0);
    };

    const currentDailyTotal = Object.keys(meals).reduce((acc, type) => acc + getMealTotal(type), 0);
    const remainingDaily = userStats.targetCalories - currentDailyTotal;

    // Actions
    const openSearch = (mealType) => {
        setActiveMealSlot(mealType);
        setIsSearchOpen(true);
        setSearchQuery("");
    };

    const addFood = (item, portionOverride = null) => {
        if (!activeMealSlot) return;

        let finalItem = { ...item, uuid: Date.now() }; // Unique ID for list

        // Logic for "Smart Portion" override
        if (portionOverride) {
            finalItem.servingDetails = `${portionOverride}g (Smart)`;
            const ratio = portionOverride / 100;
            finalItem.calories = Math.round(item.calories * ratio);
        } else {
            finalItem.servingDetails = item.servingSize;
        }

        setMeals(prev => ({
            ...prev,
            [activeMealSlot]: [...prev[activeMealSlot], finalItem]
        }));
        toast.success(`Added ${item.name} to ${activeMealSlot}`);
        setIsSearchOpen(false);
    };

    const removeFood = (mealType, uuid) => {
        setMeals(prev => ({
            ...prev,
            [mealType]: prev[mealType].filter(i => i.uuid !== uuid)
        }));
        toast.success("Removed item");
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
            [slot]: prev[slot].map(i => i.uuid === originalItem.uuid ? { ...newItem, uuid: originalItem.uuid, isSwapped: true, servingDetails: newItem.calculatedServing } : i)
        }));
        setSwapCandidates(null);
        toast.success("Item swapped successfully!");
    };

    const clearPlan = () => {
        if (window.confirm("Clear today's entire plan?")) {
            setMeals({ breakfast: [], lunch: [], dinner: [], snacks: [] });
            toast('Plan cleared', { icon: '🧹' });
        }
    };

    // Filtered Search
    const searchResults = foodDatabase.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Render a Meal Section
    const MealSection = ({ title, type, target }) => {
        const total = getMealTotal(type);
        const progress = Math.min((total / target) * 100, 100);

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 min-w-[300px]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 capitalize">{title}</h3>
                        <p className="text-xs text-gray-500">Target: {target} kcal</p>
                    </div>
                    <div className="text-right">
                        <span className={`text-xl font-bold ${total > target ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {total}
                        </span>
                        <span className="text-xs text-gray-400 block"> / {target} kcal</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${total > target ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* List */}
                <div className="space-y-3 min-h-[100px]">
                    {meals[type].map((item) => (
                        <div key={item.uuid} className="flex justify-between items-center group bg-gray-50 p-2 rounded-lg text-sm border border-transparent hover:border-gray-200 transition-all">
                            <div>
                                <div className="font-medium text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-500">
                                    {item.calories} kcal • {item.servingDetails || item.servingSize}
                                    {item.isSwapped && <span className="ml-2 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">SWAPPED</span>}
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleSwapClick(type, item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Swap"><RefreshCw className="w-4 h-4" /></button>
                                <button onClick={() => removeFood(type, item.uuid)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded" title="Remove"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {meals[type].length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-4 italic">No food added yet</div>
                    )}
                </div>

                <button
                    onClick={() => openSearch(type)}
                    className="w-full mt-4 py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Add Food
                </button>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-1">
                        <Users size={16} />
                        <span>Planning for: {getPatientName()}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Daily Meal Planner</h2>
                    <p className="text-gray-500">Design your plate, hit your meal targets.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Total Budget</div>
                        <div className={`text-2xl font-bold ${currentDailyTotal > userStats.targetCalories ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {currentDailyTotal} <span className="text-gray-400 text-lg">/ {userStats.targetCalories}</span>
                        </div>
                    </div>
                    <button onClick={clearPlan} className="p-2 text-gray-400 hover:text-rose-500 transition-colors" title="Clear All"><RotateCcw className="w-5 h-5" /></button>
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MealSection title="Breakfast" type="breakfast" target={mealTargets.breakfast} />
                <MealSection title="Lunch" type="lunch" target={mealTargets.lunch} />
                <MealSection title="Snacks" type="snacks" target={mealTargets.snacks} />
                <MealSection title="Dinner" type="dinner" target={mealTargets.dinner} />
            </div>

            {/* Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4">
                    <div className="bg-white w-full h-[90vh] md:h-[600px] md:max-w-lg md:rounded-2xl shadow-2xl overflow-hidden flex flex-col rounded-t-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex gap-3 items-center shrink-0 justify-between">
                            <div className="flex gap-3 items-center flex-1">
                                <Search className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Search food for ${activeMealSlot}...`}
                                    className="flex-1 outline-none text-lg"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-2 space-y-1 flex-1">
                            {searchResults.map((item) => {
                                // Smart Suggestion Logic
                                const currentMealCal = getMealTotal(activeMealSlot);
                                const remainingInMeal = mealTargets[activeMealSlot] - currentMealCal;
                                const is100g = item.servingSize && item.servingSize.includes('100g');
                                let smartAmount = 0;

                                if (is100g && remainingInMeal > 0) {
                                    smartAmount = calculateSmartPortion(item.calories, remainingInMeal);
                                }

                                return (
                                    <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 hover:bg-gray-50 rounded-xl group gap-3">
                                        <div>
                                            <div className="font-semibold text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {item.calories} kcal / {item.servingSize} • P:{item.protein} C:{item.carbs} F:{item.fats}
                                            </div>
                                            {smartAmount > 10 && (
                                                <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                                    <Flame className="w-3 h-3" />
                                                    Smart Portion: Eat <b>{smartAmount}g</b> to hit target
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 self-end sm:self-auto">
                                            {smartAmount > 10 && (
                                                <button
                                                    onClick={() => addFood(item, smartAmount)}
                                                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition-colors"
                                                >
                                                    Add {smartAmount}g
                                                </button>
                                            )}
                                            <button
                                                onClick={() => addFood(item)}
                                                className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Swap Modal */}
            {swapCandidates && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 md:p-4">
                    <div className="bg-white w-full rounded-t-2xl md:rounded-2xl shadow-2xl md:max-w-md overflow-hidden animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
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
                                        className="w-full p-4 hover:bg-gray-50 border-b border-gray-50 last:border-none text-left flex justify-between items-center group active:bg-gray-100 transition-colors"
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
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right safe-area-bottom">
                            <button onClick={() => setSwapCandidates(null)} className="text-gray-500 font-medium hover:text-gray-700 w-full md:w-auto py-2">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Planner;
