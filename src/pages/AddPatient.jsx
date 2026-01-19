import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const AddPatient = () => {
    const { addPatient } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "male",
        height: "",
        weight: "",
        relationship: "other"
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.age || !formData.height || !formData.weight) {
            toast.error("Please fill in all required fields (Name, Age, Height, Weight)");
            return;
        }

        addPatient({
            ...formData,
            age: Number(formData.age),
            height: Number(formData.height),
            weight: Number(formData.weight)
        });
        toast.success("Patient added successfully!");
        navigate('/');
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-20">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Add New Patient</h2>
                <p className="text-gray-500 mt-2">Create a profile for someone you are caring for.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. John Doe"
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Years"
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                        <input
                            type="number"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            placeholder="e.g. 175"
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="e.g. 70"
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>

                    <div className="form-group md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship (Optional)</label>
                        <input
                            name="relationship"
                            value={formData.relationship}
                            onChange={handleChange}
                            placeholder="e.g. Spouse, Parent, Child"
                            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-6 py-2 text-gray-500 hover:text-gray-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPatient;
