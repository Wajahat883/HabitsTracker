import { toast } from 'react-toastify';

// Normalizes various error shapes into a single toast error message.
// Accepts: Error object, Axios error, string, response-like object { message, error, errors }
// Optional options override react-toastify defaults.
export function toastError(err, options = {}) {
  if (!err) {
    toast.error('Unexpected error', options);
    return;
  }
  let message = 'An error occurred';

  // Direct string
  if (typeof err === 'string') message = err;
  // Native/Error instance
  else if (err instanceof Error && err.message) message = err.message;
  // Axios style: err.response?.data
  else if (err.response) {
    const data = err.response.data;
    if (typeof data === 'string') message = data;
    else if (data) {
      message = data.message || data.error || data.msg || message;
      // Collect validation errors array/object
      if (data.errors) {
        if (Array.isArray(data.errors)) {
          const first = data.errors[0];
            if (typeof first === 'string') message = first; else if (first?.msg) message = first.msg;
        } else if (typeof data.errors === 'object') {
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey) {
            const val = data.errors[firstKey];
            if (Array.isArray(val)) message = val[0]; else if (typeof val === 'string') message = val; else if (val?.message) message = val.message;
          }
        }
      }
    }
  }
  // Fallback object with message/error
  else if (typeof err === 'object') {
    message = err.message || err.error || message;
  }

  // Safety: trim & length cap
  if (message && typeof message === 'string') {
    message = message.trim();
    if (!message) message = 'An error occurred';
    if (message.length > 220) message = message.slice(0,217) + '...';
  }

  toast.error(message, { position: 'top-center', autoClose: 2600, ...options });
}

export default toastError;
