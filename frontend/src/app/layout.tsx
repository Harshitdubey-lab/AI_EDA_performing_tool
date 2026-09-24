import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InsightPilot AI — Enterprise Data Analytics & ML Studio',
  description: 'AI-powered data science assistant for automated EDA, natural language data querying, machine learning modeling, and executive analytics reports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
