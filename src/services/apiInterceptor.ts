import api from './api';
import { useSpinner } from '../context/SpinnerContext';

let requestCount = 0;

const setupInterceptors = (showSpinner: () => void, hideSpinner: () => void) => {
  api.interceptors.request.use(
    (config) => {
      if (requestCount === 0) {
        showSpinner();
      }
      requestCount++;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      requestCount--;
      if (requestCount === 0) {
        hideSpinner();
      }
      return response;
    },
    (error) => {
      requestCount--;
      if (requestCount === 0) {
        hideSpinner();
      }
      return Promise.reject(error);
    }
  );
};

export default setupInterceptors;
