// Toast notification utility
let toastListeners = [];

export const toast = {
  show: (message, type = 'success') => {
    toastListeners.forEach(listener => listener({ message, type, isVisible: true }));
  },
  success: (message) => toast.show(message, 'success'),
  error: (message) => toast.show(message, 'error'),
  warning: (message) => toast.show(message, 'warning'),
  info: (message) => toast.show(message, 'info'),
  subscribe: (listener) => {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }
};

