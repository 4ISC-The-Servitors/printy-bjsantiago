'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/mobile-layout';
import DesktopLayout from '@/components/desktop-layout';

export default function AdminDashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handlePortfolioNavigation = () => {
    router.push('/portfolio');
  };

  const commonProps = {
    isChatOpen,
    isChatMinimized,
    setIsChatOpen,
    setIsChatMinimized,
    handlePortfolioNavigation,
  };

  return isMobile ? (
    <MobileLayout {...commonProps} />
  ) : (
    <DesktopLayout {...commonProps} />
  );
}
