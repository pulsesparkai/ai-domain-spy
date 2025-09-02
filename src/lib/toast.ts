import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => toast.success(message, {
    style: {
      background: 'hsl(var(--card))',
      color: 'hsl(var(--card-foreground))',
      border: '1px solid hsl(var(--border))',
    },
  }),
  
  error: (message: string) => toast.error(message, {
    style: {
      background: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
      border: '1px solid hsl(var(--destructive))',
    },
  }),
  
  loading: (message: string) => toast.loading(message, {
    style: {
      background: 'hsl(var(--card))',
      color: 'hsl(var(--card-foreground))',
      border: '1px solid hsl(var(--border))',
    },
  }),
};