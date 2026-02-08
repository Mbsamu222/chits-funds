import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    FiPieChart, FiTrendingUp,
    FiCalendar, FiGrid, FiBarChart2, FiShield,
    FiDownload, FiFileText, FiFile, FiChevronDown
} from 'react-icons/fi';
import { LuIndianRupee } from "react-icons/lu";
import toast from 'react-hot-toast';
import {
    exportOverviewToExcel,
    exportChitsToExcel,
    exportMonthlyToExcel,
    exportAllToExcel,
    exportOverviewToPdf,
    exportChitsToPdf,
    exportMonthlyToPdf,
    exportAllToPdf
} from '../utils/exportReports';

export default function Reports() {
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [chitProfits, setChitProfits] = useState([]);
    const [monthlyProfits, setMonthlyProfits] = useState([]);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Export handlers
    const handleExport = (type, format) => {
        try {
            if (format === 'excel') {
                switch (type) {
                    case 'overview':
                        exportOverviewToExcel(dashboardData, chitProfits);
                        break;
                    case 'chits':
                        exportChitsToExcel(chitProfits);
                        break;
                    case 'monthly':
                        exportMonthlyToExcel(monthlyProfits);
                        break;
                    case 'all':
                        exportAllToExcel(dashboardData, chitProfits, monthlyProfits);
                        break;
                }
                toast.success(`Excel report exported successfully!`);
            } else if (format === 'pdf') {
                switch (type) {
                    case 'overview':
                        exportOverviewToPdf(dashboardData, chitProfits);
                        break;
                    case 'chits':
                        exportChitsToPdf(chitProfits);
                        break;
                    case 'monthly':
                        exportMonthlyToPdf(monthlyProfits);
                        break;
                    case 'all':
                        exportAllToPdf(dashboardData, chitProfits, monthlyProfits);
                        break;
                }
                toast.success(`PDF report exported successfully!`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export report');
        }
        setShowExportMenu(false);
    };

    useEffect(() => {
        if (isAdmin()) {
            fetchReportData();
        }
    }, []);

    const fetchReportData = async () => {
        try {
            const [dashboardRes, chitsRes, monthlyRes] = await Promise.all([
                api.get('/reports/dashboard'),
                api.get('/reports/profit/chits'),
                api.get('/reports/profit/monthly')
            ]);
<<<<<<< HEAD
            setDashboardData(dashboardRes.data);
            setChitProfits(chitsRes.data);
            
            // Handle both array response and object with months property
            const monthlyData = Array.isArray(monthlyRes.data) 
                ? monthlyRes.data 
                : (monthlyRes.data?.months || []);
            console.log('[DEBUG] Monthly data:', monthlyData);
            setMonthlyProfits(monthlyData);
        } catch (error) {
            console.error('[DEBUG] Reports error:', error);
=======

            // Transform dashboard data to flat structure for easy access
            const dashboard = dashboardRes.data;
            setDashboardData({
                total_profit: dashboard.financial?.total_profit || 0,
                monthly_collection: dashboard.financial?.total_collected || 0,
                active_chits: dashboard.stats?.total_chits || 0,
                pending_amount: dashboard.financial?.total_payout || 0,
                total_users: dashboard.stats?.total_users || 0,
                total_collected: dashboard.financial?.total_collected || 0
            });

            // Transform chit profits - backend uses 'profit', frontend expects 'total_profit'
            const chits = chitsRes.data || [];
            setChitProfits(chits.map(c => ({
                ...c,
                total_profit: c.profit || 0
            })));

            // Transform monthly profits - backend returns { year, months: [...] }
            const monthlyData = monthlyRes.data;
            const months = monthlyData?.months || [];
            setMonthlyProfits(months.map(m => {
                const [year, month] = m.month.split('-');
                return {
                    year: parseInt(year),
                    month: parseInt(month),
                    total_collected: m.total_collected || 0,
                    total_payouts: m.total_payout || 0,
                    profit: m.profit || 0
                };
            }));
        } catch (error) {
            console.error('Failed to load reports:', error);
>>>>>>> 02bde006476464e20ac8c8541abfe3de23c883c3
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (!isAdmin()) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                }}>
                    <FiShield style={{ color: 'var(--danger)' }} size={32} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-muted)' }}>Reports are only available to administrators.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-pulse">
                <div className="skeleton" style={{ height: '64px', borderRadius: '1rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '1rem' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '320px', borderRadius: '1rem' }} />
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FiPieChart },
        { id: 'chits', label: 'By Chit', icon: FiGrid },
        { id: 'monthly', label: 'Monthly', icon: FiCalendar }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                        Financial <span style={{ color: 'var(--primary)' }}>Reports</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Comprehensive analytics and profit tracking
                    </p>
                </div>

                {/* Export Dropdown */}
                <div ref={exportMenuRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FiDownload size={18} />
                        Export
                        <FiChevronDown
                            size={16}
                            style={{
                                transform: showExportMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        />
                    </button>

                    {showExportMenu && (
                        <div
                            className="card animate-fade-in export-dropdown-menu"
                        >
                            {/* Complete Report */}
                            <div style={{ padding: '0.5rem', marginBottom: '0.5rem' }}>
                                <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Complete Report
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleExport('all', 'excel')}
                                        className="btn btn-secondary"
                                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}
                                    >
                                        <FiFileText size={14} style={{ color: '#10b981' }} /> Excel
                                    </button>
                                    <button
                                        onClick={() => handleExport('all', 'pdf')}
                                        className="btn btn-secondary"
                                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}
                                    >
                                        <FiFile size={14} style={{ color: '#ef4444' }} /> PDF
                                    </button>
                                </div>
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

                            {/* Individual Reports */}
                            <div style={{ padding: '0.5rem' }}>
                                <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Individual Reports
                                </p>

                                {/* Overview */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiPieChart size={14} style={{ color: 'var(--primary)' }} />
                                        <span style={{ fontSize: '0.875rem' }}>Overview</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button onClick={() => handleExport('overview', 'excel')} className="btn-icon-sm btn-ghost" title="Export Excel">
                                            <FiFileText size={14} style={{ color: '#10b981' }} />
                                        </button>
                                        <button onClick={() => handleExport('overview', 'pdf')} className="btn-icon-sm btn-ghost" title="Export PDF">
                                            <FiFile size={14} style={{ color: '#ef4444' }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Chit-wise */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiGrid size={14} style={{ color: 'var(--warning)' }} />
                                        <span style={{ fontSize: '0.875rem' }}>Chit-wise</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button onClick={() => handleExport('chits', 'excel')} className="btn-icon-sm btn-ghost" title="Export Excel">
                                            <FiFileText size={14} style={{ color: '#10b981' }} />
                                        </button>
                                        <button onClick={() => handleExport('chits', 'pdf')} className="btn-icon-sm btn-ghost" title="Export PDF">
                                            <FiFile size={14} style={{ color: '#ef4444' }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Monthly */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiCalendar size={14} style={{ color: 'var(--info)' }} />
                                        <span style={{ fontSize: '0.875rem' }}>Monthly</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button onClick={() => handleExport('monthly', 'excel')} className="btn-icon-sm btn-ghost" title="Export Excel">
                                            <FiFileText size={14} style={{ color: '#10b981' }} />
                                        </button>
                                        <button onClick={() => handleExport('monthly', 'pdf')} className="btn-icon-sm btn-ghost" title="Export PDF">
                                            <FiFile size={14} style={{ color: '#ef4444' }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiTrendingUp size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Total Profit</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>
                                {formatCurrency(dashboardData?.total_profit)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                flexShrink: 0
                            }}
                        >
                            <LuIndianRupee size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>This Month</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                                {formatCurrency(dashboardData?.monthly_collection)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiGrid size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Active Chits</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800 }}>
                                {dashboardData?.active_chits}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                flexShrink: 0
                            }}
                        >
                            <FiBarChart2 size={18} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Pending</p>
                            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--warning)' }}>
                                {formatCurrency(dashboardData?.pending_amount)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                            background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface-light)',
                            color: activeTab === tab.id ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        <tab.icon size={16} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Quick Stats */}
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiPieChart style={{ color: 'var(--primary)' }} />
                                Business Overview
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--surface-light)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Users</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{dashboardData?.total_users}</p>
                                </div>
                                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--surface-light)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Collections</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {formatCurrency(dashboardData?.total_collected)}
                                    </p>
                                </div>
                                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--surface-light)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Avg. Profit</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {chitProfits.length > 0
                                            ? formatCurrency(dashboardData?.total_profit / chitProfits.length)
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Performing Chits */}
                        {chitProfits.length > 0 && (
                            <div className="card" style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiTrendingUp style={{ color: 'var(--success)' }} />
                                    Top Performing Chits
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {chitProfits.slice(0, 5).map((chit, index) => (
                                        <div
                                            key={chit.chit_id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.75rem',
                                                borderRadius: '0.75rem',
                                                background: 'var(--surface-light)',
                                                transition: 'background 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '0.5rem',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                fontSize: '0.875rem',
                                                flexShrink: 0
                                            }}>
                                                {index + 1}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chit.chit_name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {chit.completed_months} months completed
                                                </p>
                                            </div>
                                            <p style={{ fontWeight: 700, color: 'var(--success)', flexShrink: 0 }}>
                                                +{formatCurrency(chit.total_profit)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'chits' && (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chit Group</th>
                                        <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }} className="hide-mobile">Total</th>
                                        <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collected</th>
                                        <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chitProfits.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                                No chit data available
                                            </td>
                                        </tr>
                                    ) : (
                                        chitProfits.map((chit, index) => (
                                            <tr
                                                key={chit.chit_id}
                                                className="animate-fade-in"
                                                style={{ animationDelay: `${index * 50}ms`, borderTop: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <td style={{ padding: '1rem' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 500 }}>{chit.chit_name}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {chit.completed_months} months
                                                        </p>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '1rem' }} className="hide-mobile">
                                                    {formatCurrency(chit.total_amount)}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '1rem', color: 'var(--primary)' }}>
                                                    {formatCurrency(chit.total_collected)}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '1rem', fontWeight: 700, color: 'var(--success)' }}>
                                                    +{formatCurrency(chit.total_profit)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {chitProfits.length > 0 && (
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 700 }} colSpan={2} className="hide-mobile">Total</td>
                                            <td style={{ padding: '1rem', fontWeight: 700 }} className="mobile-only">Total</td>
                                            <td style={{ textAlign: 'right', padding: '1rem', fontWeight: 700, color: 'var(--primary)' }} className="hide-mobile">
                                                {formatCurrency(chitProfits.reduce((s, c) => s + c.total_collected, 0))}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '1rem', fontWeight: 700, color: 'var(--success)' }}>
                                                +{formatCurrency(chitProfits.reduce((s, c) => s + c.total_profit, 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'monthly' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Monthly Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                            {monthlyProfits.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                                    <FiCalendar style={{ margin: '0 auto', color: 'var(--text-dim)', marginBottom: '0.75rem' }} size={40} />
                                    <p style={{ color: 'var(--text-muted)' }}>No monthly data available</p>
                                </div>
                            ) : (
                                monthlyProfits.slice(0, 12).map((month, index) => (
                                    <div
                                        key={`${month.year}-${month.month}`}
                                        className="card animate-fade-in"
                                        style={{ padding: '1.25rem', animationDelay: `${index * 50}ms` }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '0.75rem',
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: 'var(--primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <FiCalendar size={18} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700 }}>
                                                        {new Date(month.year, month.month - 1).toLocaleDateString('en-IN', {
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Collected</span>
                                                <span style={{ fontWeight: 500, color: 'var(--primary)' }}>
                                                    {formatCurrency(month.total_collected)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Payouts</span>
                                                <span style={{ fontWeight: 500, color: 'var(--warning)' }}>
                                                    -{formatCurrency(month.total_payouts)}
                                                </span>
                                            </div>
                                            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 500 }}>Profit</span>
                                                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                                                    +{formatCurrency(month.profit)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
