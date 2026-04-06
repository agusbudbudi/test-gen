import React, { ReactNode, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
  className?: string; // For the wrapper
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = 'right', 
  disabled = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
      }

      setCoords({ top, left });
    }
    setIsVisible(true);
  };

  const getTransform = () => {
    switch (position) {
      case 'right': return 'translateY(-50%)';
      case 'left': return 'translate(-100%, -50%)';
      case 'top': return 'translate(-50%, -100%)';
      case 'bottom': return 'translateX(-50%)';
    }
  };

  const getArrowClasses = () => {
    const base = "absolute w-2 h-2 bg-slate-800 dark:bg-slate-700 rotate-45 transform";
    switch (position) {
      case 'right': return `${base} top-1/2 -left-1 -translate-y-1/2`;
      case 'left': return `${base} top-1/2 -right-1 -translate-y-1/2`;
      case 'top': return `${base} -bottom-1 left-1/2 -translate-x-1/2`;
      case 'bottom': return `${base} -top-1 left-1/2 -translate-x-1/2`;
    }
  };

  return (
    <div 
      className={cn("relative flex items-center w-full", className)} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={() => setIsVisible(false)}
      ref={triggerRef}
    >
      {children}
      {isVisible && !disabled && createPortal(
        <div 
          className="fixed z-[9999] px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-white bg-slate-800 dark:bg-slate-700 rounded-md shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
          style={{ top: coords.top, left: coords.left, transform: getTransform() }}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;
