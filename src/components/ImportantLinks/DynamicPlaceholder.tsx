import React from 'react';
import { ExternalLink } from 'lucide-react';

interface DynamicPlaceholderProps {
  url: string;
  title?: string;
}

// Predefined set of modern gradient pairs to ensure aesthetics 
const GRADIENT_PAIRS = [
  'from-blue-500 to-cyan-400',
  'from-indigo-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-rose-500 to-orange-400',
  'from-violet-500 to-fuchsia-400',
  'from-amber-500 to-yellow-400',
  'from-pink-500 to-rose-400',
  'from-indigo-600 to-blue-500',
];

// Helper to extract domain and initial
const getDomainInfo = (url: string, title?: string) => {
  try {
    // Attempt to parse as full URL
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Remove www.
    let domain = urlObj.hostname.replace('www.', '');
    
    // Extract main part of the domain (e.g. github from github.com)
    const parts = domain.split('.');
    let mainName = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    
    // If it's a known short TLD like co.uk, take the one before
    if (parts.length > 2 && (parts[parts.length - 2] === 'co' || parts[parts.length - 2] === 'com')) {
      mainName = parts[parts.length - 3];
    }

    // Capitalize first letter
    const nameToUse = title && title.length > 0 ? title : mainName;
    const initial = nameToUse.charAt(0).toUpperCase();

    // Generate a deterministic index for the gradient based on the domain string
    let hash = 0;
    for (let i = 0; i < mainName.length; i++) {
        hash = mainName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % GRADIENT_PAIRS.length;

    return { initial, gradientClass: GRADIENT_PAIRS[colorIndex], mainName };
  } catch (e) {
    // Fallback if URL parsing fails completely
    return { initial: '?', gradientClass: GRADIENT_PAIRS[0], mainName: 'unknown' };
  }
};

export default function DynamicPlaceholder({ url, title }: DynamicPlaceholderProps) {
  const { initial, gradientClass } = React.useMemo(() => getDomainInfo(url, title), [url, title]);

  if (!url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 text-slate-400">
        <ExternalLink size={32} className="opacity-50 mb-2" />
        <span className="text-xs font-medium uppercase tracking-wider">No Valid URL</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradientClass} relative overflow-hidden group-hover:scale-105 transition-transform duration-500`}>
      {/* Abstract decorative elements to make it "visual-heavy" */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8" />
      
      {/* Content */}
      <div className="z-10 bg-white/20 dark:bg-black/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 dark:border-white/10">
        <span className="text-3xl font-bold text-white drop-shadow-md">
          {initial}
        </span>
      </div>
    </div>
  );
}
