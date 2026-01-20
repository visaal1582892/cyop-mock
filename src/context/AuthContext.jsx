import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { foodDatabase as staticFoodDatabase } from '../data/foodDatabase';
import { userDatabase, mainUser } from '../data/userDatabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('cyop_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Persistent Patients List
    const [patients, setPatients] = useState(() => {
        const saved = localStorage.getItem('cyop_patients_v2');
        if (saved) return JSON.parse(saved);
        return userDatabase;
    });

    // Currently selected patient ID (defaults to 'self' or user.id)
    const [selectedPatientId, setSelectedPatientId] = useState('self');

    useEffect(() => {
        if (user) {
            localStorage.setItem('cyop_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('cyop_user');
        }
    }, [user]);

    // Persist patients
    useEffect(() => {
        localStorage.setItem('cyop_patients_v2', JSON.stringify(patients));
    }, [patients]);

    const login = (role) => {
        // Use mainUser from DB if role is user, otherwise generic admin
        const userData = role === 'admin' ? {
            id: 'admin_1',
            name: 'Admin User',
            role: 'admin',
            email: 'admin@cyop.com'
        } : mainUser;

        setUser(userData);
        setSelectedPatientId('self'); // Reset selection on login
    };

    const logout = () => {
        setUser(null);
        setSelectedPatientId('self');
        localStorage.removeItem('cyop_user');
    };

    // addPatient and deletePatient removed as requested

    // Custom Foods Persistence
    const [customFoods, setCustomFoods] = useState(() => {
        const saved = localStorage.getItem('cyop_custom_foods');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cyop_custom_foods', JSON.stringify(customFoods));
    }, [customFoods]);

    const addCustomFoods = (newFoods) => {
        setCustomFoods(prev => [...prev, ...newFoods]);
    };

    // Merge static and custom foods
    const foodDatabase = useMemo(() => {
        return [...staticFoodDatabase, ...customFoods];
    }, [customFoods]);

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            patients,
            selectedPatientId,
            setSelectedPatientId,
            foodDatabase,
            addCustomFoods,
            updateUser: (updates) => setUser(prev => ({ ...prev, ...updates })),
            updatePatient: (id, updates) => setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
