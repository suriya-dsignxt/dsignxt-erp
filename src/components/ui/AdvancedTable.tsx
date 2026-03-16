'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, Download } from 'lucide-react';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    sortable?: boolean;
    className?: string; // Additional classes for the cell
}

interface AdvancedTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchResult?: string; // Optional external search string if needed
    onSelectionChange?: (selectedIds: string[]) => void; // If provided, shows checkboxes
    actions?: React.ReactNode; // Actions to show when items are selected
    keyField: keyof T; // Unique ID field (usually '_id')
    isLoading?: boolean;
    title?: string; // Optional title above table
    searchPlaceholder?: string;
    renderGridLayout?: (item: T) => React.ReactNode;
    initialViewMode?: 'list' | 'grid';
}

export default function AdvancedTable<T extends Record<string, any>>({
    data,
    columns,
    onSelectionChange,
    actions,
    keyField,
    isLoading = false,
    title,
    searchPlaceholder = "Search...",
    renderGridLayout,
    initialViewMode = 'list'
}: AdvancedTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(initialViewMode);

    // 1. Filter Data
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        return data.filter(item => {
            return Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [data, searchTerm]);

    // 2. Sort Data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key as string];
            const bVal = b[sortConfig.key as string];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // 3. Paginate Data
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Handlers
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = paginatedData.map(item => String(item[keyField]));
            setSelectedItems(new Set(allIds));
            if (onSelectionChange) onSelectionChange(allIds);
        } else {
            setSelectedItems(new Set());
            if (onSelectionChange) onSelectionChange([]);
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
        if (onSelectionChange) onSelectionChange(Array.from(newSelected));
    };

    const renderCell = (item: T, column: Column<T>) => {
        const value = typeof column.accessor === 'function'
            ? column.accessor(item)
            : item[column.accessor];

        if (typeof value === 'function') {
            console.error('AdvancedTable: Accessor returned a function for column.', value);
            return 'Invalid Data';
        }
        return value;
    };

    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {/* Table Header: Search & Actions */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">

                {/* Left: Title or Search */}
                <div className="flex items-center gap-4 flex-1">
                    {title && <h3 className="font-bold text-navy-900 hidden md:block">{title}</h3>}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                    </div>
                </div>

                {/* Right: Actions & View Toggle */}
                <div className="flex items-center gap-2">
                    {/* View Toggle (Only if Grid Layout is provided) */}
                    {renderGridLayout && (
                        <div className="hidden md:flex bg-gray-100 p-1 rounded-lg mr-2">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                title="List View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Grid View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </button>
                        </div>
                    )}

                    {/* Show bulk actions if selection active */}
                    {selectedItems.size > 0 && actions && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 mr-4">
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                {selectedItems.size} Selected
                            </span>
                            {actions}
                        </div>
                    )}

                    {/* View/Export Toggles could go here */}
                </div>
            </div>

            {/* Content Area */}
            {paginatedData.length > 0 ? (
                <>
                    {/* View: Desktop Table */}
                    <div className={`hidden md:block overflow-x-auto ${viewMode === 'grid' ? '!hidden' : ''}`}>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                <tr>
                                    {/* Checkbox Column */}
                                    {onSelectionChange && (
                                        <th className="px-6 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(String(item[keyField])))}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                    )}

                                    {/* Data Columns */}
                                    {columns.map((col, idx) => (
                                        <th
                                            key={idx}
                                            className={`px-6 py-3 ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                            onClick={() => col.sortable && typeof col.accessor === 'string' && handleSort(col.accessor as string)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.header}
                                                {sortConfig.key === col.accessor && (
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.map((item, rowIdx) => (
                                    <tr key={rowIdx} className={`hover:bg-gray-50/50 transition-colors ${selectedItems.has(String(item[keyField])) ? 'bg-orange-50/10' : ''}`}>
                                        {onSelectionChange && (
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                    checked={selectedItems.has(String(item[keyField]))}
                                                    onChange={() => handleSelectRow(String(item[keyField]))}
                                                />
                                            </td>
                                        )}
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className={`px-6 py-4 ${col.className || ''}`}>
                                                {renderCell(item, col)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* View: Desktop Grid (if enabled) */}
                    {viewMode === 'grid' && renderGridLayout && (
                        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-gray-50">
                            {paginatedData.map((item, idx) => (
                                <div key={idx} className="relative group">
                                    {/* Selection Checkbox for Grid Items */}
                                    {onSelectionChange && (
                                        <div className={`absolute top-3 right-3 z-10 ${selectedItems.has(String(item[keyField])) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 shadow-sm"
                                                checked={selectedItems.has(String(item[keyField]))}
                                                onChange={() => handleSelectRow(String(item[keyField]))}
                                            />
                                        </div>
                                    )}
                                    {renderGridLayout(item)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* View: Mobile Cards (Default if no grid layout provided, or fallback for small screens) */}
                    <div className="md:hidden flex flex-col gap-4 p-4 bg-gray-50">
                        {/* Use custom grid layout for mobile too if simple enough, otherwise stick to default card */}
                        {renderGridLayout ? (
                            paginatedData.map((item, idx) => (
                                <div key={idx} className="relative">
                                    {onSelectionChange && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                checked={selectedItems.has(String(item[keyField]))}
                                                onChange={() => handleSelectRow(String(item[keyField]))}
                                            />
                                        </div>
                                    )}
                                    {renderGridLayout(item)}
                                </div>
                            ))
                        ) : (
                            paginatedData.map((item, rowIdx) => (
                                <div
                                    key={rowIdx}
                                    className={`bg-white rounded-xl p-4 shadow-sm border transition-colors relative
                                    ${selectedItems.has(String(item[keyField])) ? 'border-orange-200 bg-orange-50/20' : 'border-gray-200'}`}
                                >
                                    {/* Selection Checkbox */}
                                    {onSelectionChange && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                checked={selectedItems.has(String(item[keyField]))}
                                                onChange={() => handleSelectRow(String(item[keyField]))}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3 pr-8">
                                        {columns.map((col, colIdx) => (
                                            <div key={colIdx} className="flex flex-col gap-1">
                                                {col.header && <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{col.header}</span>}
                                                <div className={`text-sm ${col.header === 'Status' ? 'inline-block' : ''}`}>
                                                    {renderCell(item, col)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="p-12 text-center text-gray-500">
                    No records found matching your search.
                </div>
            )}

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
                <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-orange-500"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <span>per page</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="mr-2">
                        {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
