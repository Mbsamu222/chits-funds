import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export utilities for generating modern, styled Excel and PDF reports
 */

// Format currency for display
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);
};

// Format date for display
const formatDate = (date = new Date()) => {
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

// =====================
// EXCEL EXPORT FUNCTIONS
// =====================

/**
 * Create a styled Excel workbook with modern design
 */
const createStyledWorkbook = () => {
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: "Chits Fund Report",
        Subject: "Financial Report",
        Author: "Chits Fund Management System",
        CreatedDate: new Date()
    };
    return wb;
};

/**
 * Style configuration for Excel cells
 */
const getExcelStyles = () => ({
    header: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: "6366F1" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "4F46E5" } },
            bottom: { style: "thin", color: { rgb: "4F46E5" } },
            left: { style: "thin", color: { rgb: "4F46E5" } },
            right: { style: "thin", color: { rgb: "4F46E5" } }
        }
    },
    title: {
        font: { bold: true, sz: 16, color: { rgb: "1F2937" } },
        alignment: { horizontal: "center" }
    },
    currency: {
        numFmt: "₹#,##0",
        alignment: { horizontal: "right" }
    },
    currencyPositive: {
        numFmt: "₹#,##0",
        font: { color: { rgb: "10B981" } },
        alignment: { horizontal: "right" }
    },
    currencyNegative: {
        numFmt: "₹#,##0",
        font: { color: { rgb: "EF4444" } },
        alignment: { horizontal: "right" }
    }
});

/**
 * Export Overview Report to Excel
 */
