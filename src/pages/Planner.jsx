import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, RotateCcw, Save, Flame, RefreshCw, Users, X, Coffee, Printer, ArrowRight, Calendar, ChevronRight, FolderOpen, Settings } from 'lucide-react';
import { calculateMealTargets, calculateSmartPortion, calculateMacros, calculateTargetCalories, calculateTDEE } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Planner = () => {
    const { selectedPatientId, setSelectedPatientId, patients, user, foodDatabase } = useAuth();

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

    // Edit Mode State
    const [editingItem, setEditingItem] = useState(null); // { type, uuid, item }
    const [editAmount, setEditAmount] = useState("");
    const [editComposition, setEditComposition] = useState([]); // For composition editing

    const [searchQuery, setSearchQuery] = useState("");
    const [activeMealSlot, setActiveMealSlot] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // --- Settings Modal Logic (Buffered State) ---
    const [bufferPatientId, setBufferPatientId] = useState(selectedPatientId);
    const [bufferStats, setBufferStats] = useState(userStats);

    // Sync buffer when modal opens
    useEffect(() => {
        if (showSettings) {
            setBufferPatientId(selectedPatientId);
            setBufferStats(userStats);
        }
    }, [showSettings, selectedPatientId, userStats]);

    // Recalculate TDEE when Buffer Patient Changes (Draft Mode)
    useEffect(() => {
        // Find profile
        let profile = user;
        if (bufferPatientId !== 'self') {
            profile = patients.find(p => p.id === bufferPatientId);
        }

        // Calculate fresh TDEE based on their weight
        // Fallback to 60kg if missing to prevent NaN/Crash
        const weight = profile?.weight || 60;
        const freshTDEE = calculateTDEE(weight);

        // Try to load saved stats for this patient to be accurate (e.g. if I already saved a goal for "Dad")
        const saved = localStorage.getItem(`userStats_${bufferPatientId}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge saved stats, but ensure TDEE is fresh from profile (in case weight changed) or use saved?
            // Priorities: 1. Saved TDEE, 2. Calc from Saved Weight, 3. Fresh (Context) TDEE
            const effectiveTDEE = parsed.tdee || (parsed.weight ? calculateTDEE(parsed.weight) : freshTDEE);
            setBufferStats({ ...parsed, tdee: effectiveTDEE });
        } else {
            // Use Fresh defaults
            setBufferStats(prev => ({
                ...prev,
                tdee: freshTDEE,
                targetCalories: freshTDEE, // Reset to maintenance if new
                targetWeightLoss: 0,
                // Keep other display preferences or reset them? Let's keep them sticky or reset to default?
                // Let's reset to defaults for a "clean" switch appearance
                planDuration: 1
            }));
        }
    }, [bufferPatientId, user, patients]);

    const handleBufferStatChange = (key, val) => {
        setBufferStats(prev => ({ ...prev, [key]: val }));
    };

    const applySettings = () => {
        // 1. Prepare Target Data
        // We write directly to localStorage so the Effect (on switch) or manual update (on same) picks it up.
        const targetId = bufferPatientId;
        const statsKey = `userStats_${targetId}`;

        // Save the *new* preferences to the target user's storage
        localStorage.setItem(statsKey, JSON.stringify(bufferStats));

        // 2. CLEAR PLAN (Requested Behavior)
        // Remove any saved session data for this user so they start fresh
        localStorage.removeItem(`meals_${targetId}_v2`);
        localStorage.removeItem(`beverages_${targetId}`);

        // 3. Apply Context Switch or State Update
        if (targetId !== selectedPatientId) {
            // Case A: Switching User
            // The Effect (lines 65+) will run, read the Stats we just saved, and find no meals (init empty).
            setSelectedPatientId(targetId);
        } else {
            // Case B: Same User
            // The Effect won't trigger re-load, so we must manually update state.
            updateStatsAndTargets(bufferStats);

            // Manually clear State
            const duration = bufferStats.planDuration || 1;
            const initialMeals = {};
            for (let i = 1; i <= duration; i++) {
                initialMeals[i] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            }
            setMeals(initialMeals);

            const initBevs = {};
            for (let i = 1; i <= duration; i++) {
                initBevs[i] = { morningTea: false, eveningTea: false, sugar: true };
            }
            setBeverages(initBevs);
        }

        toast.success("Settings Applied & Plan Cleared");
        setShowSettings(false);
    };

    // --- ROBUST DATA MANAGEMENT ---

    // 1. Centralized Stats Updater
    const updateStatsAndTargets = (newStats) => {
        // Recalculate Target Calories if TDEE or Weight Loss Goal exists
        // This ensures math is always consistent
        if (newStats.tdee && newStats.targetWeightLoss !== undefined) {
            newStats.targetCalories = calculateTargetCalories(newStats.tdee, newStats.targetWeightLoss);
        }

        // Update State
        setUserStats(newStats);
        setMealTargets(calculateMealTargets(newStats.targetCalories, 'custom'));

        // Persist to LocalStorage
        localStorage.setItem(`userStats_${selectedPatientId}`, JSON.stringify(newStats));
    };

    const handleStatChange = (key, val) => {
        const newStats = { ...userStats, [key]: val };
        updateStatsAndTargets(newStats);
    };

    // Track which patient's data is currently loaded
    const [loadedPatientId, setLoadedPatientId] = useState(null);

    // 2. Load Data Effect (Refined)
    useEffect(() => {
        const mealKey = `meals_${selectedPatientId}_v2`;
        const bevKey = `beverages_${selectedPatientId}`;
        const statsKey = `userStats_${selectedPatientId}`;

        const savedMeals = localStorage.getItem(mealKey);
        const savedBevs = localStorage.getItem(bevKey);
        const savedStats = localStorage.getItem(statsKey);

        // A. Resolve Current Profile & Fresh TDEE
        let currentProfile = user;
        if (selectedPatientId !== 'self') {
            currentProfile = patients.find(p => p.id === selectedPatientId) || {};
        }
        // *Fresh* TDEE based on current profile weight
        const freshWeight = currentProfile?.weight || 60;
        // Use consistent formula from utils
        const freshTDEE = calculateTDEE(freshWeight);

        // B. Merge Saved Preferences with Fresh Physical Data
        let statsToLoad = {
            targetCalories: 2000,
            planDuration: 1,
            tdee: 2000,
            targetWeightLoss: 0,
            cuisine: 'North Indian',
            dietType: 'veg'
        };

        if (savedStats) {
            const parsed = JSON.parse(savedStats);

            // Robust TDEE resolution
            const effectiveTDEE = parsed.tdee || (parsed.weight ? calculateTDEE(parsed.weight) : freshTDEE);

            statsToLoad = {
                ...statsToLoad,
                ...parsed,
                tdee: effectiveTDEE,
            };
        } else {
            // New User/Patient setup
            statsToLoad.tdee = freshTDEE;
            statsToLoad.targetCalories = freshTDEE; // Default maintenance
        }

        // C. Apply Updates
        updateStatsAndTargets(statsToLoad);

        // D. Load Meals
        if (savedMeals) {
            setMeals(JSON.parse(savedMeals));
        } else {
            // Initialize empty
            const initialMeals = {};
            for (let i = 1; i <= (statsToLoad.planDuration || 1); i++) {
                initialMeals[i] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            }
            setMeals(initialMeals);
        }

        // E. Load Beverages
        if (savedBevs) {
            setBeverages(JSON.parse(savedBevs));
        } else {
            const initBevs = {};
            for (let i = 1; i <= (statsToLoad.planDuration || 1); i++) {
                initBevs[i] = { morningTea: false, eveningTea: false, sugar: true };
            }
            setBeverages(initBevs);
        }

        // Mark as loaded for this ID
        setLoadedPatientId(selectedPatientId);

    }, [selectedPatientId, user, patients]);

    // Categories mapping
    const getValidCategories = (slot) => {
        switch (slot) {
            case 'breakfast': return ['Breakfast', 'Beverages', 'Eggs & Poultry', 'Cereals & Millets', 'Dairy', 'Fruits'];
            case 'lunch': return ['Main Course', 'Cereals & Millets', 'Pulses & Legumes', 'Dairy', 'Sides', 'Beverages', 'Eggs & Poultry'];
            case 'dinner': return ['Main Course', 'Cereals & Millets', 'Pulses & Legumes', 'Dairy', 'Sides', 'Beverages', 'Eggs & Poultry'];
            case 'snacks': return ['Nuts & Oilseeds', 'Fruits', 'Beverages', 'Snacks', 'Dairy', 'Eggs & Poultry', 'Fats & Oils'];
            default: return [];
        }
    };

    // Save/Load Logic
    const [savedPlans, setSavedPlans] = useState({});
    const [planName, setPlanName] = useState("");
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Initial Load of Saved Plans
    useEffect(() => {
        const saved = localStorage.getItem(`saved_plans_${selectedPatientId}`);
        if (saved) {
            setSavedPlans(JSON.parse(saved));
        } else {
            setSavedPlans({});
        }
    }, [selectedPatientId]);

    // Save logic
    const saveCurrentPlan = () => {
        if (!planName.trim()) return;
        const newSaved = {
            ...savedPlans,
            [planName]: { meals, beverages }
        };
        setSavedPlans(newSaved);
        localStorage.setItem(`saved_plans_${selectedPatientId}`, JSON.stringify(newSaved));
        setShowSaveModal(false);
        setPlanName("");
        toast.success("Plan Saved!");
    };

    // Load Saved Plan
    const loadPlan = (name) => {
        if (!name || !savedPlans[name]) return;

        // This completely replaces current meals
        setMeals(savedPlans[name].meals);
        setBeverages(savedPlans[name].beverages || {});
        toast.success(`Loaded plan: ${name}`);
        setPlanName("");
    };

    // Auto-load from navigation state
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Only run if we specifically have a plan to load in state
        if (location.state?.loadPlan && savedPlans[location.state.loadPlan]) {
            loadPlan(location.state.loadPlan);

            // Clear location state cleanly using navigate replace
            // This ensures React Router sees the state change and doesn't re-trigger
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, savedPlans, navigate, location.pathname]);

    // Smart Filtering Logic
    const isSuitable = (item) => {
        // 1. Diet Type Check
        const dietPref = userStats.dietType || 'veg'; // user's diet
        if (dietPref === 'veg' && item.type === 'non-veg') return false;
        if (dietPref === 'eggitarian' && item.type === 'non-veg') return false; // allows veg + egg

        // 2. Region/Cuisine Check (Soft Filter - prioritize but don't strictly hide unless strict mode requested, but here we will restrict for relevance)
        // Let's implement a 'Smart Match': return true easily, but generatePlan will use strict logic.
        // For search results, we can be a bit more lenient or show ALL allowed by Diet.
        // Let's stick to Diet restriction strictly. Cuisine matching can be visual or sorting.
        return true;
    };

    // Save meals & beverages
    useEffect(() => {
        if (!userStats.targetCalories) return; // Don't save if not loaded

        // CRITICAL FIX: Only save if we have loaded data for the CURRENT selected patient
        // This prevents overwriting the new patient's data with the previous patient's state during transition
        if (loadedPatientId !== selectedPatientId) return;

        const mealKey = `meals_${selectedPatientId}_v2`;
        localStorage.setItem(mealKey, JSON.stringify(meals));

        const bevKey = `beverages_${selectedPatientId}`;
        localStorage.setItem(bevKey, JSON.stringify(beverages));

    }, [meals, beverages, selectedPatientId, userStats, loadedPatientId]);



    // Generator Logic
    const generatePlan = (prefs, force = false) => {
        const duration = prefs.planDuration || 1;
        const newMeals = {};
        const newBevs = {};

        const userDiet = prefs.dietType || 'veg';
        const userCuisine = prefs.cuisine || 'North Indian';

        // 1. Precise Categorization for this DB
        const CATS = {
            BREAKFAST: ['Breakfast'],
            // In DB, Roti/Rice are 'Main Course' or 'Cereals & Millets'. 
            // We include Main Course but logic will try to diversify.
            STAPLES: ['Main Course', 'Cereals & Millets', 'Breads', 'Rice'],
            // Dal is Pulses. Paneer is Sides. Chicken is Main Course/Eggs & Poultry.
            MAINS: ['Pulses & Legumes', 'Sides', 'Eggs & Poultry', 'Main Course'],
            // Lighter sides/accompaniments
            SIDES: ['Dairy', 'Sides', 'Vegetables', 'Salads', 'Soups'],
            SNACKS: ['Nuts & Oilseeds', 'Fruits', 'Snacks', 'Beverages', 'Dairy'], // Yogurt/Milk good for snacks
        };

        // 2. Helper: Get Pool
        const getPool = (categories, strictCuisine = true) => {
            return foodDatabase.filter(f => {
                if (!categories.includes(f.category)) return false;

                // Diet Check (Strict)
                if (userDiet === 'veg' && f.type !== 'veg') return false; // Veg means NO egg, NO meat
                if (userDiet === 'eggitarian' && f.type === 'non-veg') return false; // Eggitarian means NO meat
                // 'non-veg' allows everything

                // Cuisine Check
                if (strictCuisine && f.region && f.region !== userCuisine && f.region !== 'All') return false;

                return true;
            });
        };

        // 3. Smart Picker with Fallback
        const pickItem = (categories, excludeIds = []) => {
            // A. Try Strict Cuisine
            let pool = getPool(categories, true);
            // B. Fallback to All Cuisines if empty
            if (pool.length === 0) pool = getPool(categories, false);

            // Exclude already used IDs
            const filteredPool = pool.filter(i => !excludeIds.includes(i.id));

            // If we filtered everyone out, maybe reuse is better than nothing? 
            // Let's reuse if filteredPool is empty but original pool wasn't.
            const finalPool = filteredPool.length > 0 ? filteredPool : pool;

            if (finalPool.length === 0) return null;

            return finalPool[Math.floor(Math.random() * finalPool.length)];
        };

        // 4. Smart Item Creator (Scaling)
        const createSmartItem = (item, targetCals) => {
            if (!item) return null;
            // Calculate ratio to hit target
            const ratio = targetCals / item.calories;

            // New Total Weight
            let baseWeight = 100;
            if (item.servingSize && item.servingSize.includes('g')) baseWeight = parseInt(item.servingSize) || 100;

            const newWeight = Math.round(baseWeight * ratio);

            // Handle Composition
            let newComposition = null;
            if (item.composition) {
                newComposition = item.composition.map(c => ({
                    ...c,
                    weight: Math.round(c.weight * ratio),
                    calories: Math.round(c.calories * ratio),
                    protein: Math.round((c.protein || 0) * ratio * 10) / 10,
                    carbs: Math.round((c.carbs || 0) * ratio * 10) / 10,
                    fats: Math.round((c.fats || 0) * ratio * 10) / 10
                }));
            }

            return {
                ...item,
                uuid: Date.now() + Math.random(),
                baseCalories: item.calories,
                baseWeight: baseWeight,

                // Scaled Values
                calories: Math.round(targetCals),
                protein: Math.round((item.protein || 0) * ratio),
                carbs: Math.round((item.carbs || 0) * ratio),
                fats: Math.round((item.fats || 0) * ratio),

                heading: `Smart Portion (${newWeight}g)`,
                servingDetails: `${newWeight}g (Auto)`,
                composition: newComposition
            };
        };

        // 5. Build Days
        for (let day = 1; day <= duration; day++) {
            newMeals[day] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            newBevs[day] = { morningTea: false, eveningTea: false, sugar: true };

            // Track used items for this day to promote variety
            const usedIds = [];

            // A. Breakfast (Main Item)
            const bfItem = pickItem(CATS.BREAKFAST, usedIds);
            if (bfItem) {
                newMeals[day].breakfast.push(createSmartItem(bfItem, mealTargets.breakfast));
                usedIds.push(bfItem.id);
            }

            // B. Lunch & Dinner 
            // Strategy: Staple (40%) + Main Dish (40%) + Side/Accompaniment (20%)
            ['lunch', 'dinner'].forEach(slot => {
                const target = mealTargets[slot];

                // 1. Staple (e.g. Rice, Roti)
                const staple = pickItem(CATS.STAPLES, []);
                // Note: We don't exclude staples because eating Rice for lunch and dinner is common.

                // 2. Main Dish (e.g. Dal, Chicken, Paneer)
                const main = pickItem(CATS.MAINS, usedIds);

                // 3. Side (e.g. Yogurt, Salad, Veggie)
                const side = pickItem(CATS.SIDES, usedIds);

                if (staple && main && side) {
                    newMeals[day][slot].push(createSmartItem(staple, target * 0.40));
                    newMeals[day][slot].push(createSmartItem(main, target * 0.40));
                    newMeals[day][slot].push(createSmartItem(side, target * 0.20));
                    usedIds.push(main.id, side.id);
                } else if (staple && main) {
                    // Fallback: 50/50
                    newMeals[day][slot].push(createSmartItem(staple, target * 0.50));
                    newMeals[day][slot].push(createSmartItem(main, target * 0.50));
                    usedIds.push(main.id);
                } else {
                    // Critical Fallback: Pick anything robust
                    const fallback = pickItem([...CATS.STAPLES, ...CATS.MAINS], []);
                    if (fallback) newMeals[day][slot].push(createSmartItem(fallback, target));
                }
            });

            // C. Snacks
            const snkItem = pickItem(CATS.SNACKS, usedIds);
            if (snkItem) {
                newMeals[day].snacks.push(createSmartItem(snkItem, mealTargets.snacks));
            }
        }

        setMeals(newMeals);
        setBeverages(newBevs);
        if (!force) toast.success(`Generated Reasonable ${duration}-Day Plan!`);
    };

    // Helper functions for Current Day
    const currentDayMeals = meals[currentDay] || { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const currentDayBevs = beverages[currentDay] || { morningTea: false, eveningTea: false, sugar: true };


    const getMealTotal = (mealType) => currentDayMeals[mealType]?.reduce((acc, item) => acc + item.calories, 0) || 0;
    const getMealMacros = (mealType) => currentDayMeals[mealType]?.reduce((acc, item) => ({
        p: acc.p + (item.protein || 0),
        c: acc.c + (item.carbs || 0),
        f: acc.f + (item.fats || 0)
    }), { p: 0, c: 0, f: 0 }) || { p: 0, c: 0, f: 0 };

    const beverageCalories = (currentDayBevs.morningTea ? 40 : 0) + (currentDayBevs.eveningTea ? 40 : 0) + ((currentDayBevs.sugar && (currentDayBevs.morningTea || currentDayBevs.eveningTea)) ? 30 : 0);
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

        // Deep copy composition if exists
        const composition = item.composition ? item.composition.map(c => ({ ...c })) : null;

        let finalItem = {
            ...item,
            uuid: Date.now(),
            baseCalories: item.calories,
            baseWeight: baseWeight,
            servingDetails: portionOverride ? `${portionOverride}g (Smart)` : item.servingSize,
            composition: composition
        };
        if (portionOverride) finalItem.calories = Math.round(item.calories * (portionOverride / 100));

        setMeals(prev => {
            const dayMeals = prev[currentDay] || {};
            const currentSlotItems = dayMeals[activeMealSlot] || [];

            return {
                ...prev,
                [currentDay]: {
                    ...dayMeals,
                    [activeMealSlot]: [...currentSlotItems, finalItem]
                }
            };
        });
        setIsSearchOpen(false);
    };

    const removeFood = (mealType, uuid) => {
        setMeals(prev => {
            const dayMeals = prev[currentDay] || {};
            const currentSlotItems = dayMeals[mealType] || [];
            return {
                ...prev,
                [currentDay]: {
                    ...dayMeals,
                    [mealType]: currentSlotItems.filter(i => i.uuid !== uuid)
                }
            };
        });
    };

    const swapItem = (mealType, oldItem, newItem) => {
        setMeals(prev => {
            const dayMeals = prev[currentDay] || {};
            const currentSlotItems = dayMeals[mealType] || [];
            return {
                ...prev,
                [currentDay]: {
                    ...dayMeals,
                    [mealType]: currentSlotItems.map(i => i.uuid === oldItem.uuid ? { ...newItem, uuid: oldItem.uuid, isSwapped: true, servingDetails: newItem.calculatedServing, composition: newItem.composition ? JSON.parse(JSON.stringify(newItem.composition)) : null } : i)
                }
            };
        });
        toast.success("Swapped!");
    };

    const openEdit = (type, item) => {
        setEditingItem({ type, ...item });

        if (item.composition) {
            // Setup composition editing
            setEditComposition(item.composition.map(c => ({
                ...c,
                originalWeight: c.weight,
                originalVals: {
                    cals: c.calories,
                    pro: c.protein,
                    carbs: c.carbs,
                    fats: c.fats
                }
            })));
        } else {
            // Try to pre-fill amount for simple items
            const currentDetails = item.servingDetails || item.servingSize;
            const match = currentDetails && currentDetails.match(/(\d+)g/);
            setEditAmount(match ? match[1] : (item.baseWeight || 100));
        }
    };

    const handleCompositionChange = (index, newWeight) => {
        const updated = [...editComposition];
        const comp = updated[index];
        const w = parseFloat(newWeight) || 0;

        // Use original values if available to prevent generic rounding drift
        if (comp.originalVals && comp.originalWeight) {
            const ratio = w / comp.originalWeight;
            comp.weight = w;
            comp.calories = Math.round(comp.originalVals.cals * ratio);
            comp.protein = Math.round((comp.originalVals.pro || 0) * ratio * 10) / 10;
            comp.carbs = Math.round((comp.originalVals.carbs || 0) * ratio * 10) / 10;
            comp.fats = Math.round((comp.originalVals.fats || 0) * ratio * 10) / 10;
        } else if (comp.weight > 0) {
            // Fallback
            const ratio = w / comp.weight;
            comp.weight = w;
            comp.calories = Math.round(comp.calories * ratio);
            comp.protein = (comp.protein || 0) * ratio;
            comp.carbs = (comp.carbs || 0) * ratio;
            comp.fats = (comp.fats || 0) * ratio;
        } else {
            comp.weight = w;
        }

        setEditComposition(updated);
    }

    const saveEdit = () => {
        if (!editingItem) return;

        let updatedItem = { ...editingItem };

        if (editingItem.composition) {
            // Sum up from editComposition
            const newTotalWeight = editComposition.reduce((acc, c) => acc + (parseFloat(c.weight) || 0), 0);
            const newTotalCals = editComposition.reduce((acc, c) => acc + (c.calories || 0), 0);
            const newTotalPro = editComposition.reduce((acc, c) => acc + (c.protein || 0), 0);
            const newTotalCarbs = editComposition.reduce((acc, c) => acc + (c.carbs || 0), 0);
            const newTotalFats = editComposition.reduce((acc, c) => acc + (c.fats || 0), 0);

            updatedItem = {
                ...updatedItem,
                composition: editComposition,
                calories: Math.round(newTotalCals),
                protein: Math.round(newTotalPro),
                carbs: Math.round(newTotalCarbs),
                fats: Math.round(newTotalFats),
                servingDetails: `${Math.round(newTotalWeight)}g (Custom Comp)`
            };

        } else {
            // Legacy simple edit
            if (!editAmount) return;
            const newWeight = parseInt(editAmount);
            if (isNaN(newWeight) || newWeight <= 0) return;

            // Calculate new calories
            const baseCal = editingItem.baseCalories || editingItem.calories;
            const baseWeight = editingItem.baseWeight || 100;

            const ratio = newWeight / baseWeight;
            const newCalories = Math.round(baseCal * ratio);

            // Update Macros
            const newProtein = Math.round((editingItem.protein || 0) * ratio);
            const newCarbs = Math.round((editingItem.carbs || 0) * ratio);
            const newFats = Math.round((editingItem.fats || 0) * ratio);

            updatedItem = {
                ...updatedItem,
                calories: newCalories,
                protein: newProtein,
                carbs: newCarbs,
                fats: newFats,
                servingDetails: `${newWeight}g (Custom)`
            };
        }

        setMeals(prev => {
            const dayMeals = prev[currentDay] || {};
            const currentSlotItems = dayMeals[editingItem.type] || [];
            return {
                ...prev,
                [currentDay]: {
                    ...dayMeals,
                    [editingItem.type]: currentSlotItems.map(i => i.uuid === editingItem.uuid ? updatedItem : i)
                }
            };
        });

        setEditingItem(null);
        toast.success("Item updated!");
    };

    const searchResults = foodDatabase.filter(f => {
        const matchesQuery = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isCooked = f.isCooked === true;
        const validCats = activeMealSlot ? getValidCategories(activeMealSlot) : [];
        const matchesCategory = validCats.includes(f.category);
        const suitable = isSuitable(f); // Check diet/cuisine compatibility
        return matchesQuery && isCooked && matchesCategory && suitable;
    });

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

    // 3. Loading Guard (Prevents UI Flicker / Stale Data)
    if (loadedPatientId !== selectedPatientId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-300">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium animate-pulse">Loading {getPatientName()}'s Plan...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32 print:p-0 print:pb-0">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-4 print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-4">
                        <Users size={16} />
                        <span>Planning for: {getPatientName()}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowSettings(true)} className="ml-4 text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1 font-bold shadow-sm">
                                <Settings size={12} /> Preferences
                            </button>
                            <button onClick={() => generatePlan(userStats)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full hover:bg-emerald-200 transition-colors flex items-center gap-1 font-bold">
                                <RotateCcw size={12} /> Auto-Generate
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Meal Planner</h2>

                        {/* Saved Plans Dropdown */}
                        {Object.keys(savedPlans).length > 0 && (
                            <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-300 transition-all group">
                                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                    <FolderOpen size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Load Saved Plan</span>
                                    <select
                                        onChange={(e) => loadPlan(e.target.value)}
                                        defaultValue=""
                                        className="text-sm font-semibold text-gray-700 bg-transparent outline-none cursor-pointer min-w-[150px]"
                                    >
                                        <option value="" disabled>Select a plan...</option>
                                        {Object.keys(savedPlans).map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
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
                {(currentDayBevs.morningTea || currentDayBevs.eveningTea) && (
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer border-l pl-6 border-orange-200 hover:text-orange-600 transition-colors animate-in fade-in slide-in-from-left-2 duration-300">
                        <input type="checkbox" checked={currentDayBevs.sugar} onChange={e => updateBeverage('sugar', e.target.checked)} className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4" />
                        With Sugar
                    </label>
                )}
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

                            <button onClick={() => { setActiveMealSlot(type); setIsSearchOpen(true); setSearchQuery(""); }} className="w-full mt-4 py-3 border border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider print:hidden group">
                                <Plus size={16} className="group-hover:scale-110 transition-transform" /> Add {type} Item
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Save Plan Footer */}
            <div className="flex justify-end pt-8 print:hidden">
                <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200"
                >
                    <Save size={18} /> Save Plan
                </button>
            </div>

            {/* Preferences Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-500" /> Plan Settings
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="space-y-6">
                            {/* User Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <Users size={16} /> Planning For
                                </label>
                                <select
                                    value={bufferPatientId}
                                    onChange={(e) => setBufferPatientId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-gray-800 shadow-sm"
                                >
                                    <option value="self">Myself ({user?.name})</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.relationship})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Target Weight Loss & Calorie Display */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Target Weight Loss (kg/month)</label>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="number"
                                            value={bufferStats.targetWeightLoss || 0}
                                            onChange={(e) => handleBufferStatChange('targetWeightLoss', parseFloat(e.target.value) || 0)}
                                            className="flex-1 p-3 border border-gray-200 rounded-xl font-bold text-lg text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                            placeholder="0"
                                            min="0"
                                            max="10"
                                        />
                                        <span className="text-sm text-gray-500 font-medium">kg</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Set to 0 to maintain current weight.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Intake</p>
                                        <p className="text-lg font-bold text-gray-900">{bufferStats.tdee || 2000} <span className="text-xs font-normal text-gray-400">kcal</span></p>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Target Intake</p>
                                        <p className="text-lg font-bold text-emerald-700">{calculateTargetCalories(bufferStats.tdee || 2000, bufferStats.targetWeightLoss || 0)} <span className="text-xs font-normal text-emerald-500">kcal</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Diet Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Diet Preference</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['veg', 'non-veg', 'eggitarian'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleBufferStatChange('dietType', type)}
                                            className={`py-2 px-1 rounded-lg text-sm font-medium capitalize border transition-all ${bufferStats.dietType === type
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cuisine */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cuisine Style</label>
                                <select
                                    value={bufferStats.cuisine || 'North Indian'}
                                    onChange={(e) => handleBufferStatChange('cuisine', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                >
                                    <option value="North Indian">North Indian</option>
                                    <option value="South Indian">South Indian</option>
                                    <option value="International">International</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Plan Duration (Days)</label>
                                <div className="flex gap-2">
                                    {[1, 3, 7].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => handleBufferStatChange('planDuration', d)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${bufferStats.planDuration === d
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {d} Day{d > 1 ? 's' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applySettings}
                                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* The rest of the modals follow... */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">Save Current Plan</h3>
                        <input
                            type="text"
                            placeholder="Enter Plan Name (e.g. 'Low Carb Week 1')"
                            className="w-full p-3 border border-gray-200 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-emerald-500"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2 text-gray-500 font-medium hover:bg-gray-50 rounded-lg">Cancel</button>
                            <button onClick={saveCurrentPlan} className="flex-1 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Modal */}
            {
                isSearchOpen && (
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
                )
            }



            {/* Edit Portion Modal */}
            {
                editingItem && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:hidden">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Edit {editingItem.composition ? 'Composition' : 'Portion'}</h3>
                                <p className="text-sm text-gray-500">{editingItem.name}</p>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {editingItem.composition ? (
                                    <div className="space-y-4">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Raw Ingredients</div>
                                        <div className="bg-gray-50 rounded-xl p-2 space-y-2">
                                            {editComposition.map((comp, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-800 text-sm">{comp.name}</div>
                                                        <div className="text-[10px] text-gray-400">{Math.round(comp.calories)} kcal</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={Math.round(comp.weight)}
                                                            onChange={(e) => handleCompositionChange(idx, e.target.value)}
                                                            className="w-16 text-right font-bold text-emerald-600 border-b border-emerald-200 focus:border-emerald-500 outline-none bg-transparent"
                                                        />
                                                        <span className="text-xs text-gray-400">g</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center pt-2 text-sm">
                                            <span className="font-bold text-gray-500">Total Weight:</span>
                                            <span className="font-bold text-gray-900">{Math.round(editComposition.reduce((a, b) => a + (parseFloat(b.weight) || 0), 0))}g</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-500">Est. Calories:</span>
                                            <span className="font-bold text-emerald-600">{Math.round(editComposition.reduce((a, b) => a + (b.calories || 0), 0))} kcal</span>
                                        </div>
                                    </div>
                                ) : (
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
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setEditingItem(null)} className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                                    <button onClick={saveEdit} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">Save Attributes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Planner;
