'use client';
import {
  LayoutDashboard,
  ShoppingCart,
  Briefcase,
  Ticket,
  Settings,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SharedSidebarProps {
  onNavigate?: (path: string) => void;
}

export default function SharedSidebar({ onNavigate }: SharedSidebarProps) {
  const pathname = usePathname();

  const handleClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">A</span>
      </div>

      <nav className="flex flex-col space-y-2">
        <Link href="/" title="Dashboard">
          <div
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              pathname === '/' ? 'bg-blue-50' : 'hover:bg-gray-100'
            }`}
            style={{ color: pathname === '/' ? '#1d4ed8' : '#374151' }}
          >
            <LayoutDashboard className="w-5 h-5" />
          </div>
        </Link>

        <Link href="/orders" title="Orders">
          <div
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              pathname === '/orders' ? 'bg-blue-50' : 'hover:bg-gray-100'
            }`}
            style={{ color: pathname === '/orders' ? '#1d4ed8' : '#374151' }}
          >
            <ShoppingCart className="w-5 h-5" />
          </div>
        </Link>

        <Link href="/tickets" title="Tickets">
          <div
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              pathname === '/tickets' ? 'bg-blue-50' : 'hover:bg-gray-100'
            }`}
            style={{ color: pathname === '/tickets' ? '#1d4ed8' : '#374151' }}
          >
            <Ticket className="w-5 h-5" />
          </div>
        </Link>

        <Link href="/portfolio" title="Portfolio">
          <div
            className={`p-3 rounded-lg transition-colors cursor-pointer ${
              pathname === '/portfolio' ? 'bg-blue-50' : 'hover:bg-gray-100'
            }`}
            style={{ color: pathname === '/portfolio' ? '#1d4ed8' : '#374151' }}
          >
            <Briefcase className="w-5 h-5" />
          </div>
        </Link>
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col space-y-2">
        <div
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          style={{ color: '#374151' }}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </div>
        <div
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          style={{ color: '#374151' }}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </div>
      </div>
    </aside>
  );
}