export const exportOverviewToExcel = (dashboardData, chitProfits) => {
    const wb = createStyledWorkbook();

    // Overview Sheet
    const overviewData = [
        ["CHITS FUND - FINANCIAL OVERVIEW REPORT"],
        [`Generated on: ${formatDate()}`],
        [],
        ["SUMMARY STATISTICS"],
        [],
        ["Metric", "Value"],
        ["Total Profit", formatCurrency(dashboardData?.total_profit)],
        ["Monthly Collection", formatCurrency(dashboardData?.monthly_collection)],
        ["Total Collected", formatCurrency(dashboardData?.total_collected)],
        ["Active Chits", dashboardData?.active_chits || 0],
        ["Total Users", dashboardData?.total_users || 0],
        ["Pending Amount", formatCurrency(dashboardData?.pending_amount)],
        [],
        ["TOP PERFORMING CHITS"],
        [],
        ["Rank", "Chit Name", "Months Completed", "Total Collected", "Profit"]
    ];

    chitProfits.slice(0, 10).forEach((chit, index) => {
        overviewData.push([
            index + 1,
            chit.chit_name,
            chit.completed_months,
            formatCurrency(chit.total_collected),
            formatCurrency(chit.total_profit)
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(overviewData);

    // Set column widths
    ws['!cols'] = [
        { wch: 8 },   // Rank
        { wch: 25 },  // Chit Name
        { wch: 18 },  // Months Completed
        { wch: 18 },  // Total Collected
        { wch: 18 }   // Profit
    ];

    // Merge title cell
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
        { s: { r: 13, c: 0 }, e: { r: 13, c: 4 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Overview");

    // Download
    XLSX.writeFile(wb, `ChitsFund_Overview_Report_${formatDate().replace(/\s/g, '_')}.xlsx`);
};

/**
 * Export Chit-wise Report to Excel
 */
export const exportChitsToExcel = (chitProfits) => {
    const wb = createStyledWorkbook();

    const data = [
        ["CHITS FUND - CHIT-WISE PROFIT REPORT"],
        [`Generated on: ${formatDate()}`],
        [],
        ["Chit Name", "Total Amount", "Months Completed", "Total Collected", "Total Payout", "Profit", "Status"]
    ];

    let totalCollected = 0;
    let totalPayout = 0;
    let totalProfit = 0;

    chitProfits.forEach(chit => {
        data.push([
            chit.chit_name,
            formatCurrency(chit.total_amount),
            `${chit.completed_months} / ${chit.total_months}`,
            formatCurrency(chit.total_collected),
            formatCurrency(chit.total_payout),
            formatCurrency(chit.total_profit),
            chit.is_active ? "Active" : "Inactive"
        ]);
        totalCollected += chit.total_collected;
        totalPayout += chit.total_payout;
        totalProfit += chit.total_profit;
    });

    // Add totals row
    data.push([]);
    data.push([
        "TOTAL",
        "",
        "",
        formatCurrency(totalCollected),
        formatCurrency(totalPayout),
        formatCurrency(totalProfit),
        ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
        { wch: 25 },  // Chit Name
        { wch: 15 },  // Total Amount
        { wch: 18 },  // Months Completed
        { wch: 18 },  // Total Collected
        { wch: 15 },  // Total Payout
        { wch: 15 },  // Profit
        { wch: 10 }   // Status
    ];

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Chit-wise Report");
    XLSX.writeFile(wb, `ChitsFund_Chitwise_Report_${formatDate().replace(/\s/g, '_')}.xlsx`);
};

/**
 * Export Monthly Report to Excel
 */
export const exportMonthlyToExcel = (monthlyProfits) => {
    const wb = createStyledWorkbook();

    const data = [
        ["CHITS FUND - MONTHLY PROFIT REPORT"],
        [`Generated on: ${formatDate()}`],
        [],
        ["Month", "Year", "Total Collected", "Total Payouts", "Profit"]
    ];

    let totalCollected = 0;
    let totalPayouts = 0;
    let totalProfit = 0;

    monthlyProfits.forEach(month => {
        const monthName = new Date(month.year, month.month - 1).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric'
        });
        data.push([
            monthName,
            month.year,
            formatCurrency(month.total_collected),
            formatCurrency(month.total_payouts),
            formatCurrency(month.profit)
        ]);
        totalCollected += month.total_collected;
        totalPayouts += month.total_payouts;
        totalProfit += month.profit;
    });

    data.push([]);
    data.push([
        "TOTAL",
        "",
        formatCurrency(totalCollected),
        formatCurrency(totalPayouts),
        formatCurrency(totalProfit)
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
        { wch: 20 },  // Month
        { wch: 10 },  // Year
        { wch: 18 },  // Total Collected
        { wch: 18 },  // Total Payouts
        { wch: 15 }   // Profit
    ];

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
    XLSX.writeFile(wb, `ChitsFund_Monthly_Report_${formatDate().replace(/\s/g, '_')}.xlsx`);
};

/**
 * Export All Reports to Excel (Multiple Sheets)
 */
export const exportAllToExcel = (dashboardData, chitProfits, monthlyProfits) => {
    const wb = createStyledWorkbook();

    // Sheet 1: Overview
    const overviewData = [
        ["CHITS FUND - COMPLETE FINANCIAL REPORT"],
        [`Generated on: ${formatDate()}`],
        [],
        ["SUMMARY"],
        [],
        ["Metric", "Value"],
        ["Total Profit", formatCurrency(dashboardData?.total_profit)],
        ["Monthly Collection", formatCurrency(dashboardData?.monthly_collection)],
        ["Total Collected", formatCurrency(dashboardData?.total_collected)],
        ["Active Chits", dashboardData?.active_chits || 0],
        ["Total Users", dashboardData?.total_users || 0]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
    ws1['!cols'] = [{ wch: 20 }, { wch: 20 }];
    ws1['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Sheet 2: Chit-wise
    const chitData = [
        ["CHIT-WISE BREAKDOWN"],
        [],
        ["Chit Name", "Total Amount", "Completed", "Collected", "Payout", "Profit"]
    ];
    chitProfits.forEach(chit => {
        chitData.push([
            chit.chit_name,
            formatCurrency(chit.total_amount),
            chit.completed_months,
            formatCurrency(chit.total_collected),
            formatCurrency(chit.total_payout),
            formatCurrency(chit.total_profit)
        ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(chitData);
    ws2['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Chit-wise");

    // Sheet 3: Monthly
    const monthData = [
        ["MONTHLY BREAKDOWN"],
        [],
        ["Month", "Collected", "Payouts", "Profit"]
    ];
    monthlyProfits.forEach(month => {
        const monthName = new Date(month.year, month.month - 1).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric'
        });
        monthData.push([
            monthName,
            formatCurrency(month.total_collected),
            formatCurrency(month.total_payouts),
            formatCurrency(month.profit)
        ]);
    });
    const ws3 = XLSX.utils.aoa_to_sheet(monthData);
    ws3['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Monthly");

    XLSX.writeFile(wb, `ChitsFund_Complete_Report_${formatDate().replace(/\s/g, '_')}.xlsx`);
};


// =====================
// PDF EXPORT FUNCTIONS
// =====================

/**
 * PDF Style Configuration
 */
const pdfStyles = {
    primaryColor: [99, 102, 241],      // Indigo
    successColor: [16, 185, 129],      // Green
    warningColor: [245, 158, 11],      // Amber
    dangerColor: [239, 68, 68],        // Red
    darkColor: [31, 41, 55],           // Gray-800
    lightColor: [249, 250, 251],       // Gray-50
    headerBg: [99, 102, 241],          // Primary
    altRowBg: [243, 244, 246]          // Gray-100
};

/**
 * Add styled header to PDF
 */
const addPdfHeader = (doc, title, subtitle) => {
    // Header background
    doc.setFillColor(...pdfStyles.primaryColor);
    doc.rect(0, 0, doc.internal.pageSize.width, 45, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 25);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, 38);

    // Date on right
    doc.text(`Generated: ${formatDate()}`, doc.internal.pageSize.width - 20, 38, { align: 'right' });

    return 55; // Return Y position after header
};

/**
 * Add footer to PDF pages
 */
const addPdfFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Page ${i} of ${pageCount} | Chits Fund Management System`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }
};

/**
 * Export Overview Report to PDF
 */
export const exportOverviewToPdf = (dashboardData, chitProfits) => {
    const doc = new jsPDF();

    let y = addPdfHeader(doc, 'FINANCIAL OVERVIEW', 'Chits Fund Management System');

    // Summary Cards Section
    doc.setTextColor(...pdfStyles.darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 20, y);
    y += 10;

    // Create summary boxes
    const summaryItems = [
        { label: 'Total Profit', value: formatCurrency(dashboardData?.total_profit), color: pdfStyles.successColor },
        { label: 'Monthly Collection', value: formatCurrency(dashboardData?.monthly_collection), color: pdfStyles.primaryColor },
        { label: 'Active Chits', value: String(dashboardData?.active_chits || 0), color: pdfStyles.warningColor },
        { label: 'Total Users', value: String(dashboardData?.total_users || 0), color: pdfStyles.primaryColor }
    ];

    const boxWidth = 42;
    const boxHeight = 28;
    const startX = 20;

    summaryItems.forEach((item, index) => {
        const x = startX + (index * (boxWidth + 5));

        // Box background
        doc.setFillColor(...pdfStyles.lightColor);
        doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');

        // Color accent line
        doc.setFillColor(...item.color);
        doc.rect(x, y, boxWidth, 3, 'F');

        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(item.label, x + boxWidth / 2, y + 12, { align: 'center' });

        // Value
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...pdfStyles.darkColor);
        doc.text(item.value, x + boxWidth / 2, y + 22, { align: 'center' });
    });

    y += boxHeight + 15;

    // Top Performing Chits Table
    doc.setTextColor(...pdfStyles.darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Performing Chits', 20, y);
    y += 5;

    const tableData = chitProfits.slice(0, 10).map((chit, index) => [
        index + 1,
        chit.chit_name,
        chit.completed_months,
        formatCurrency(chit.total_collected),
        formatCurrency(chit.total_profit)
    ]);

    autoTable(doc, {
        startY: y,
        head: [['#', 'Chit Name', 'Months', 'Collected', 'Profit']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: pdfStyles.primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9,
            textColor: pdfStyles.darkColor
        },
        alternateRowStyles: {
            fillColor: pdfStyles.altRowBg
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 50 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'right', cellWidth: 35 },
            4: { halign: 'right', cellWidth: 35, textColor: pdfStyles.successColor }
        },
        margin: { left: 20, right: 20 }
    });

    addPdfFooter(doc);
    doc.save(`ChitsFund_Overview_${formatDate().replace(/\s/g, '_')}.pdf`);
};

/**
 * Export Chit-wise Report to PDF
 */
export const exportChitsToPdf = (chitProfits) => {
    const doc = new jsPDF();

    let y = addPdfHeader(doc, 'CHIT-WISE REPORT', 'Detailed Profit Analysis by Chit Group');

    // Calculate totals
    const totals = chitProfits.reduce((acc, c) => ({
        collected: acc.collected + c.total_collected,
        payout: acc.payout + c.total_payout,
        profit: acc.profit + c.total_profit
    }), { collected: 0, payout: 0, profit: 0 });

    // Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...pdfStyles.darkColor);
    doc.text(`Total Chits: ${chitProfits.length}  |  Total Profit: ${formatCurrency(totals.profit)}`, 20, y);
    y += 10;

    const tableData = chitProfits.map(chit => [
        chit.chit_name,
        formatCurrency(chit.total_amount),
        `${chit.completed_months}/${chit.total_months}`,
        formatCurrency(chit.total_collected),
        formatCurrency(chit.total_payout),
        formatCurrency(chit.total_profit),
        chit.is_active ? '✓ Active' : '✗ Inactive'
    ]);

    // Add totals row
    tableData.push([
        'TOTAL',
        '',
        '',
        formatCurrency(totals.collected),
        formatCurrency(totals.payout),
        formatCurrency(totals.profit),
        ''
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Chit Name', 'Total Amt', 'Progress', 'Collected', 'Payout', 'Profit', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: pdfStyles.primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 8,
            textColor: pdfStyles.darkColor
        },
        alternateRowStyles: {
            fillColor: pdfStyles.altRowBg
        },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { halign: 'right', cellWidth: 25 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 25 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 25, textColor: pdfStyles.successColor },
            6: { halign: 'center', cellWidth: 20 }
        },
        margin: { left: 15, right: 15 },
        didParseCell: function (data) {
            // Style the totals row
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [229, 231, 235];
            }
        }
    });

    addPdfFooter(doc);
    doc.save(`ChitsFund_Chitwise_${formatDate().replace(/\s/g, '_')}.pdf`);
};

/**
 * Export Monthly Report to PDF
 */
export const exportMonthlyToPdf = (monthlyProfits) => {
    const doc = new jsPDF();

    let y = addPdfHeader(doc, 'MONTHLY REPORT', 'Month-wise Profit & Collection Analysis');

    // Calculate totals
    const totals = monthlyProfits.reduce((acc, m) => ({
        collected: acc.collected + m.total_collected,
        payouts: acc.payouts + m.total_payouts,
        profit: acc.profit + m.profit
    }), { collected: 0, payouts: 0, profit: 0 });

    // Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...pdfStyles.darkColor);
    doc.text(`Period: ${monthlyProfits.length} months  |  Total Profit: ${formatCurrency(totals.profit)}`, 20, y);
    y += 10;

    const tableData = monthlyProfits.map(month => {
        const monthName = new Date(month.year, month.month - 1).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric'
        });
        return [
            monthName,
            formatCurrency(month.total_collected),
            formatCurrency(month.total_payouts),
            formatCurrency(month.profit)
        ];
    });

    // Add totals row
    tableData.push([
        'TOTAL',
        formatCurrency(totals.collected),
        formatCurrency(totals.payouts),
        formatCurrency(totals.profit)
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Month', 'Total Collected', 'Total Payouts', 'Net Profit']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: pdfStyles.primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        bodyStyles: {
            fontSize: 9,
            textColor: pdfStyles.darkColor
        },
        alternateRowStyles: {
            fillColor: pdfStyles.altRowBg
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'right', cellWidth: 40 },
            2: { halign: 'right', cellWidth: 40, textColor: pdfStyles.warningColor },
            3: { halign: 'right', cellWidth: 40, textColor: pdfStyles.successColor }
        },
        margin: { left: 20, right: 20 },
        didParseCell: function (data) {
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [229, 231, 235];
            }
        }
    });

    addPdfFooter(doc);
    doc.save(`ChitsFund_Monthly_${formatDate().replace(/\s/g, '_')}.pdf`);
};

/**
 * Export Complete Report to PDF (All sections)
 */
export const exportAllToPdf = (dashboardData, chitProfits, monthlyProfits) => {
    const doc = new jsPDF();

    // Page 1: Overview
    let y = addPdfHeader(doc, 'COMPLETE FINANCIAL REPORT', 'Chits Fund Management System');

    // Summary section
    doc.setTextColor(...pdfStyles.darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, y);
    y += 12;

    const summaryItems = [
        ['Total Revenue Collected', formatCurrency(dashboardData?.total_collected)],
        ['Total Profit', formatCurrency(dashboardData?.total_profit)],
        ['Active Chit Groups', String(dashboardData?.active_chits || 0)],
        ['Total Users', String(dashboardData?.total_users || 0)],
        ['Pending Payouts', formatCurrency(dashboardData?.pending_amount)]
    ];

    autoTable(doc, {
        startY: y,
        body: summaryItems,
        theme: 'plain',
        bodyStyles: {
            fontSize: 11,
            textColor: pdfStyles.darkColor
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { halign: 'right', cellWidth: 50 }
        },
        margin: { left: 20, right: 20 }
    });

    // Page 2: Chit-wise
    doc.addPage();
    y = addPdfHeader(doc, 'CHIT-WISE BREAKDOWN', 'Performance by Chit Group');

    const chitTableData = chitProfits.map(chit => [
        chit.chit_name,
        `${chit.completed_months}/${chit.total_months}`,
        formatCurrency(chit.total_collected),
        formatCurrency(chit.total_profit)
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Chit Name', 'Progress', 'Collected', 'Profit']],
        body: chitTableData,
        theme: 'striped',
        headStyles: {
            fillColor: pdfStyles.primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'right', cellWidth: 40 },
            3: { halign: 'right', cellWidth: 40, textColor: pdfStyles.successColor }
        },
        margin: { left: 20, right: 20 }
    });

    // Page 3: Monthly
    doc.addPage();
    y = addPdfHeader(doc, 'MONTHLY BREAKDOWN', 'Month-wise Collection & Profit');

    const monthTableData = monthlyProfits.map(month => {
        const monthName = new Date(month.year, month.month - 1).toLocaleDateString('en-IN', {
            month: 'short',
            year: 'numeric'
        });
        return [monthName, formatCurrency(month.total_collected), formatCurrency(month.profit)];
    });

    autoTable(doc, {
        startY: y,
        head: [['Month', 'Collected', 'Profit']],
        body: monthTableData,
        theme: 'striped',
        headStyles: {
            fillColor: pdfStyles.primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'right', cellWidth: 50 },
            2: { halign: 'right', cellWidth: 50, textColor: pdfStyles.successColor }
        },
        margin: { left: 20, right: 20 }
    });

    addPdfFooter(doc);
    doc.save(`ChitsFund_Complete_Report_${formatDate().replace(/\s/g, '_')}.pdf`);
};
