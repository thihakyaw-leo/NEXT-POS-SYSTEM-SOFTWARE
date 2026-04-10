import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXT HR System | Dashboard",
  description: "Premium HR Management System with Cyberpunk Tech Aesthetic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <div className="mesh-bg" />
        
        <header className="glass-panel fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-black border-glow">
              N
            </div>
            <h1 className="text-xl font-black tracking-tighter text-cyan-400 text-glow">
              NEXT HR SYSTEM
            </h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <a href="/employees" className="text-sm font-medium hover:text-cyan-400 transition-colors">Employees</a>
            <a href="/payroll" className="text-sm font-medium hover:text-cyan-400 transition-colors">Payroll</a>
            <a href="/settings" className="text-sm font-medium hover:text-cyan-400 transition-colors">Settings</a>
          </nav>
        </header>

        <main className="pt-24 min-h-screen px-4 sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
