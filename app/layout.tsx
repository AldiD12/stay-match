import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StayMatch Luxury Collection — Find your stay using AI',
  description: 'Describe how you want to travel. Our AI matches you with the perfect premium stay in seconds.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-surface text-on-surface antialiased font-body-md min-h-screen flex flex-col relative overflow-x-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

