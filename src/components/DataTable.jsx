import { FiSearch, FiX } from 'react-icons/fi';

export default function DataTable({
    columns,
    data,
    loading,
    searchValue,
    onSearchChange,
    onRowClick,
    emptyMessage = "No data found"
}) {
    return (
        <div className="card">
            {/* Search */}
            {onSearchChange && (
                <div className="card-header">
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="input pl-11 pr-10"
                        />
                        {searchValue && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} className={col.className}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8">
                                    <div className="spinner mx-auto"></div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8 text-[var(--text-muted)]">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={row.id || index}
                                    onClick={() => onRowClick?.(row)}
                                    className={onRowClick ? 'cursor-pointer' : ''}
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={col.className}>
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
