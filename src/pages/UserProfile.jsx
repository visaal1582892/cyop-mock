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
        goal: "maintenance",
        targetChange: 0,
        dietType: "veg",
        cuisine: "North Indian"
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
            setFormData(parsed); // This will trigger the calculation effect below
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

    // Calculate stats and autosave
    useEffect(() => {
        // Only calculate if valid
        if (Object.keys(validationErrors).length > 0) return;

        const bmr = calculateBMR(formData.weight, formData.height, formData.age, formData.gender);
        const tdee = calculateTDEE(formData.weight);
        const targetCalories = calculateTargetCalories(tdee, formData.goal, formData.targetChange);
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
        if (name === 'targetChange') {
            if (Math.abs(value) > 10) error = "Target change > 10kg/m is unsafe";
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (['age', 'height', 'weight', 'targetChange'].includes(name)) {
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Profile & Goals</h2>
                    <p className="text-gray-500 mt-2">Manage personalized nutritional roadmaps.</p>
                </div>

                {/* Patient Selector */}
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                        <Users size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Planning for</p>
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:text-emerald-600 transition-colors w-full min-w-[150px]"
                        >
                            <option value="self">Myself ({user?.name})</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                    <section className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
                            <UserIcon className="w-5 h-5 text-emerald-500" /> Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Name" name="name" value={formData.name} onChange={handleChange} />
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <InputGroup label="Age (years)" type="number" name="age" value={formData.age} onChange={handleChange} error={validationErrors.age} />
                            <InputGroup label="Height (cm)" type="number" name="height" value={formData.height} onChange={handleChange} error={validationErrors.height} />
                            <InputGroup label="Weight (kg)" type="number" name="weight" value={formData.weight} onChange={handleChange} error={validationErrors.weight} />
                            <div className="form-group md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                                <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50">
                                    <option value="sedentary">Sedentary (Little or no exercise)</option>
                                    <option value="light">Lightly Active (1-3 days/week)</option>
                                    <option value="moderate">Moderately Active (3-5 days/week)</option>
                                    <option value="active">Very Active (6-7 days/week)</option>
                                    <option value="veryActive">Super Active (Physical job/training)</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
                            <Target className="w-5 h-5 text-blue-500" /> Goals & Preferences
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
                                <div className="flex gap-4 p-1 bg-gray-50 rounded-lg inline-flex">
                                    {['loss', 'maintenance', 'gain'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => handleChange({ target: { name: 'goal', value: g } })}
                                            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${formData.goal === g
                                                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-gray-200'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {g === 'loss' ? 'Weight Loss' : g === 'gain' ? 'Muscle Gain' : 'Maintenance'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.goal !== 'maintenance' && (
                                <InputGroup
                                    label={`Target Change (kg/month) +/-`}
                                    type="number"
                                    name="targetChange"
                                    value={formData.targetChange}
                                    onChange={handleChange}
                                    subtext="Recommended: 2kg/month"
                                    error={validationErrors.targetChange}
                                />
                            )}

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
                                <select name="dietType" value={formData.dietType} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50">
                                    <option value="veg">Vegetarian</option>
                                    <option value="non-veg">Non-Vegetarian</option>
                                    <option value="eggitarian">Eggitarian</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Preference</label>
                                <select name="cuisine" value={formData.cuisine} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50">
                                    <option value="North Indian">North Indian</option>
                                    <option value="South Indian">South Indian</option>
                                    <option value="East Indian">East Indian</option>
                                    <option value="West Indian">West Indian</option>
                                    <option value="Global">Global / Continental</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-1 order-1 lg:order-2">
                    <div className="relative lg:sticky lg:top-6 space-y-6">
                        <div className={`bg-emerald-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden transition-colors ${Object.keys(validationErrors).length > 0 ? 'grayscale opacity-75' : ''}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <div className="relative z-10">
                                <p className="text-emerald-100 font-medium text-sm uppercase tracking-wide">Daily Target</p>
                                <h2 className="text-5xl font-bold mt-2">{stats.targetCalories}</h2>
                                <span className="text-xl text-emerald-200">kcal</span>

                                <div className="mt-6 pt-6 border-t border-emerald-500/30 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-emerald-200 text-xs">Maintenance</p>
                                        <p className="font-semibold text-lg">{stats.tdee} kcal</p>
                                    </div>
                                    <div>
                                        <p className="text-emerald-200 text-xs">BMR</p>
                                        <p className="font-semibold text-lg">{Math.round(stats.bmr)} kcal</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {Object.keys(validationErrors).length > 0 && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-red-700 text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                <div>
                                    <p className="font-bold">Errors in inputs:</p>
                                    <ul className="list-disc pl-4 mt-1">
                                        {Object.values(validationErrors).map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-orange-500" /> Macronutrient Split
                            </h3>
                            <MacroDonut macros={stats.macros} total={stats.targetCalories} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, subtext, error, ...props }) => (
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
                }`}
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

const UserIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
)

export default UserProfile;
