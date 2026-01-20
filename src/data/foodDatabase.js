export const foodDatabase = [
    // --- REAL DATA IMPORTED FROM 'Indian_Food_Master_Calorie and CPF.xlsx' ---
    // Cereals & Millets
    // Breakfast
    {
        id: 1,
        name: "Oats Porridge",
        subType: "Rolled Oats",
        form: "Semi-solid",
        region: "All",
        ediblePortion: 100,
        type: "veg",
        calories: 120,
        protein: 4,
        carbs: 22,
        fats: 2,
        category: "Breakfast",
        servingSize: "1 bowl",
        isCooked: true,
        composition: [
            { name: "Raw Oats", weight: 30, calories: 115, protein: 4, carbs: 20, fats: 2 },
            { name: "Water/Skim Milk", weight: 200, calories: 5, protein: 0, carbs: 2, fats: 0 }
        ]
    },
    {
        id: 2,
        name: "Vegetable Poha",
        subType: "Flattened Rice",
        form: "Solid",
        region: "North Indian", // Consumed widely but typical North/West style
        ediblePortion: 100,
        type: "veg",
        calories: 180,
        protein: 3,
        carbs: 35,
        fats: 4,
        category: "Breakfast",
        servingSize: "1 plate",
        isCooked: true,
        composition: [
            { name: "Raw Poha", weight: 50, calories: 170, protein: 3, carbs: 36, fats: 0.5 },
            { name: "Oil", weight: 3, calories: 30, protein: 0, carbs: 0, fats: 3.5 },
            { name: "Veggies", weight: 50, calories: 15, protein: 0.5, carbs: 2, fats: 0 }
        ]
    },
    {
        id: 3,
        name: "Idli",
        subType: "Rice & Urad Dal",
        form: "Solid",
        region: "South Indian",
        ediblePortion: 100,
        type: "veg",
        calories: 60,
        protein: 2,
        carbs: 12,
        fats: 0,
        category: "Breakfast",
        servingSize: "2 pcs",
        isCooked: true,
        composition: [
            { name: "Idli Batter", weight: 40, calories: 60, protein: 2, carbs: 12, fats: 0 }
        ]
    },
    {
        id: 4,
        name: "Masala Dosa",
        subType: "Rice & Lentil Crepe",
        form: "Solid",
        region: "South Indian",
        ediblePortion: 100,
        type: "veg",
        calories: 250,
        protein: 4,
        carbs: 40,
        fats: 8,
        category: "Breakfast",
        servingSize: "1 pc",
        isCooked: true,
        composition: [
            { name: "Dosa Batter", weight: 80, calories: 130, protein: 3, carbs: 25, fats: 0.5 },
            { name: "Potato Masala", weight: 80, calories: 80, protein: 1, carbs: 15, fats: 3 },
            { name: "Oil", weight: 4, calories: 40, protein: 0, carbs: 0, fats: 4.5 }
        ]
    },
    {
        id: 5,
        name: "Scrambled Eggs",
        subType: "Eggs",
        form: "Semi-solid",
        region: "International",
        ediblePortion: 100,
        type: "egg",
        calories: 180,
        protein: 12,
        carbs: 2,
        fats: 14,
        category: "Breakfast",
        servingSize: "2 eggs",
        isCooked: true,
        composition: [
            { name: "Whole Eggs", weight: 100, calories: 140, protein: 12, carbs: 1, fats: 10 },
            { name: "Butter", weight: 5, calories: 40, protein: 0, carbs: 0, fats: 4 }
        ]
    },

    // Lunch / Dinner - Main Course & Sides
    {
        id: 6,
        name: "Roti (Chapati)",
        subType: "Whole Wheat",
        form: "Solid",
        region: "North Indian",
        ediblePortion: 100,
        type: "veg",
        calories: 85,
        protein: 3,
        carbs: 15,
        fats: 0.5,
        category: "Main Course",
        servingSize: "1 pc",
        isCooked: true,
        composition: [
            { name: "Atta (Wheat Flour)", weight: 25, calories: 85, protein: 3, carbs: 18, fats: 0.5 }
        ]
    },
    {
        id: 7,
        name: "Steamed Rice",
        subType: "White Rice",
        form: "Solid",
        region: "South Indian", // Consumed everywhere but staple in South/East
        ediblePortion: 100,
        type: "veg",
        calories: 130,
        protein: 2.5,
        carbs: 28,
        fats: 0.2,
        category: "Main Course",
        servingSize: "1 bowl",
        isCooked: true,
        composition: [
            { name: "Raw Rice", weight: 40, calories: 130, protein: 2.7, carbs: 30, fats: 0.2 }
        ]
    },
    {
        id: 8,
        name: "Dal Fry",
        subType: "Yellow Lentils",
        form: "Liquid/Semi-solid",
        region: "All",
        ediblePortion: 100,
        type: "veg",
        calories: 150,
        protein: 8,
        carbs: 20,
        fats: 5,
        category: "Pulses & Legumes",
        servingSize: "1 bowl",
        isCooked: true,
        composition: [
            { name: "Raw Dal (Toor)", weight: 30, calories: 100, protein: 6, carbs: 18, fats: 0.5 },
            { name: "Oil/Ghee", weight: 5, calories: 45, protein: 0, carbs: 0, fats: 5 }
        ]
    },
    {
        id: 9,
        name: "Paneer Butter Masala",
        subType: "Cottage Cheese",
        form: "Semi-solid",
        region: "North Indian",
        ediblePortion: 100,
        type: "veg",
        calories: 300,
        protein: 10,
        carbs: 10,
        fats: 25,
        category: "Sides",
        servingSize: "1 bowl",
        isCooked: true,
        composition: [
            { name: "Paneer", weight: 80, calories: 210, protein: 14, carbs: 2, fats: 18 },
            { name: "Butter/Cream", weight: 10, calories: 70, protein: 0, carbs: 1, fats: 7 },
            { name: "Gravy Base", weight: 50, calories: 20, protein: 1, carbs: 4, fats: 0 }
        ]
    },
    {
        id: 10,
        name: "Chicken Curry",
        subType: "Poultry",
        form: "Semi-solid",
        region: "All",
        ediblePortion: 100,
        type: "non-veg",
        calories: 250,
        protein: 20,
        carbs: 5,
        fats: 15,
        category: "Main Course",
        servingSize: "1 bowl",
        isCooked: true,
        composition: [
            { name: "Chicken (Raw)", weight: 100, calories: 120, protein: 20, carbs: 0, fats: 4 },
            { name: "Oil", weight: 10, calories: 90, protein: 0, carbs: 0, fats: 10 },
            { name: "Spices & Onion", weight: 50, calories: 40, protein: 1, carbs: 8, fats: 0 }
        ]
    },
    {
        id: 21,
        name: "Grilled Chicken Breast",
        subType: "Poultry",
        form: "Solid",
        region: "International",
        ediblePortion: 100,
        type: "non-veg",
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        category: "Eggs & Poultry",
        servingSize: "100g",
        isCooked: true,
        composition: [
            { name: "Chicken Breast", weight: 120, calories: 140, protein: 31, carbs: 0, fats: 2 },
            { name: "Oil", weight: 2, calories: 25, protein: 0, carbs: 0, fats: 1.6 }
        ]
    },
    {
        id: 11,
        name: "Sambar",
        subType: "Lentil & Veg Stew",
        form: "Liquid",
        region: "South Indian",
        ediblePortion: 100,
        type: "veg",
        calories: 90,
        protein: 4,
        carbs: 15,
        fats: 2,
        category: "Pulses & Legumes",
        servingSize: "1 bowl",
        isCooked: true,
        composition: [
            { name: "Toor Dal", weight: 20, calories: 70, protein: 4, carbs: 12, fats: 0.5 },
            { name: "Vegetables", weight: 50, calories: 20, protein: 1, carbs: 4, fats: 0 }
        ]
    },

    // Raw Items (Hidden from Cooked Logic, but kept for DB completeness if needed)
    { id: 12, name: "Raw Rice", subType: "Cereal", form: "Grain", region: "All", ediblePortion: 100, type: "veg", calories: 345, protein: 6.8, carbs: 78, fats: 0.5, category: "Cereals & Millets", servingSize: "100g" },
    { id: 13, name: "Raw Dal (Toor)", subType: "Pulse", form: "Dry", region: "All", ediblePortion: 100, type: "veg", calories: 335, protein: 22, carbs: 63, fats: 1.5, category: "Pulses & Legumes", servingSize: "100g" },
    { id: 14, name: "Raw Chicken Breast", subType: "Poultry", form: "Raw Meat", region: "All", ediblePortion: 100, type: "non-veg", calories: 120, protein: 23, carbs: 0, fats: 2.5, category: "Eggs & Poultry", servingSize: "100g" },

    // Ready-to-eat / Cooked equivalents
    {
        id: 15,
        name: "Whole Wheat Bread",
        subType: "Bread",
        form: "Solid",
        region: "International",
        ediblePortion: 100,
        type: "veg",
        calories: 70,
        protein: 3,
        carbs: 12,
        fats: 1,
        category: "Cereals & Millets",
        servingSize: "1 slice",
        isCooked: true
    },
    {
        id: 16,
        name: "Peanut Butter",
        subType: "Nut Butter",
        form: "Semi-solid",
        region: "International",
        ediblePortion: 100,
        type: "veg",
        calories: 95,
        protein: 4,
        carbs: 3,
        fats: 8,
        category: "Fats & Oils",
        servingSize: "1 tbsp",
        isCooked: true
    },

    // Snacks & Others
    {
        id: 17,
        name: "Almonds",
        subType: "Nuts",
        form: "Solid",
        region: "All",
        ediblePortion: 100,
        type: "veg",
        calories: 7,
        protein: 0.25,
        carbs: 0.2,
        fats: 0.6,
        category: "Nuts & Oilseeds",
        servingSize: "1pc",
        isCooked: true
    },
    {
        id: 18,
        name: "Apple",
        subType: "Fruit",
        form: "Solid",
        region: "All",
        ediblePortion: 90,
        type: "veg",
        calories: 60,
        protein: 0.3,
        carbs: 14,
        fats: 0.2,
        category: "Fruits",
        servingSize: "100g",
        isCooked: true
    },
    {
        id: 19,
        name: "Banana",
        subType: "Fruit",
        form: "Solid",
        region: "All",
        ediblePortion: 65,
        type: "veg",
        calories: 90,
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        category: "Fruits",
        servingSize: "100g",
        isCooked: true
    },
    {
        id: 20,
        name: "Green Tea",
        subType: "Beverage",
        form: "Liquid",
        region: "International",
        ediblePortion: 100,
        type: "veg",
        calories: 2,
        protein: 0,
        carbs: 0,
        fats: 0,
        category: "Beverages",
        servingSize: "1 cup",
        isCooked: true
    },
    {
        id: 22,
        name: "Greek Yogurt",
        subType: "Yogurt",
        form: "Semi-solid",
        region: "International",
        ediblePortion: 100,
        type: "veg",
        calories: 60,
        protein: 10,
        carbs: 3.5,
        fats: 0.4,
        category: "Dairy",
        servingSize: "100g",
        isCooked: true
    },
    {
        id: 23,
        name: "Curd (Dahi)",
        subType: "Yogurt",
        form: "Semi-solid",
        region: "All",
        ediblePortion: 100,
        type: "veg",
        calories: 60,
        protein: 3,
        carbs: 4.5,
        fats: 3,
        category: "Dairy",
        servingSize: "100g",
        isCooked: true
    },
];
