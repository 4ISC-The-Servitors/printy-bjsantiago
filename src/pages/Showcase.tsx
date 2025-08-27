import React, { useEffect } from 'react';
import ComponentShowcase from '../components/shared/showcase/ComponentShowcase';
import { ToastContainer } from '../components/shared';
import { useToast } from '../lib/useToast';
import '../index.css';

const Showcase: React.FC = () => {
  const [toasts, toastMethods] = useToast();

  useEffect(() => {
    // Welcome toast when entering showcase
    const timer = setTimeout(() => {
      toastMethods.success(
        'Welcome to Printy Design System!',
        'Explore our shared UI components and design patterns.'
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [toastMethods]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ComponentShowcase />

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toastMethods.remove}
        position="top-right"
      />
    </div>
  );
};

export default Showcase;
