import { useState } from 'react';
import { FiSearch, FiX, FiGrid, FiList } from 'react-icons/fi';

export default function DataTable({
    columns,
    data,
    loading,
    searchValue,
    onSearchChange,
    onRowClick,
    emptyMessage = "No data found",
    emptyIcon = null,
    emptyAction = null, // Custom action button for empty state
    mobileCardRender = null // Custom render function for mobile cards
}) {
    const [viewMode, setViewMode] = useState(
        typeof window !== 'undefined' && window.innerWidth < 640 ? 'cards' : 'table'
    ); // 'table' or 'cards'

    // Render loading skeleton
    const renderSkeleton = () => (
        <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="skeleton skeleton-avatar" />
                    <div className="flex-1">
                        <div className="skeleton skeleton-title" />
                        <div className="skeleton skeleton-text w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );

    // Render empty state
    const renderEmpty = () => (
        <div className="empty-state py-16">
            <div className="empty-state-icon">
                {emptyIcon || <FiGrid size={32} />}
            </div>
            <h3 className="empty-state-title">No Results</h3>
            <p className="empty-state-text">{emptyMessage}</p>
            {emptyAction && <div style={{ marginTop: '1rem' }}>{emptyAction}</div>}
        </div>
    );

    // Render mobile card view
    const renderCards = () => (
        <div className="card-list p-4">
            {data.map((row, index) => (
                <div
                    key={row.id || index}
                    onClick={() => onRowClick?.(row)}
                    className={`card-list-item animate-fade-in ${onRowClick ? 'cursor-pointer' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    {mobileCardRender ? (
                        mobileCardRender(row)
                    ) : (
                        <div className="space-y-3">
                            {columns
                                .filter(col => col.key !== 'actions')
                                .slice(0, 4)
                                .map((col) => (
                                    <div key={col.key} className="flex justify-between items-center">
                                        <span className="text-sm text-[var(--text-muted)]">{col.label}</span>
                                        <span className="font-medium text-sm">
                                            {col.render ? col.render(row) : row[col.key] || '-'}
                                        </span>
                                    </div>
                                ))}
                            {/* Actions row */}
                            {columns.find(col => col.key === 'actions') && (
                                <div className="pt-3 border-t border-white/5 flex justify-end gap-2">
                                    {columns.find(col => col.key === 'actions').render(row)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    // Render table view
    const renderTable = () => (
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
                    {data.map((row, index) => (
                        <tr
                            key={row.id || index}
                            onClick={() => onRowClick?.(row)}
                            className={`
                                animate-fade-in
                                ${onRowClick ? 'cursor-pointer' : ''}
                            `}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className={col.className}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="card card-no-hover overflow-hidden">
            {/* Header with Search and View Toggle */}
            {(onSearchChange || data.length > 0) && (
                <div className="card-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Search */}
                        {onSearchChange && (
                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', minWidth: '200px' }}>
                                <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchValue}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="input"
                                    style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem', width: '100%' }}
                                />
                                {searchValue && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        style={{
                                            position: 'absolute',
                                            right: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--text-muted)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        <FiX size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* View Mode Toggle - Mobile Only */}
                        <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`btn-icon-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                                title="Card View"
                            >
                                <FiGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`btn-icon-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                title="Table View"
                            >
                                <FiList size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                renderSkeleton()
            ) : data.length === 0 ? (
                renderEmpty()
            ) : (
                <>
                    {/* Mobile: Show cards or table based on toggle */}
                    <div className="hide-tablet-up">
                        {viewMode === 'cards' ? renderCards() : renderTable()}
                    </div>
                    {/* Desktop: Always show table */}
                    <div className="hide-mobile">
                        {renderTable()}
                    </div>
                </>
            )}
        </div>
    );
}
