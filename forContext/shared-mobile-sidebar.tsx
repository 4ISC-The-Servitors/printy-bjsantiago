'use client';
import { Settings, LogOut, X } from 'lucide-react';

interface SharedMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SharedMobileSidebar({
  isOpen,
  onClose,
}: SharedMobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <div
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            style={{ color: '#374151' }}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
          <div
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            style={{ color: '#374151' }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </div>
        </nav>
      </div>
    </div>
  );
}
