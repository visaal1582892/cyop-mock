import React, { useState, useEffect } from 'react';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../utils/calculations';
import { Activity, Target, Utensils, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const UserProfile = () => {
    const { user, patients, selectedPatientId, setSelectedPatientId } = useAuth();

    // Default form data structure
    const initialForm = {
        name: "Guest User",
        age: 30,
        gender: "male",
        height: 175,
        weight: 75,
        activityLevel: "sedentary",
        targetWeightLoss: 0, // Simplified from goal/targetChange
        dietType: "veg",
        cuisine: "North Indian",
        planDuration: 3
    };

    const [formData, setFormData] = useState(initialForm);
    const [validationErrors, setValidationErrors] = useState({});
    const [stats, setStats] = useState({
        bmr: 0,
        tdee: 0,
        targetCalories: 0,
        macros: { protein: 0, carbs: 0, fats: 0 }
    });

    // Load data when selectedPatientId changes
    useEffect(() => {
        const storageKey = `userStats_${selectedPatientId}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
            const parsed = JSON.parse(savedData);
            setFormData({
                ...initialForm,
                ...parsed, // Merge saved data
                // Migrate old data if needed
                targetWeightLoss: parsed.targetWeightLoss || parsed.targetChange || 0
            });
        } else {
            // New profile or no data, reset to defaults or patient details if available
            if (selectedPatientId !== 'self') {
                const patient = patients.find(p => p.id === selectedPatientId);
                setFormData({
                    ...initialForm,
                    name: patient?.name || "New Patient",
                    age: patient?.age || 30,
                    gender: patient?.gender || "male",
                    height: patient?.height || 175,
                    weight: patient?.weight || 75
                });
            } else {
                setFormData({ ...initialForm, name: user?.name || "Regular User" });
            }
        }
    }, [selectedPatientId]);

    // Calculate stats and autosave immediately on change
    useEffect(() => {
        // Only calculate if valid
        if (Object.keys(validationErrors).length > 0) return;

        const bmr = calculateBMR(formData.weight, formData.height, formData.age, formData.gender);
        const tdee = calculateTDEE(formData.weight);
        // Using updated logic: targetWeightLoss is typically positive for loss
        const targetCalories = calculateTargetCalories(tdee, formData.targetWeightLoss);
        const macros = calculateMacros(targetCalories);

        setStats({ bmr, tdee, targetCalories, macros });

        // Persist to specific key
        const storageKey = `userStats_${selectedPatientId}`;
        localStorage.setItem(storageKey, JSON.stringify({ ...formData, ...stats, targetCalories }));
    }, [formData, validationErrors, selectedPatientId]);

    const validate = (name, value) => {
        let error = null;
        if (name === 'age') {
            if (value < 10 || value > 100) error = "Age must be between 10-100";
        }
        if (name === 'height') {
            if (value < 50 || value > 250) error = "Height must be 50-250 cm";
        }
        if (name === 'weight') {
            if (value < 20 || value > 300) error = "Weight must be 20-300 kg";
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (['age', 'height', 'weight', 'targetWeightLoss'].includes(name)) {
            finalValue = Number(value);
            const error = validate(name, finalValue);

            setValidationErrors(prev => {
                const newErrs = { ...prev };
                if (error) newErrs[name] = error;
                else delete newErrs[name];
                return newErrs;
            });
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header - Simplified */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Patient Profile</h2>
                    <p className="text-gray-500 mt-2">Manage physical attributes and calculate goals.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Input Section - Refactored */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-800">
                            <Activity className="w-5 h-5 text-emerald-500" /> Physical Attributes
                        </h3>

                        {/* Name Select - "Long Field" */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name / Profile Selection</label>
                            <div className="relative">
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    className="w-full p-4 pl-12 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-bold text-gray-800 appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="self">Myself ({user?.name})</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.relationship})</option>
                                    ))}
                                </select>
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* Top Priority Editable Inputs: Height, Weight, Age, Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup
                                label="Height (cm)"
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                error={validationErrors.height}
                                className="text-lg font-semibold"
                            />
                            <InputGroup
                                label="Weight (kg)"
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                error={validationErrors.weight}
                                className="text-lg font-semibold"
                            />
                            <InputGroup
                                label="Age"
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                error={validationErrors.age}
                                className="text-lg font-semibold"
                            />
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                                <select
                                    name="activityLevel"
                                    value={formData.activityLevel}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 text-base font-medium"
                                >
                                    <option value="sedentary">Sedentary (Little/No Exercise)</option>
                                    <option value="light">Lightly Active (1-3 days)</option>
                                    <option value="moderate">Moderately Active (3-5 days)</option>
                                    <option value="active">Very Active (6-7 days)</option>
                                    <option value="veryActive">Super Active (Physical Job)</option>
                                </select>
                            </div>
                        </div>

                        {/* Read-only / Less emphasized fields */}
                        <div className="grid grid-cols-1 gap-6 pt-4 mt-4 border-t border-gray-50">
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Gender (Auto-set)</label>
                                <div className="w-full p-3 rounded-lg border border-gray-100 bg-gray-100 text-gray-500 capitalize">
                                    {formData.gender}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-gray-800">
                            <Target className="w-5 h-5 text-blue-500" /> Goal & Preferences
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Single Target Weight Loss Field */}
                            <div className="form-group md:col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Target Weight Loss (kg)</label>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Leave 0 for Maintenance</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="targetWeightLoss"
                                        value={formData.targetWeightLoss}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-lg font-bold text-gray-800"
                                        placeholder="e.g. 2"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg/month</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Entering a target here will automatically adjust your daily calorie budget to create a safe deficit.
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diet Style</label>
                                <select name="dietType" value={formData.dietType} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                                    <option value="veg">Vegetarian</option>
                                    <option value="non-veg">Non-Vegetarian</option>
                                    <option value="eggitarian">Eggetarian</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Preference</label>
                                <select name="cuisine" value={formData.cuisine} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                                    <option value="North Indian">North Indian</option>
                                    <option value="South Indian">South Indian</option>
                                    <option value="International">International</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>

                            <div className="form-group md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Duration</label>
                                <div className="flex gap-4">
                                    {[1, 3, 7].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => handleChange({ target: { name: 'planDuration', value: d } })}
                                            className={`flex-1 py-2 rounded-lg border font-medium transition-all ${formData.planDuration === d
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {d} Day{d > 1 ? 's' : ''}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {formData.planDuration === 3 ? "Recommended for consistency. Repeat twice for a full week." : ""}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-6">
                        <div className={`bg-gray-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all duration-300 ${Object.keys(validationErrors).length > 0 ? 'grayscale opacity-75' : ''}`}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                            <div className="relative z-10">
                                <p className="text-gray-400 font-medium text-sm uppercase tracking-wide">Daily Target</p>
                                <h2 className="text-6xl font-bold mt-2 tracking-tight">{stats.targetCalories}</h2>
                                <span className="text-xl text-gray-500">kcal</span>

                                <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-2 gap-6">
                                    <div className="col-span-2 text-center">
                                        <p className="text-gray-400 text-xs mb-1">Maintenance (TDEE)</p>
                                        <p className="font-semibold text-xl">{stats.tdee} <span className="text-xs font-normal text-gray-600">kcal</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-orange-500" /> Macronutrients
                            </h3>
                            <MacroDonut macros={stats.macros} total={stats.targetCalories} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, subtext, error, className, ...props }) => (
    <div className="form-group relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {subtext && <span className="text-xs text-gray-400 ml-2 font-normal">({subtext})</span>}
        </label>
        <input
            {...props}
            className={`w-full p-2.5 rounded-lg border focus:ring-2 focus:border-transparent outline-none transition-all font-medium ${error
                ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-900'
                : 'border-gray-200 bg-gray-50 focus:ring-emerald-500'
                } ${className}`}
        />
        {error && <span className="text-xs text-red-500 absolute -bottom-4 left-1">{error}</span>}
    </div>
);

const MacroDonut = ({ macros, total }) => {
    // Fixed Ratios: Carbs 45%, Protein 30%, Fats 25%
    const radius = 60;
    const circumference = 2 * Math.PI * radius; // ~377

    // Segments calculation
    const carbOffset = 0;
    const carbDash = circumference * 0.45;

    const proteinOffset = -carbDash;
    const proteinDash = circumference * 0.30;

    const fatOffset = -(carbDash + proteinDash);
    const fatDash = circumference * 0.25;

    return (
        <div className="flex flex-col items-center w-full">
            <div className="relative w-48 h-48 mb-6">
                {/* Background Circle */}
                <svg width="100%" height="100%" viewBox="0 0 160 160" className="transform -rotate-90">
                    <circle cx="80" cy="80" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="20" />

                    {/* Carbs Segment (Emerald) */}
                    <circle
                        cx="80" cy="80" r={radius} fill="none" stroke="#10b981" strokeWidth="20"
                        strokeDasharray={`${carbDash} ${circumference}`}
                        strokeDashoffset={carbOffset}
                    />

                    {/* Protein Segment (Blue) */}
                    <circle
                        cx="80" cy="80" r={radius} fill="none" stroke="#3b82f6" strokeWidth="20"
                        strokeDasharray={`${proteinDash} ${circumference}`}
                        strokeDashoffset={proteinOffset}
                    />

                    {/* Fats Segment (Orange) */}
                    <circle
                        cx="80" cy="80" r={radius} fill="none" stroke="#f97316" strokeWidth="20"
                        strokeDasharray={`${fatDash} ${circumference}`}
                        strokeDashoffset={fatOffset}
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-bold text-gray-800">{total}</span>
                    <span className="text-xs text-gray-500 font-medium">kcal/day</span>
                </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-medium text-gray-700">Carbs (45%)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{macros.carbs}g</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium text-gray-700">Protein (30%)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{macros.protein}g</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium text-gray-700">Fats (25%)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{macros.fats}g</span>
                </div>
            </div>
        </div>
    )
}

export default UserProfile;
