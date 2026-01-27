import toast from 'react-hot-toast';

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
  });
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
  });
};

export const handleApiError = (error: unknown, defaultMessage = 'An error occurred') => {
  const message = error instanceof Error ? error.message : String(error);
  showError(message || defaultMessage);
};
