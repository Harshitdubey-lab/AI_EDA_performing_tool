import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

class PDFService:
    @staticmethod
    def generate_pdf(report_data: dict, output_path: str) -> str:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom typography styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#475569')
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1e293b'),
            fontName='Helvetica-Bold',
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155')
        )
        bullet_style = ParagraphStyle(
            'Bullet',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1e293b'),
            leftIndent=12
        )

        elements = []

        # 1. Header with Badge
        elements.append(Paragraph("INSIGHTPILOT AI // EXECUTIVE ANALYTICS DOSSIER", ParagraphStyle(
            'Tag', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#6366f1')
        )))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(report_data.get("title", "Dataset Analytics Report"), title_style))
        elements.append(Paragraph(f"Generated: {report_data.get('generated_at', datetime.now().strftime('%Y-%m-%d %H:%M'))} | Dataset: {report_data.get('dataset_name', 'N/A')}", subtitle_style))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#cbd5e1'), spaceBefore=4, spaceAfter=12))

        # 2. Key Metrics Snapshot
        metrics = report_data.get("metrics", {})
        q_score = report_data.get("quality_score", 95.0)

        data_summary = [
            [
                Paragraph("<b>Total Rows</b>", body_style),
                Paragraph(f"{metrics.get('total_rows', 0):,}", body_style),
                Paragraph("<b>Data Quality Score</b>", body_style),
                Paragraph(f"<b>{q_score}/100</b>", body_style)
            ],
            [
                Paragraph("<b>Columns</b>", body_style),
                Paragraph(f"{metrics.get('total_columns', 0)} ({metrics.get('numerical_features', 0)} num, {metrics.get('categorical_features', 0)} cat)", body_style),
                Paragraph("<b>Duplicates</b>", body_style),
                Paragraph(f"{metrics.get('duplicate_rows', 0)}", body_style)
            ]
        ]
        summary_table = Table(data_summary, colWidths=[110, 150, 130, 150])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 14))

        # 3. Core Insights Section
        elements.append(Paragraph("1. Automated Exploratory Insights", section_heading))
        insights = report_data.get("insights", [])
        if insights:
            for ins in insights:
                prefix = "✓" if ins.get("type") == "positive" else ("⚠" if ins.get("type") == "warning" else "ℹ")
                elements.append(Paragraph(f"<b>{prefix} {ins.get('title')}:</b> {ins.get('detail')}", bullet_style))
                elements.append(Spacer(1, 3))
        else:
            elements.append(Paragraph("No automated anomalies or alerts detected in the provided schema.", body_style))
        elements.append(Spacer(1, 10))

        # 4. Machine Learning Benchmarks Section
        elements.append(Paragraph("2. Predictive Modeling & Benchmarks", section_heading))
        ml_summary = report_data.get("ml_summary")
        if ml_summary and ml_summary.get("benchmarks"):
            best_model = ml_summary.get("best_model", "N/A")
            target = ml_summary.get("target_column", "N/A")
            task = ml_summary.get("task_type", "classification")

            elements.append(Paragraph(
                f"<b>Target Column:</b> <code>{target}</code> | <b>Task Type:</b> {task.capitalize()} | <b>Best Performing Architecture:</b> <b>{best_model}</b>",
                body_style
            ))
            elements.append(Spacer(1, 6))

            # Table of models
            benchmarks = ml_summary.get("benchmarks", [])
            if task == "classification":
                table_data = [["Algorithm", "Accuracy", "Precision", "Recall", "F1 Score"]]
                for m in benchmarks:
                    met = m.get("metrics", {})
                    table_data.append([
                        m.get("name", ""),
                        f"{met.get('accuracy', 0)*100:.1f}%",
                        f"{met.get('precision', 0)*100:.1f}%",
                        f"{met.get('recall', 0)*100:.1f}%",
                        f"{met.get('f1_score', 0):.4f}"
                    ])
            else:
                table_data = [["Algorithm", "R² Score", "MAE", "RMSE"]]
                for m in benchmarks:
                    met = m.get("metrics", {})
                    table_data.append([
                        m.get("name", ""),
                        f"{met.get('r2_score', 0):.4f}",
                        f"{met.get('mae', 0):.2f}",
                        f"{met.get('rmse', 0):.2f}"
                    ])

            ml_table = Table(table_data, colWidths=[180, 85, 85, 95, 95] if task == 'classification' else [220, 105, 105, 110])
            ml_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 8.5),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#ffffff')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('PADDING', (0,0), (-1,-1), 5),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            elements.append(ml_table)
            elements.append(Spacer(1, 10))

            # Feature Importance
            top_feats = ml_summary.get("top_features", [])
            if top_feats:
                elements.append(Paragraph("<b>Primary Predictive Drivers (Feature Importance):</b>", body_style))
                feat_items = [f"• <b>{f.get('feature')}</b> ({round(f.get('importance', 0)*100, 1)}%)" for f in top_feats[:5]]
                elements.append(Paragraph(" &nbsp;&nbsp;|&nbsp;&nbsp; ".join(feat_items), bullet_style))
                elements.append(Spacer(1, 10))

        else:
            elements.append(Paragraph("Machine learning models have not yet been evaluated for this dataset. Train models in the ML Studio tab to populate benchmark metrics.", body_style))
            elements.append(Spacer(1, 10))

        # 5. Strategic Recommendations
        elements.append(Paragraph("3. Executive Recommendations & Next Steps", section_heading))
        recs = report_data.get("recommendations", [])
        for r in recs:
            elements.append(Paragraph(f"• {r}", bullet_style))
            elements.append(Spacer(1, 3))

        elements.append(Spacer(1, 16))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceBefore=8, spaceAfter=8))
        elements.append(Paragraph("Confidential & Proprietary // Generated with InsightPilot AI Platform", ParagraphStyle(
            'Footer', fontSize=8, leading=10, textColor=colors.HexColor('#94a3b8'), alignment=1
        )))

        doc.build(elements)
        return output_path
