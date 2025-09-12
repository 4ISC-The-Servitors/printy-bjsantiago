'use client';
import {
  LayoutDashboard,
  ShoppingCart,
  Ticket,
  Briefcase,
  MessageCircle,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

interface SharedBottomNavProps {
  onNavigate: (path: string) => void;
  onChatToggle?: () => void;
  isChatOpen?: boolean;
}

export default function SharedBottomNav({
  onNavigate,
  onChatToggle,
  isChatOpen = false,
}: SharedBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/', key: 'home' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders', key: 'orders' },
    { icon: Ticket, label: 'Tickets', path: '/tickets', key: 'tickets' },
    {
      icon: Briefcase,
      label: 'Portfolio',
      path: '/portfolio',
      key: 'portfolio',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.path)}
            className="flex flex-col items-center gap-1 min-h-[60px] min-w-[60px] p-2 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
            style={{
              color: pathname === item.path ? '#1d4ed8' : '#6b7280',
              backgroundColor:
                pathname === item.path ? '#eff6ff' : 'transparent',
            }}
            aria-label={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}

        <button
          onClick={onChatToggle}
          className="flex flex-col items-center gap-1 min-h-[60px] min-w-[60px] p-2 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
          style={{
            color: isChatOpen ? '#1d4ed8' : '#6b7280',
            backgroundColor: isChatOpen ? '#eff6ff' : 'transparent',
          }}
          aria-label="Chat"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-medium">Chat</span>
        </button>
      </div>
    </nav>
  );
}
