import React from 'react';
import ComponentShowcase from '../components/shared/ComponentShowcase';
import '../index.css';

const Showcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <ComponentShowcase />
    </div>
  );
};

export default Showcase;
