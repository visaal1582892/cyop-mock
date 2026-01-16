import XLSX from 'xlsx';
import fs from 'fs';

const files = [
    'nutri plan.xlsx',
    'Indian_Food_Master_Calorie and CPF.xlsx'
];

files.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            let output = `\n--- Inspecting: ${file} ---\n`;
            const workbook = XLSX.readFile(file);
            const sheetName = workbook.SheetNames[0];
            output += `Sheet Name: ${sheetName}\n`;

            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (data.length > 0) {
                output += `Headers: ${JSON.stringify(data[0])}\n`;
                output += `First 5 Rows of Data:\n${JSON.stringify(data.slice(1, 6), null, 2)}\n`;
            } else {
                output += 'Sheet is empty.\n';
            }
            fs.appendFileSync('excel_dump.txt', output);
        } else {
            fs.appendFileSync('excel_dump.txt', `File not found: ${file}\n`);
        }
    } catch (e) {
        fs.appendFileSync('excel_dump.txt', `Error reading ${file}: ${e.message}\n`);
    }
});
