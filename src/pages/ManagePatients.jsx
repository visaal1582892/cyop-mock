import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserPlus, Users, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ManagePatients = () => {
    const { patients, deletePatient } = useAuth();
    const navigate = useNavigate();

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this patient profile? This action cannot be undone.")) {
            deletePatient(id);
            toast.success("Patient profile deleted.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Manage Patients</h2>
                    <p className="text-gray-500 mt-2">View and manage profiles you create.</p>
                </div>
                <button
                    onClick={() => navigate('/add-patient')}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                    <UserPlus size={18} /> Add New
                </button>
            </header>

            {patients.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Patients Added</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        You haven't added any patient profiles yet. Add family members or clients to manage their diet plans.
                    </p>
                    <button
                        onClick={() => navigate('/add-patient')}
                        className="mt-6 text-emerald-600 font-medium hover:text-emerald-700 hover:underline"
                    >
                        Add your first patient
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patients.map(patient => (
                        <div key={patient.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-bold text-gray-900">{patient.name}</h3>
                                <div className="text-xs text-gray-500 mt-1 space-x-2">
                                    <span>{patient.age} yrs</span>
                                    <span>•</span>
                                    <span className="capitalize">{patient.gender}</span>
                                    {patient.relationship && (
                                        <>
                                            <span>•</span>
                                            <span className="capitalize">{patient.relationship}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(patient.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Profile"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManagePatients;
