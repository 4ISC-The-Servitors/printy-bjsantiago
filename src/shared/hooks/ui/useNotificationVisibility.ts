import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useNotificationVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  const checkVisibility = () => {
    // Only show notification bell on dashboard pages
    const isDashboardPage = 
      location.pathname === '/customer' || 
      location.pathname.includes('/customer/dashboard');
    
    // Hide notification bell when chat panels/docks are active
    const shouldHide =
      // Hide on non-dashboard pages
      !isDashboardPage ||
      // Hide on dedicated chat pages
      location.pathname.includes('/chats') ||
      // Hide when customer chat panel is active (activeId exists)
      (typeof window !== 'undefined' &&
        (window.location.pathname.includes('/customer/dashboard') ||
          window.location.pathname === '/customer') &&
        document.querySelector('[data-chat-active="true"]')) ||
      // Hide when admin chat dock is open
      (typeof window !== 'undefined' &&
        (window.location.pathname.includes('/admin') ||
          window.location.pathname === '/admin') &&
        document.querySelector('[data-admin-chat-open="true"]'));

    setIsVisible(!shouldHide);
  };

  useEffect(() => {
    checkVisibility();
  }, [location]);

  // Listen for chat state changes via custom events and DOM changes
  useEffect(() => {
    const handleChatStateChange = () => {
      checkVisibility();
    };

    // Listen for chat events
    window.addEventListener('customer-chat-opened', handleChatStateChange);
    window.addEventListener('customer-chat-closed', handleChatStateChange);
    window.addEventListener('admin-chat-opened', handleChatStateChange);
    window.addEventListener('admin-chat-closed', handleChatStateChange);

    // Also watch for DOM mutations to catch when chat components are mounted/unmounted
    const observer = new MutationObserver(() => {
      // Add a small delay to avoid race conditions
      setTimeout(checkVisibility, 50);
    });

    // Observe the entire document for changes
    if (typeof document !== 'undefined') {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-chat-active', 'data-admin-chat-open'],
      });
    }

    return () => {
      window.removeEventListener('customer-chat-opened', handleChatStateChange);
      window.removeEventListener('customer-chat-closed', handleChatStateChange);
      window.removeEventListener('admin-chat-opened', handleChatStateChange);
      window.removeEventListener('admin-chat-closed', handleChatStateChange);
      observer.disconnect();
    };
  }, [location]);

  return {
    isVisible,
    setIsVisible,
  };
}
