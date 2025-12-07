'use client';

import { useState, useEffect } from 'react';
import Toast from './Toast';
import { toast } from '@/lib/toast';

export default function ToastProvider({ children }) {
  const [toastState, setToastState] = useState({
    message: '',
    type: 'success',
    isVisible: false
  });

  useEffect(() => {
    const unsubscribe = toast.subscribe((newToast) => {
      setToastState(newToast);
    });

    return unsubscribe;
  }, []);

  const handleClose = () => {
    setToastState(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <>
      {children}
      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
        onClose={handleClose}
      />
    </>
  );
}

