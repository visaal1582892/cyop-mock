import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { foodDatabase as staticFoodDatabase } from '../data/foodDatabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('cyop_user');
        return saved ? JSON.parse(saved) : null;
    });

    // Dummy Patients List
    const [patients, setPatients] = useState([
        { id: 'p1', name: 'John Doe', age: 45, gender: 'male', height: 180, weight: 85, relationship: 'Father' },
        { id: 'p2', name: 'Jane Doe', age: 42, gender: 'female', height: 165, weight: 68, relationship: 'Mother' },
        { id: 'p3', name: 'Kid Doe', age: 12, gender: 'male', height: 150, weight: 45, relationship: 'Son' }
    ]);

    // Currently selected patient ID (defaults to 'self' or user.id)
    const [selectedPatientId, setSelectedPatientId] = useState('self');

    useEffect(() => {
        if (user) {
            localStorage.setItem('cyop_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('cyop_user');
        }
    }, [user]);

    // No longer persisting patients to local storage as they are static dummy data for now

    const login = (role) => {
        const dummyUser = {
            id: role === 'admin' ? 'admin_1' : 'user_1',
            name: role === 'admin' ? 'Admin User' : 'Rohit Sharma',
            role: role,
            email: role === 'admin' ? 'admin@cyop.com' : 'user@cyop.com'
        };
        setUser(dummyUser);
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
            patients,
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
