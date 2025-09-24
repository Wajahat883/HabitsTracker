import { toast } from 'react-toastify';

// Default toast configuration
export const toastConfig = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark", // Matches your dark theme
};

// Custom toast functions with predefined styles
// Only show error toasts; all other calls become silent no-ops per new requirement.
// Exception: success messages are allowed for authentication flows
const noop = () => {};
export const showToast = {
  success: (message, options = {}) => {
    toast.success(message, {
      ...toastConfig,
      ...options,
      className: 'bg-green-600 text-white',
    });
  },
  warning: noop,
  info: noop,
  habitCreated: noop,
  habitCompleted: noop,
  habitStreak: noop,
  habitDeleted: noop,
  error: (message, options = {}) => {
    toast.error(message, {
      ...toastConfig,
      ...options,
      className: 'bg-red-600 text-white',
    });
  }
};

export default showToast;