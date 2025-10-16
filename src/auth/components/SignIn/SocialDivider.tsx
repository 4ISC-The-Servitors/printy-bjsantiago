import React from 'react';

const SocialDivider: React.FC = () => (
  <div className="relative my-8">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-neutral-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-4 bg-white text-neutral-500 font-medium">
        Or continue with
      </span>
    </div>
  </div>
);

export default SocialDivider;
