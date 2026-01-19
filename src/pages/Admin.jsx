import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Activity, Upload, FileText, Download } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Admin = () => {
    const { user, addCustomFoods } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [uploadedData, setUploadedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        // Reset input value to allow re-uploading the same file
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setUploading(false);
                    toast.error("File appears to be empty.");
                    return;
                }

                // Get headers from the first row of data
                const fields = Object.keys(data[0]);

                // Helper to find a header case-insensitively
                const findHeader = (target) => fields.find(h => h.toLowerCase().trim() === target.toLowerCase());

                const headerMap = {
                    name: findHeader('Food Item') || findHeader('Food Name') || findHeader('Item') || findHeader('Name'),
                    calories: findHeader('Calories') || findHeader('Kcal') || findHeader('Cal'),
                    protein: findHeader('Protein'),
                    carbs: findHeader('Carbs') || findHeader('Carbohydrates'),
                    fats: findHeader('Fats') || findHeader('Fat'),
                    category: findHeader('Category'),
                    serving: findHeader('Serving Size') || findHeader('Serving')
                };

                // Validate required headers
                if (!headerMap.name || !headerMap.calories) {
                    setUploading(false);
                    // Show exactly what headers were found to help debugging
                    toast.error(`Missing required columns. Found headers: ${fields.join(', ')}`);
                    return;
                }

                // Map CSV/Excel headers to internal format using the map
                const formattedData = data
                    .filter(row => row[headerMap.name] && (row[headerMap.calories] || row[headerMap.calories] === 0))
                    .map((row, index) => ({
                        id: `custom_${Date.now()}_${index}`,
                        name: row[headerMap.name]?.trim(),
                        calories: Number(row[headerMap.calories]),
                        protein: Number(row[headerMap.protein] || 0),
                        carbs: Number(row[headerMap.carbs] || 0),
                        fats: Number(row[headerMap.fats] || 0),
                        category: row[headerMap.category]?.trim() || 'Other',
                        servingSize: row[headerMap.serving]?.trim() || '100g'
                    }));

                setUploadedData(formattedData);
                setCurrentPage(1);

                if (formattedData.length > 0) {
                    addCustomFoods(formattedData);
                    setTimeout(() => {
                        setUploading(false);
                        toast.success(`Successfully uploaded ${formattedData.length} items!`);
                    }, 1000);
                } else {
                    setUploading(false);
                    toast.error("No valid data rows found.");
                }
            } catch (error) {
                console.error(error);
                setUploading(false);
                toast.error("Failed to parse file: " + error.message);
            }
        };

        reader.onerror = () => {
            setUploading(false);
            toast.error("Failed to read file.");
        };

        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const headers = ["Food Item", "Serving Size", "Calories", "Protein", "Carbs", "Fats", "Category"];
        const data = [
            ["Oats", "100g", 389, 16.9, 66.3, 6.9, "Grains"],
            ["Chicken Breast (Grilled)", "100g", 165, 31, 0, 3.6, "Poultry"],
            ["Banana", "Medium (118g)", 105, 1.3, 27, 0.3, "Fruits"],
            ["Almonds", "28g (Approx 23)", 164, 6, 6, 14, "Nuts"],
            ["Whole Milk", "1 cup (244g)", 149, 8, 12, 8, "Dairy"],
            ["Egg (Large, Boiled)", "1 large", 78, 6, 0.6, 5, "Eggs"],
            ["Brown Rice (Cooked)", "100g", 112, 2.3, 23.5, 0.8, "Grains"],
            ["Greek Yogurt (Plain)", "100g", 59, 10, 3.6, 0.4, "Dairy"],
            ["Spinach (Raw)", "100g", 23, 2.9, 3.6, 0.4, "Vegetables"],
            ["Salmon (Cooked)", "100g", 206, 22, 0, 12, "Fish"]
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Food_Upload_Template.xlsx");
    };

    // Pagination Logic
    const totalPages = Math.ceil(uploadedData.length / itemsPerPage);
    const paginatedData = uploadedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Admin Panel</h2>
                <p className="text-gray-500 mt-2">System overview and data management.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-2xl shadow-inner">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Users</p>
                        <h3 className="text-3xl font-bold text-gray-900">1,234</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Plans</p>
                        <h3 className="text-3xl font-bold text-gray-900">892</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 rounded-2xl shadow-inner">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">System Status</p>
                        <h3 className="text-3xl font-bold text-gray-900">Healthy</h3>
                    </div>
                </div>
            </div>

            {/* Bulk Upload Section */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center max-w-4xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-sm rotate-3 transform transition-transform hover:rotate-6">
                    <Upload size={32} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Bulk Food Upload</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                    Expand your food database by uploading Excel or CSV files. <br />
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">Supports .xlsx, .csv</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <label className={`cursor-pointer bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 hover:scale-105 transition-all flex items-center gap-3 shadow-lg ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <FileText size={20} />
                        {uploading ? 'Uploading...' : 'Select Data File'}
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>

                    <button
                        onClick={downloadTemplate}
                        className="px-8 py-4 rounded-2xl font-bold text-gray-600 border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-3"
                    >
                        <Download size={20} />
                        Download Template
                    </button>
                </div>

                {/* Data Preview / Instructions Table */}
                <div className="mt-12 text-left bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                                <FileText size={18} />
                            </div>
                            {uploadedData.length > 0 ? `Uploaded Data (${uploadedData.length} items)` : 'Required Headers Template'}
                        </h4>

                        {uploadedData.length > 0 && (
                            <div className="flex items-center gap-2 text-sm bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-30 font-medium transition-colors"
                                >
                                    Prev
                                </button>
                                <span className="text-gray-800 font-bold px-2">
                                    {currentPage} <span className="text-gray-300 font-normal">/</span> {totalPages}
                                </span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-30 font-medium transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Food Item</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Serving</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Kcal</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Pro</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Carb</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Fat</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Category</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 divide-y divide-gray-50">
                                {uploadedData.length > 0 ? (
                                    paginatedData.map((row, index) => (
                                        <tr key={index} className="hover:bg-emerald-50/30 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-emerald-700">{row.name}</td>
                                            <td className="px-6 py-4">{row.servingSize}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{row.calories}</td>
                                            <td className="px-6 py-4">{row.protein}</td>
                                            <td className="px-6 py-4">{row.carbs}</td>
                                            <td className="px-6 py-4">{row.fats}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">{row.category}</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">Oats</td>
                                        <td className="px-6 py-4">100g</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">389</td>
                                        <td className="px-6 py-4">16.9</td>
                                        <td className="px-6 py-4">66.3</td>
                                        <td className="px-6 py-4">6.9</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">Grains</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
