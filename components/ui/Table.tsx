import React from 'react';

// This is a placeholder as the implementation depends heavily on usage.
// A more robust table would have generic props for columns, data, etc.
const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                {children}
            </table>
        </div>
    );
};

export default Table;
