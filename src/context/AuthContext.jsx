import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { foodDatabase as staticFoodDatabase } from '../data/foodDatabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('cyop_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Patients list for the logged-in user
    // In a real app, this would be fetched from API
    const [patients, setPatients] = useState(() => {
        const saved = localStorage.getItem('cyop_patients');
        return saved ? JSON.parse(saved) : [];
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

    useEffect(() => {
        localStorage.setItem('cyop_patients', JSON.stringify(patients));
    }, [patients]);

    const login = (role) => {
        const dummyUser = {
            id: role === 'admin' ? 'admin_1' : 'user_1',
            name: role === 'admin' ? 'Admin User' : 'Regular User',
            role: role,
            email: role === 'admin' ? 'admin@cyop.com' : 'user@cyop.com'
        };
        setUser(dummyUser);
        setSelectedPatientId('self'); // Reset selection on login
    };

    const logout = () => {
        setUser(null);
        setPatients([]); // Optional: clear patients on logout if local-only
        setSelectedPatientId('self');
        localStorage.removeItem('cyop_user');
    };

    const addPatient = (patient) => {
        const newPatient = { ...patient, id: Date.now().toString() };
        setPatients(prev => [...prev, newPatient]);
    };

    const deletePatient = (patientId) => {
        setPatients(prev => prev.filter(p => p.id !== patientId));
        if (selectedPatientId === patientId) {
            setSelectedPatientId('self');
        }
    };

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
            addPatient,
            deletePatient,
            selectedPatientId,
            setSelectedPatientId,
            foodDatabase,
            addCustomFoods
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
