import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

const Admin = () => {
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
    const [stats, setStats] = useState(null);
    const [errors, setErrors] = useState([]);

    const requiredHeaders = ['Food Item', 'Serving Size', 'Calories', 'Protein', 'Carbs', 'Fats', 'Category'];

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadStatus("uploading");
        setErrors([]);
        setStats(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validateAndProcess(results);
            },
            error: (email, err) => {
                setUploadStatus("error");
                setErrors([err.message]);
                toast.error("Failed to parse file");
            }
        });
    };

    const validateAndProcess = (results) => {
        const headers = results.meta.fields;
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            setUploadStatus("error");
            setErrors([`Missing required headers: ${missingHeaders.join(', ')}`]);
            toast.error("Invalid file format");
            return;
        }

        const data = results.data;
        let validationErrors = [];
        let validCount = 0;

        data.forEach((row, index) => {
            if (!row['Food Item'] || !row['Calories']) {
                validationErrors.push(`Row ${index + 2}: Missing Name or Calories`);
            } else if (isNaN(row['Calories'])) {
                validationErrors.push(`Row ${index + 2}: Calories must be a number`);
            } else {
                validCount++;
            }
        });

        if (validCount === 0 && data.length > 0) {
            setUploadStatus("error");
            setErrors(["No valid data found in file."]);
            toast.error("No valid data found");
        } else {
            setStats({ total: data.length, valid: validCount });
            setUploadStatus("success");
            if (validationErrors.length > 0) {
                setErrors(validationErrors.slice(0, 5)); // Show top 5 errors
                if (validationErrors.length > 5) setErrors(prev => [...prev, `...and ${validationErrors.length - 5} more errors`]);
                toast.success(`Processed with warnings`);
            } else {
                toast.success(`Successfully processed ${validCount} items!`);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
                <p className="text-gray-500">Manage food database and settings.</p>
            </header>

            <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center space-y-4 hover:border-emerald-400 transition-colors group">
                <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Bulk Food Upload</h3>
                    <p className="text-gray-500 mt-1 max-w-md mx-auto">Upload an Excel/CSV file to update the master food database. Ensure headers match the template.</p>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <label className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                        Select CSV File
                    </label>
                    <button className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-all flex items-center gap-2">
                        <FileSpreadsheet size={18} /> Download Template
                    </button>
                </div>
            </div>

            {uploadStatus === "success" && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-bottom-2">
                    <CheckCircle className="text-emerald-600 shrink-0" size={24} />
                    <div>
                        <h4 className="font-bold text-emerald-800">Upload Successful</h4>
                        <p className="text-emerald-700 text-sm mt-1">Parsed {stats?.valid} food items successfully.</p>
                        {errors.length > 0 && (
                            <div className="mt-3 bg-white/50 p-3 rounded-lg text-xs text-orange-700">
                                <p className="font-bold flex items-center gap-1"><AlertTriangle size={12} /> validation warnings:</p>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {uploadStatus === "error" && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-bottom-2">
                    <AlertCircle className="text-red-600 shrink-0" size={24} />
                    <div>
                        <h4 className="font-bold text-red-800">Upload Failed</h4>
                        <ul className="list-disc pl-4 mt-1 text-sm text-red-700 space-y-1">
                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            {uploadStatus === "uploading" && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-center gap-3 animate-pulse">
                    <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-700 font-medium">Processing file...</span>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Required CSV Headers</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Food Item</th>
                                <th className="px-4 py-3">Serving Size</th>
                                <th className="px-4 py-3">Calories</th>
                                <th className="px-4 py-3">Protein</th>
                                <th className="px-4 py-3">Carbs</th>
                                <th className="px-4 py-3">Fats</th>
                                <th className="px-4 py-3 rounded-r-lg">Category</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-4 py-3 font-medium">Oats</td>
                                <td className="px-4 py-3">100g</td>
                                <td className="px-4 py-3">389</td>
                                <td className="px-4 py-3">16.9</td>
                                <td className="px-4 py-3">66.3</td>
                                <td className="px-4 py-3">6.9</td>
                                <td className="px-4 py-3">Grains</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
