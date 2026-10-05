import type { ButtonHTMLAttributes } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'outline' | 'ghost'; size?: 'sm' | 'md' | 'lg' }
export function Button({ className = '', variant = 'default', size = 'md', type = 'button', ...props }: ButtonProps) {
  const variants = { default: 'action-primary', outline: 'action-secondary', ghost: 'inline-flex items-center justify-center gap-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50' };
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-sm' };
  return <button type={type} className={variants[variant] + ' ' + sizes[size] + ' ' + className} {...props} />;
}