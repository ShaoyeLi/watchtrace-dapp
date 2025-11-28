import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Card = ({ children, className = '', title, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-surface/60 backdrop-blur-md border border-surfaceHighlight rounded-xl p-6 shadow-xl ${className}`}
  >
    {title && (
      <div className="flex items-center gap-3 mb-4 border-b border-surfaceHighlight pb-3">
        {Icon && <Icon className="w-5 h-5 text-primary" />}
        <h3 className="font-semibold text-lg text-white">{title}</h3>
      </div>
    )}
    {children}
  </motion.div>
);

export const Button = ({ children, onClick, variant = 'primary', className = '', loading = false, disabled = false }: any) => {
  const baseStyle = "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-primary to-cyan-600 text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] border border-transparent",
    secondary: "bg-surfaceHighlight text-gray-300 hover:bg-slate-700 border border-slate-600",
    outline: "bg-transparent border border-primary/50 text-primary hover:bg-primary/10"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = ({ label, ...props }: any) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input 
      {...props}
      className="w-full bg-surface/80 border border-surfaceHighlight rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors placeholder-gray-600"
    />
  </div>
);

export const Badge = ({ children, color = 'blue' }: any) => {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};