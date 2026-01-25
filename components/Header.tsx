'use client';

import Link from 'next/link';
import Logo from './Logo';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-emerald-950/80 border-b-2 border-emerald-500/30 shadow-lg shadow-emerald-950/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg transition-all duration-200 border-2 font-semibold ${
                pathname === '/'
                  ? 'bg-emerald-500/30 border-emerald-400/60 text-white shadow-md'
                  : 'text-emerald-100 border-transparent hover:text-white hover:border-emerald-400/50 hover:bg-emerald-900/40'
              }`}
            >
              Discover
            </Link>
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-lg transition-all duration-200 border-2 font-semibold ${
                isAdmin
                  ? 'bg-emerald-500/30 border-emerald-400/60 text-white shadow-md'
                  : 'text-emerald-100 border-transparent hover:text-white hover:border-emerald-400/50 hover:bg-emerald-900/40'
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

