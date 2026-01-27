import { Toaster, ToastBar } from 'react-hot-toast';

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        top: '80px', // Отступ от верха, чтобы не перекрывать header (64px + 16px)
        right: '20px',
        bottom: 'auto',
        left: 'auto',
        zIndex: 9999,
      }}
      gutter={12}
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        className: 'toast-custom',
        style: {
          background: '#ffffff',
          color: '#111827',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '400px',
          minWidth: '300px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          style: {
            borderLeft: '4px solid #10b981',
            background: 'linear-gradient(to right, #f0fdf4 0%, #ffffff 4%)',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          style: {
            borderLeft: '4px solid #ef4444',
            background: 'linear-gradient(to right, #fef2f2 0%, #ffffff 4%)',
          },
        },
        blank: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: '#ffffff',
          },
          style: {
            borderLeft: '4px solid #3b82f6',
            background: 'linear-gradient(to right, #eff6ff 0%, #ffffff 4%)',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0 toast-icon-wrapper">
                {icon}
              </div>
              <div className="flex-1 text-sm font-medium text-gray-900 leading-relaxed">
                {message}
              </div>
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
