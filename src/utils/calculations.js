// Basic Metabolic Rate (BMR) using Mifflin-St Jeor Equation
export const calculateBMR = (weight, height, age, gender) => {
    // weight in kg, height in cm, age in years
    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        return 10 * weight + 6.25 * height - 5 * age - 161;
    }
};

// Total Daily Energy Expenditure (TDEE)
export const calculateTDEE = (bmr, activityLevel) => {
    const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
    };
    return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

export const calculateTargetCalories = (tdee, goal, targetChangeKg = 0) => {
    // 1kg fat approx 7700 calories. 
    // Target change per month -> daily deficit/surplus. 
    // e.g. 2kg/month = 2 * 7700 / 30 = ~513 cal/day

    // Default standard deficits/surplus:
    let adjustment = 0;

    if (goal === 'loss') {
        adjustment = targetChangeKg ? -((targetChangeKg * 7700) / 30) : -500;
    } else if (goal === 'gain') {
        adjustment = targetChangeKg ? ((targetChangeKg * 7700) / 30) : 500;
    }

    return Math.round(tdee + adjustment);
};

export const calculateMacros = (calories) => {
    // Standard balanced diet: 30% Protein, 40% Carbs, 30% Fats
    // 1g Protein = 4 cal, 1g Carb = 4 cal, 1g Fat = 9 cal
    return {
        protein: Math.round((calories * 0.30) / 4),
        carbs: Math.round((calories * 0.40) / 4),
        fats: Math.round((calories * 0.30) / 9),
    };
};

export const findSwaps = (originalItem, database) => {
    if (!originalItem) return [];

    // Find items in same category or compatible category
    const candidates = database.filter(item =>
        item.id !== originalItem.id &&
        (item.category === originalItem.category || item.category === "Snacks" || item.category === "Breakfast") // Simplification
    );

    // Return items with calculated quantity to match calories
    return candidates.map(item => {
        const ratio = originalItem.calories / item.calories;
        const newServingWeight = Math.round(parseFloat(item.servingSize) * ratio) || item.servingSize;
        // note: servingSize parsing is rough if it contains 'g' or 'pc', handling below

        let originalWeight = parseFloat(originalItem.servingSize) || 100; // default 100 if parse fails
        if (originalItem.servingSize.includes('pc')) originalWeight = 1; // 1pc is unit

        let targetWeight = parseFloat(item.servingSize) || 100;
        if (item.servingSize.includes('pc')) targetWeight = 1;

        // If calories are per servingSize...
        // We want Item Quantity X such that X * (ItemCal / ItemServing) = OriginalCal
        // X = OriginalCal * ItemServing / ItemCal

        const calculatedWeight = Math.round((originalItem.calories * targetWeight) / item.calories);

        return {
            ...item,
            calculatedServing: item.servingSize.includes('pc') ? (originalItem.calories / item.calories).toFixed(1) + ' pc' : calculatedWeight + 'g',
            caloriesDifference: 0 // by definition we are matching colories roughly
        };
    }).slice(0, 5); // Return top 5
};
