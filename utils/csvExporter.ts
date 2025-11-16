// utils/csvExporter.ts

const flattenObject = (obj: any, parentKey = '', res: { [key: string]: any } = {}): { [key: string]: any } => {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const propName = parentKey ? parentKey + '_' + key : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], propName, res);
            } else {
                res[propName] = obj[key];
            }
        }
    }
    return res;
};


const convertToCSV = (data: any[], headers: string[] | null = null): string => {
    if (data.length === 0) {
        return '';
    }
    
    // Flatten nested objects for better CSV representation
    const flatData = data.map(row => flattenObject(row));

    const columnHeaders = headers || Object.keys(flatData[0]);

    const headerRow = columnHeaders.map(header => `"${String(header).replace(/"/g, '""')}"`).join(',');

    const rows = flatData.map(row => {
        return columnHeaders.map(header => {
            const value = row[header];
            if (value === null || value === undefined) {
                return '';
            }
            const stringValue = String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
};

export const exportToCsv = (filename: string, data: any[], headers: string[] | null = null): void => {
    if(!filename.endsWith('.csv')) {
        filename += '.csv';
    }
    const csvString = convertToCSV(data, headers);
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
