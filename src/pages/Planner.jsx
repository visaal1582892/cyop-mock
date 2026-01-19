import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, RotateCcw, Save, Flame, RefreshCw, Users, X, Coffee, Printer, ArrowRight, Calendar, ChevronRight } from 'lucide-react';
import { calculateMealTargets, calculateSmartPortion, findSwaps, calculateMacros } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Planner = () => {
    const { selectedPatientId, patients, user, foodDatabase } = useAuth();

    // Helper to get display name
    const getPatientName = () => {
        if (selectedPatientId === 'self') return user?.name || 'Myself';
        const p = patients.find(p => p.id === selectedPatientId);
        return p?.name || 'Unknown Patient';
    };

    const [userStats, setUserStats] = useState({ targetCalories: 2000, goal: 'maintenance', planDuration: 1 });
    const [mealTargets, setMealTargets] = useState({ breakfast: 500, lunch: 800, snacks: 200, dinner: 500 });
    const [currentDay, setCurrentDay] = useState(1);

    // Data Structure: { 1: { breakfast: [], ... }, 2: { ... } }
    const [meals, setMeals] = useState({});

    // Structure: { 1: { morningTea: false, ... }, ... }
    const [beverages, setBeverages] = useState({});

    // Alternatives: { 1: { breakfast: [], ... }, ... }
    const [alternatives, setAlternatives] = useState({});

    // Edit Mode State
    const [editingItem, setEditingItem] = useState(null); // { type, uuid, item }
    const [editAmount, setEditAmount] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [activeMealSlot, setActiveMealSlot] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Load data
    useEffect(() => {
        const mealKey = `meals_${selectedPatientId}_v2`; // New version key
        const savedMeals = localStorage.getItem(mealKey);
        const bevKey = `beverages_${selectedPatientId}`;
        const savedBevs = localStorage.getItem(bevKey);

        const statsKey = `userStats_${selectedPatientId}`;
        const savedStats = localStorage.getItem(statsKey);

        if (savedStats) {
            const parsedStats = JSON.parse(savedStats);
            setUserStats(parsedStats);
            setMealTargets(calculateMealTargets(parsedStats.targetCalories, parsedStats.goal));

            // Migration / Init
            if (savedMeals) {
                setMeals(JSON.parse(savedMeals));
            } else {
                // Check for old v1 data
                const oldKey = `meals_${selectedPatientId}`;
                const oldMeals = localStorage.getItem(oldKey);
                if (oldMeals) {
                    setMeals({ 1: JSON.parse(oldMeals) });
                } else {
                    // Initialize empty structure for duration
                    const initialMeals = {};
                    for (let i = 1; i <= (parsedStats.planDuration || 1); i++) {
                        initialMeals[i] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
                    }
                    setMeals(initialMeals);

                    // Auto-generate triggers on empty
                    if (parsedStats.cuisine) {
                        setTimeout(() => generatePlan(parsedStats, true), 100);
                    }
                }
            }

            if (savedBevs) {
                setBeverages(JSON.parse(savedBevs));
            } else {
                const initBevs = {};
                for (let i = 1; i <= (parsedStats.planDuration || 1); i++) {
                    initBevs[i] = { morningTea: false, eveningTea: false, sugar: true };
                }
                setBeverages(initBevs);
            }
        }
    }, [selectedPatientId]);

    // Save meals & beverages
    useEffect(() => {
        if (!userStats.targetCalories) return; // Don't save if not loaded

        const mealKey = `meals_${selectedPatientId}_v2`;
        localStorage.setItem(mealKey, JSON.stringify(meals));

        const bevKey = `beverages_${selectedPatientId}`;
        localStorage.setItem(bevKey, JSON.stringify(beverages));

    }, [meals, beverages, selectedPatientId, userStats]);


    // Generator Logic (Round Robin)
    const generatePlan = (prefs, force = false) => {
        const duration = prefs.planDuration || 1;
        const newMeals = {};
        const newAlts = {};
        const newBevs = {};

        // Simple Random Picker with "Round Robin" feel (avoiding same item twice in a row if possible)
        let lastPicked = { breakfast: null, lunch: null, dinner: null, snacks: null };

        for (let day = 1; day <= duration; day++) {
            // Helper
            const getRandom = (category, avoidId) => {
                let pool = foodDatabase.filter(f => f.category === category || (category === 'Lunch' && (f.category === 'Dinner' || f.category === 'Lunch')));
                // Filter out last picked to ensure variety
                if (avoidId) {
                    const filtered = pool.filter(p => p.id !== avoidId);
                    if (filtered.length > 0) pool = filtered;
                }
                if (!pool.length) return null;
                return pool[Math.floor(Math.random() * pool.length)];
            };

            const dayMeals = {
                breakfast: [getRandom('Breakfast', lastPicked.breakfast?.id)].filter(Boolean).map(i => {
                    // Parse base weight for later editing
                    let baseWeight = 100;
                    if (i.servingSize && i.servingSize.includes('g')) baseWeight = parseInt(i.servingSize) || 100;
                    return { ...i, uuid: Date.now() + Math.random(), baseCalories: i.calories, baseWeight: baseWeight };
                }),
                lunch: [getRandom('Lunch', lastPicked.lunch?.id)].filter(Boolean).map(i => {
                    let baseWeight = 100;
                    if (i.servingSize && i.servingSize.includes('g')) baseWeight = parseInt(i.servingSize) || 100;
                    return { ...i, uuid: Date.now() + Math.random(), baseCalories: i.calories, baseWeight: baseWeight };
                }),
                snacks: [getRandom('Snacks', lastPicked.snacks?.id)].filter(Boolean).map(i => {
                    let baseWeight = 100;
                    if (i.servingSize && i.servingSize.includes('g')) baseWeight = parseInt(i.servingSize) || 100;
                    return { ...i, uuid: Date.now() + Math.random(), baseCalories: i.calories, baseWeight: baseWeight };
                }),
                dinner: [getRandom('Dinner', lastPicked.dinner?.id)].filter(Boolean).map(i => {
                    let baseWeight = 100;
                    if (i.servingSize && i.servingSize.includes('g')) baseWeight = parseInt(i.servingSize) || 100;
                    return { ...i, uuid: Date.now() + Math.random(), baseCalories: i.calories, baseWeight: baseWeight };
                }),
            };

            // Update last picked
            if (dayMeals.breakfast[0]) lastPicked.breakfast = dayMeals.breakfast[0];
            if (dayMeals.lunch[0]) lastPicked.lunch = dayMeals.lunch[0];
            if (dayMeals.snacks[0]) lastPicked.snacks = dayMeals.snacks[0];
            if (dayMeals.dinner[0]) lastPicked.dinner = dayMeals.dinner[0];

            newMeals[day] = dayMeals;

            // Alts
            newAlts[day] = {
                breakfast: dayMeals.breakfast[0] ? findSwaps(dayMeals.breakfast[0], foodDatabase).slice(0, 2) : [],
                lunch: dayMeals.lunch[0] ? findSwaps(dayMeals.lunch[0], foodDatabase).slice(0, 2) : [],
                snacks: dayMeals.snacks[0] ? findSwaps(dayMeals.snacks[0], foodDatabase).slice(0, 2) : [],
                dinner: dayMeals.dinner[0] ? findSwaps(dayMeals.dinner[0], foodDatabase).slice(0, 2) : []
            };

            newBevs[day] = { morningTea: false, eveningTea: false, sugar: true };
        }

        setMeals(newMeals);
        setAlternatives(newAlts);
        setBeverages(newBevs);
        if (!force) toast.success(`Generated ${duration}-Day Plan!`);
    };

    // Helper functions for Current Day
    const currentDayMeals = meals[currentDay] || { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const currentDayAlts = alternatives[currentDay] || { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const currentDayBevs = beverages[currentDay] || { morningTea: false, eveningTea: false, sugar: true };

    const getMealTotal = (mealType) => currentDayMeals[mealType]?.reduce((acc, item) => acc + item.calories, 0) || 0;
    const getMealMacros = (mealType) => currentDayMeals[mealType]?.reduce((acc, item) => ({
        p: acc.p + (item.protein || 0),
        c: acc.c + (item.carbs || 0),
        f: acc.f + (item.fats || 0)
    }), { p: 0, c: 0, f: 0 }) || { p: 0, c: 0, f: 0 };

    const beverageCalories = (currentDayBevs.morningTea ? 40 : 0) + (currentDayBevs.eveningTea ? 40 : 0) + (currentDayBevs.sugar ? 30 : 0);
    const dailyTotal = Object.keys(currentDayMeals).reduce((acc, type) => acc + getMealTotal(type), 0) + beverageCalories;

    // Actions
    const updateBeverage = (key, val) => {
        setBeverages(prev => ({
            ...prev,
            [currentDay]: { ...prev[currentDay], [key]: val }
        }));
    };

    const addFood = (item, portionOverride = null) => {
        if (!activeMealSlot) return;

        let baseWeight = 100;
        if (item.servingSize && item.servingSize.includes('g')) baseWeight = parseInt(item.servingSize) || 100;

        let finalItem = {
            ...item,
            uuid: Date.now(),
            baseCalories: item.calories,
            baseWeight: baseWeight,
            servingDetails: portionOverride ? `${portionOverride}g (Smart)` : item.servingSize
        };
        if (portionOverride) finalItem.calories = Math.round(item.calories * (portionOverride / 100));

        setMeals(prev => ({
            ...prev,
            [currentDay]: {
                ...prev[currentDay],
                [activeMealSlot]: [...(prev[currentDay][activeMealSlot] || []), finalItem]
            }
        }));
        setIsSearchOpen(false);

        // Generate Alts if first item
        if (!currentDayMeals[activeMealSlot] || currentDayMeals[activeMealSlot].length === 0) {
            setAlternatives(prev => ({
                ...prev,
                [currentDay]: {
                    ...prev[currentDay],
                    [activeMealSlot]: findSwaps(finalItem, foodDatabase).slice(0, 2)
                }
            }));
        }
    };

    const removeFood = (mealType, uuid) => {
        setMeals(prev => ({
            ...prev,
            [currentDay]: {
                ...prev[currentDay],
                [mealType]: prev[currentDay][mealType].filter(i => i.uuid !== uuid)
            }
        }));
    };

    const swapItem = (mealType, oldItem, newItem) => {
        setMeals(prev => ({
            ...prev,
            [currentDay]: {
                ...prev[currentDay],
                [mealType]: prev[currentDay][mealType].map(i => i.uuid === oldItem.uuid ? { ...newItem, uuid: oldItem.uuid, isSwapped: true, servingDetails: newItem.calculatedServing } : i)
            }
        }));
        toast.success("Swapped!");
    };

    const openEdit = (type, item) => {
        setEditingItem({ type, ...item });
        // Try to pre-fill amount
        const currentDetails = item.servingDetails || item.servingSize;
        const match = currentDetails && currentDetails.match(/(\d+)g/);
        setEditAmount(match ? match[1] : (item.baseWeight || 100));
    };

    const saveEdit = () => {
        if (!editingItem || !editAmount) return;

        const newWeight = parseInt(editAmount);
        if (isNaN(newWeight) || newWeight <= 0) return;

        // Calculate new calories
        const baseCal = editingItem.baseCalories || editingItem.calories; // Fallback
        const baseWeight = editingItem.baseWeight || 100;

        const ratio = newWeight / baseWeight;
        const newCalories = Math.round(baseCal * ratio);

        // Update Macros
        const newProtein = Math.round((editingItem.protein || 0) * ratio);
        const newCarbs = Math.round((editingItem.carbs || 0) * ratio);
        const newFats = Math.round((editingItem.fats || 0) * ratio);

        const updatedItem = {
            ...editingItem,
            calories: newCalories,
            protein: newProtein,
            carbs: newCarbs,
            fats: newFats,
            servingDetails: `${newWeight}g (Custom)`
        };

        setMeals(prev => ({
            ...prev,
            [currentDay]: {
                ...prev[currentDay],
                [editingItem.type]: prev[currentDay][editingItem.type].map(i => i.uuid === editingItem.uuid ? updatedItem : i)
            }
        }));

        setEditingItem(null);
        toast.success("Portion updated!");
    };

    const searchResults = foodDatabase.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Components
    const MacroBars = ({ current, target }) => {
        const tP = Math.round((target * 0.3) / 4);
        const tC = Math.round((target * 0.45) / 4);
        const tF = Math.round((target * 0.25) / 9);

        return (
            <div className="flex gap-2 mt-3 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex-1 group">
                    <div className="flex justify-between mb-1 text-blue-600"><span>Pro</span><span>{current.p}/{tP}g</span></div>
                    <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-blue-100 opacity-20"></div>
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out" style={{ width: `${Math.min((current.p / tP) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="flex-1 group">
                    <div className="flex justify-between mb-1 text-emerald-600"><span>Carb</span><span>{current.c}/{tC}g</span></div>
                    <div className="h-1.5 bg-emerald-50 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-emerald-100 opacity-20"></div>
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 ease-out" style={{ width: `${Math.min((current.c / tC) * 100, 100)}%` }} />
                    </div>
                </div>
                <div className="flex-1 group">
                    <div className="flex justify-between mb-1 text-orange-600"><span>Fat</span><span>{current.f}/{tF}g</span></div>
                    <div className="h-1.5 bg-orange-50 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-orange-100 opacity-20"></div>
                        <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 ease-out" style={{ width: `${Math.min((current.f / tF) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32 print:p-0 print:pb-0">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-4 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-1">
                        <Users size={16} />
                        <span>Planning for: {getPatientName()}</span>
                        <button onClick={() => generatePlan(userStats)} className="ml-4 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200 transition-colors flex items-center gap-1 font-bold">
                            <RotateCcw size={12} /> Auto-Generate
                        </button>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Meal Planner</h2>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total vs Target</div>
                        <div className={`text-3xl font-bold tracking-tight ${dailyTotal > userStats.targetCalories ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {dailyTotal} <span className="text-gray-300 text-xl font-normal">/ {userStats.targetCalories}</span>
                        </div>
                    </div>
                    <button onClick={() => window.print()} className="p-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-all shadow-lg hover:shadow-xl" title="Print Plan"><Printer className="w-5 h-5" /></button>
                </div>
            </header>

            {/* Day Selector */}
            {userStats.planDuration > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 print:hidden scrollbar-hide">
                    {Array.from({ length: userStats.planDuration }, (_, i) => i + 1).map(day => (
                        <button
                            key={day}
                            onClick={() => setCurrentDay(day)}
                            className={`flex flex-col items-center justify-center min-w-[80px] py-3 rounded-2xl transition-all ${currentDay === day
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                    : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Day</span>
                            <span className="text-xl font-bold">{day}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="print:block hidden mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Day {currentDay} Plan</h3>
            </div>


            {/* Beverage Section */}
            <section className="bg-gradient-to-r from-orange-50 to-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-wrap items-center gap-6 print:border-gray-200">
                <div className="flex items-center gap-2 font-bold text-orange-800">
                    <Coffee className="w-5 h-5" /> Tea/Coffee
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-orange-600 transition-colors">
                    <input type="checkbox" checked={currentDayBevs.morningTea} onChange={e => updateBeverage('morningTea', e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4" />
                    Morning
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-orange-600 transition-colors">
                    <input type="checkbox" checked={currentDayBevs.eveningTea} onChange={e => updateBeverage('eveningTea', e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4" />
                    Evening
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer border-l pl-6 border-orange-200 hover:text-orange-600 transition-colors">
                    <input type="checkbox" checked={currentDayBevs.sugar} onChange={e => updateBeverage('sugar', e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4" />
                    With Sugar
                </label>
                <div className="ml-auto text-sm text-orange-600 font-bold bg-orange-100 px-3 py-1 rounded-full">
                    +{beverageCalories} kcal
                </div>
            </section>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
                {['breakfast', 'lunch', 'snacks', 'dinner'].map(type => {
                    const total = getMealTotal(type);
                    const macros = getMealMacros(type);
                    const target = mealTargets[type];

                    return (
                        <div key={type} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col print:break-inside-avoid print:shadow-none print:border-gray-300 hover:shadow-md transition-shadow duration-300">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-800 capitalize flex items-center gap-2">
                                    {type}
                                </h3>
                                <div className="text-right text-xs">
                                    <span className={`font-bold text-lg ${total > target ? 'text-rose-500' : 'text-emerald-600'}`}>{total}</span>
                                    <span className="text-gray-400"> / {target}</span>
                                </div>
                            </div>

                            {/* Macro Bars */}
                            <MacroBars current={macros} target={target} />

                            {/* Food List */}
                            <div className="mt-6 space-y-3 min-h-[80px]">
                                {currentDayMeals[type]?.map(item => (
                                    <div key={item.uuid}
                                        onClick={() => openEdit(type, item)}
                                        className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-transparent hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group shadow-sm cursor-pointer relative"
                                        title="Click to edit portion"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.isSwapped && <RefreshCw size={12} className="text-emerald-500" />}
                                            <div>
                                                <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                                                <div className="text-xs text-gray-500 font-medium group-hover:text-emerald-600 transition-colors">{item.calories} kcal • {item.servingDetails || item.servingSize}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Edit Icon visible on hover */}
                                            <div className="bg-white p-1.5 rounded-lg text-emerald-500 opacity-0 group-hover:opacity-100 shadow-sm transition-all scale-90 group-hover:scale-100">
                                                <Flame size={14} />
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); removeFood(type, item.uuid); }} className="text-gray-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {(!currentDayMeals[type] || currentDayMeals[type].length === 0) && (
                                    <div className="text-center text-gray-300 text-sm py-4 italic border-2 border-dashed border-gray-100 rounded-xl">
                                        Empty Slot
                                    </div>
                                )}
                            </div>

                            {/* Alternatives Section - shown if items exist */}
                            {currentDayMeals[type]?.length > 0 && currentDayAlts[type] && currentDayAlts[type].length > 0 && (
                                <div className="mt-6 print:hidden">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-px bg-gray-100 flex-1"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Smart Swaps</span>
                                        <div className="h-px bg-gray-100 flex-1"></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentDayAlts[type].map(alt => (
                                            <div key={alt.id} className="flex flex-col p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-100 hover:border-emerald-200 transition-all cursor-pointer group text-center relative overflow-hidden" onClick={() => swapItem(type, meals[currentDay][type][0], alt)}>
                                                <span className="text-xs font-bold text-gray-700 z-10">{alt.name}</span>
                                                <span className="text-[10px] text-emerald-600 font-semibold z-10">{alt.calories} kcal</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={() => { setActiveMealSlot(type); setIsSearchOpen(true); setSearchQuery(""); }} className="w-full mt-4 py-3 border border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider print:hidden group">
                                <Plus size={16} className="group-hover:scale-110 transition-transform" /> Add {type} Item
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end md:items-center justify-center md:p-4 print:hidden p-0">
                    <div className="bg-white w-full h-[85vh] md:h-[600px] md:max-w-xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col rounded-t-3xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex gap-4 items-center shrink-0">
                            <Search className="text-emerald-500 w-6 h-6" />
                            <input
                                type="text"
                                placeholder="Search foods..."
                                className="flex-1 outline-none text-xl font-medium placeholder:text-gray-300"
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button onClick={() => setIsSearchOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                        </div>
                        <div className="overflow-y-auto p-2 space-y-1 flex-1">
                            {searchResults.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl group cursor-pointer transition-colors" onClick={() => addFood(item)}>
                                    <div>
                                        <div className="font-bold text-gray-800 text-lg">{item.name}</div>
                                        <div className="flex gap-2 text-sm text-gray-500 mt-0.5">
                                            <span className="font-semibold text-gray-900">{item.calories} kcal</span>
                                            <span>•</span>
                                            <span>{item.servingSize}</span>
                                        </div>
                                    </div>
                                    <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                        <Plus size={20} />
                                    </button>
                                </div>
                            ))}
                            {searchResults.length === 0 && <div className="text-center text-gray-400 py-10">No foods found matching "{searchQuery}"</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Portion Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Edit Portion</h3>
                            <p className="text-sm text-gray-500 mb-6">{editingItem.name}</p>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quantity (Grams)</label>
                                <div className="flex items-center gap-2 border-b-2 border-emerald-500 pb-1">
                                    <input
                                        type="number"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className="text-3xl font-bold text-gray-900 w-full outline-none"
                                        autoFocus
                                    />
                                    <span className="text-gray-400 font-medium">grams</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                                <button onClick={saveEdit} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planner;
