import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string, options?: any) => toast.success(message, {
    style: {
      background: 'hsl(var(--card))',
      color: 'hsl(var(--card-foreground))',
      border: '1px solid hsl(var(--border))',
      ...options?.style,
    },
    ...options,
  }),
  
  error: (message: string, options?: any) => toast.error(message, {
    style: {
      background: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
      border: '1px solid hsl(var(--destructive))',
      ...options?.style,
    },
    ...options,
  }),
  
  loading: (message: string, options?: any) => toast.loading(message, {
    style: {
      background: 'hsl(var(--card))',
      color: 'hsl(var(--card-foreground))',
      border: '1px solid hsl(var(--border))',
      ...options?.style,
    },
    ...options,
  }),
};