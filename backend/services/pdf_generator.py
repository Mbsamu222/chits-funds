from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from decimal import Decimal
import os


def generate_payment_receipt(payment_data: dict, output_path: str) -> str:
    """Generate a professional payment receipt PDF"""
    
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#6366f1'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.grey,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    # Header
    elements.append(Paragraph("PAYMENT RECEIPT", title_style))
    elements.append(Paragraph(f"Receipt No: {payment_data['receipt_no']}", subtitle_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Date and payment details box
    date_info = [
        ['Payment Date:', payment_data['payment_date']],
        ['Generated On:', datetime.now().strftime('%d %b %Y %I:%M %p')]
    ]
    
    date_table = Table(date_info, colWidths=[2*inch, 3*inch])
    date_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#6b7280')),
    ]))
    elements.append(date_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Payer Information
    elements.append(Paragraph("PAYER INFORMATION", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    payer_data = [
        ['Name:', payment_data['payer_name']],
        ['Phone:', payment_data['payer_phone']],
        ['Member ID:', str(payment_data['user_id'])]
    ]
    
    payer_table = Table(payer_data, colWidths=[1.5*inch, 4*inch])
    payer_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(payer_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Chit Details
    elements.append(Paragraph("CHIT GROUP DETAILS", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    chit_data = [
        ['Chit Name:', payment_data['chit_name']],
        ['Month:', f"Month {payment_data['month_number']}"],
        ['Total Months:', str(payment_data['total_months'])]
    ]
    
    chit_table = Table(chit_data, colWidths=[1.5*inch, 4*inch])
    chit_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(chit_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Payment Breakdown
    elements.append(Paragraph("PAYMENT BREAKDOWN", styles['Heading2']))
    elements.append(Spacer(1, 0.1*inch))
    
    amount_data = [
        ['Description', 'Amount'],
        ['Monthly Contribution', f"₹{payment_data['amount']:,.2f}"],
        ['Payment Method', payment_data['payment_method'].upper()],
        ['Status', payment_data['status'].upper()]
    ]
    
    amount_table = Table(amount_data, colWidths=[3*inch, 2.5*inch])
    amount_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(amount_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Total Amount (highlighted)
    total_data = [
        ['TOTAL AMOUNT PAID', f"₹{payment_data['amount']:,.2f}"]
    ]
    
    total_table = Table(total_data, colWidths=[3*inch, 2.5*inch])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Notes
    if payment_data.get('notes'):
        elements.append(Paragraph("NOTES", styles['Heading3']))
        elements.append(Paragraph(payment_data['notes'], styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Thank you for your payment!", footer_style))
    elements.append(Paragraph("This is a computer-generated receipt and does not require a signature.", footer_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("For queries, contact your chit fund administrator.", footer_style))
    
    # Build PDF
    doc.build(elements)
    return output_path


def generate_auction_summary_pdf(auction_data: dict, output_path: str) -> str:
    """Generate auction summary PDF"""
    
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#6366f1'),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    elements.append(Paragraph("AUCTION SUMMARY REPORT", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Auction Details
    auction_info = [
        ['Chit Group:', auction_data['chit_name']],
        ['Month Number:', f"Month {auction_data['month_number']}"],
        ['Auction Date:', auction_data['auction_date']],
        ['Status:', auction_data['status'].upper()],
        ['Total Bids:', str(auction_data['total_bids'])]
    ]
    
    for key, value in auction_info:
        elements.append(Paragraph(f"<b>{key}</b> {value}", styles['Normal']))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Winner Information (if available)
    if auction_data.get('winner_name'):
        elements.append(Paragraph("WINNER", styles['Heading2']))
        winner_data = [
            ['Winner Name:', auction_data['winner_name']],
            ['Winning Bid:', f"₹{auction_data['winning_bid_amount']:,.2f}"],
            ['Payout Amount:', f"₹{auction_data['payout_amount']:,.2f}"],
            ['Dividend/Member:', f"₹{auction_data['dividend_per_member']:,.2f}"]
        ]
        
        for key, value in winner_data:
            elements.append(Paragraph(f"<b>{key}</b> {value}", styles['Normal']))
        
        elements.append(Spacer(1, 0.3*inch))
    
    # Bidding History
    if auction_data.get('bids'):
        elements.append(Paragraph("BIDDING HISTORY", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        bid_data = [['#', 'Bidder Name', 'Bid Amount', 'Time', 'Status']]
        for idx, bid in enumerate(auction_data['bids'], 1):
            bid_data.append([
                str(idx),
                bid['user_name'],
                f"₹{bid['bid_amount']:,.2f}",
                bid['bid_time'],
                bid['status'].upper()
            ])
        
        bid_table = Table(bid_data)
        bid_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
        ]))
        elements.append(bid_table)
    
    doc.build(elements)
    return output_path
