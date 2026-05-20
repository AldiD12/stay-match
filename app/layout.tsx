import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StayMatch AI — Albanian hospitality, matched by AI',
  description: 'Describe how you want to travel. We find the perfect Albanian property.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
