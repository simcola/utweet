import React from 'react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Bird silhouette */}
        <path
          d="M20 8C15 8 11 12 11 17C11 19 12 21 13 22.5L10 35L15 32L20 35L25 32L22 22.5C23 21 24 19 24 17C24 12 20 8 20 8Z"
          fill="#0ea5e9"
        />
        {/* Bird eye */}
        <circle cx="17" cy="16" r="1.5" fill="white" />
        {/* Tweet symbol - simplified */}
        <path
          d="M26 12L28 14L26 16"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="text-2xl font-bold text-primary-600">uTweet</span>
    </div>
  );
}

