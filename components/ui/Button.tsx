import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'outline' | 'ghost' | 'navy';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95";
  
  const variants = {
    // Primary is Gold - good for calls to action against Navy or White
    primary: "bg-primary text-brand-blue hover:bg-[#d4b036] shadow-lg shadow-primary/20",
    // Navy variant for primary actions on white
    navy: "bg-brand-blue text-white hover:bg-[#152C4E] shadow-lg shadow-brand-blue/20",
    outline: "border-2 border-slate-200 hover:bg-slate-50 text-slate-800 bg-transparent",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600"
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      className={`${baseStyle} ${selectedVariant} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};