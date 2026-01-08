// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

// class APIClient {
//   constructor() {
//     this.baseURL = API_BASE_URL;
//     this.token = null;

//     // Load token from localStorage on initialization
//     if (typeof window !== 'undefined') {
//       this.token = localStorage.getItem('auth_token');
//     }
//   }

//   setToken(token) {
//     this.token = token;
//     if (typeof window !== 'undefined') {
//       if (token) {
//         localStorage.setItem('auth_token', token);
//       } else {
//         localStorage.removeItem('auth_token');
//       }
//     }
//   }

//   getToken() {
//     return this.token;
//   }

//   clearToken() {
//     this.setToken(null);
//   }

//   async request(endpoint, options = {}) {
//     const headers = {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     };

//     // Add authorization token if available
//     if (this.token) {
//       headers['Authorization'] = `Bearer ${this.token}`;
//     }

//     const config = {
//       ...options,
//       headers,
//     };

//     // Handle body serialization
//     if (options.body && typeof options.body === 'object') {
//       config.body = JSON.stringify(options.body);
//     }

//     try {
//       const response = await fetch(`${this.baseURL}${endpoint}`, config);

//       // Handle HTTP errors
//       if (!response.ok) {
//         const error = await response.json().catch(() => ({
//           message: `HTTP ${response.status}: ${response.statusText}`
//         }));

//         // Handle unauthorized (token expired)
//         if (response.status === 401) {
//           this.clearToken();
//           if (typeof window !== 'undefined') {
//             window.location.href = '/login';
//           }
//         }
//         throw new Error(error.message || error.error?.message || 'Request failed');
//       }

//       // Handle empty responses
//       const text = await response.text();
//       return text ? JSON.parse(text) : null;

//     } catch (error) {
//       console.error('API Request Error:', error);
//       throw error;
//     }
//   }
  
//   // Convenience methods
//   get(endpoint, options = {}) {
//     return this.request(endpoint, { ...options, method: 'GET' });
//   }
  
//   post(endpoint, body, options = {}) {
//     return this.request(endpoint, { ...options, method: 'POST', body });
//   }
  
//   put(endpoint, body, options = {}) {
//     return this.request(endpoint, { ...options, method: 'PUT', body });
//   }
  
//   patch(endpoint, body, options = {}) {
//     return this.request(endpoint, { ...options, method: 'PATCH', body });
//   }
  
//   delete(endpoint, options = {}) {
//     return this.request(endpoint, { ...options, method: 'DELETE' });
//   }
  
//   // File upload
//   async upload(endpoint, formData, onProgress) {
//     const headers = {};

//     if (this.token) {
//       headers['Authorization'] = `Bearer ${this.token}`;
//     }

//     try {
//       const xhr = new XMLHttpRequest();

//       return new Promise((resolve, reject) => {
//         xhr.upload.addEventListener('progress', (e) => {
//           if (e.lengthComputable && onProgress) {
//             const percentComplete = (e.loaded / e.total) * 100;
//             onProgress(percentComplete);
//           }
//         });

//         xhr.addEventListener('load', () => {
//           if (xhr.status >= 200 && xhr.status < 300) {
//             resolve(JSON.parse(xhr.responseText));
//           } else {
//             reject(new Error(`Upload failed with status ${xhr.status}`));
//           }
//         });

//         xhr.addEventListener('error', () => {
//           reject(new Error('Upload failed'));
//         });

//         xhr.open('POST', `${this.baseURL}${endpoint}`);

//         // Set headers
//         Object.keys(headers).forEach(key => {
//           xhr.setRequestHeader(key, headers[key]);
//         });

//         xhr.send(formData);
//       });
//     } catch (error) {
//       console.error('Upload Error:', error);
//       throw error;
//     }
//   }
// }

// // Export singleton instance
// export const apiClient = new APIClient();

// // Export class for testing/custom instances
// export default APIClient;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.refreshToken = null;
    this.timeout = 30000; // 30 seconds default timeout
    this.requestInterceptors = [];
    this.responseInterceptors = [];

    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setToken(token, refreshToken = null) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }

      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      } else if (refreshToken === null && !token) {
        localStorage.removeItem('refresh_token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  clearToken() {
    this.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh_token');
    }
  }

  // Interceptor methods
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  async runRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      try {
        modifiedConfig = await interceptor(modifiedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }
    return modifiedConfig;
  }

  async runResponseInterceptors(response, error = null) {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      try {
        modifiedResponse = await interceptor(modifiedResponse, error);
      } catch (err) {
        console.error('Response interceptor error:', err);
      }
    }
    return modifiedResponse;
  }

  // Token refresh logic
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { jwt, token, refreshToken } = data;
      
      // Handle different response formats
      const newToken = jwt || token;
      const newRefreshToken = refreshToken || this.refreshToken;
      
      this.setToken(newToken, newRefreshToken);
      return newToken;
    } catch (error) {
      // If refresh fails, clear tokens and redirect to login
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    const { timeout = this.timeout, ...requestOptions } = options;
    
    let config = {
      headers: {
        'Content-Type': 'application/json',
        ...requestOptions.headers,
      },
      ...requestOptions,
    };

    // Add authorization token if available
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // // Handle body serialization
    // if (config.body && typeof config.body === 'object') {
    //   config.body = JSON.stringify(config.body);
    // }
    // Handle body serialization
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    // Run request interceptors
    config = await this.runRequestInterceptors(config);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    config.signal = controller.signal;

    try {
      let response = await fetch(`${this.baseURL}${endpoint}`, config);

      clearTimeout(timeoutId);

      // Handle 401 with token refresh and retry
      if (response.status === 401 && this.refreshToken && !config._retry) {
        try {
          await this.refreshAccessToken();
          
          // Retry original request with new token
          config._retry = true;
          config.headers['Authorization'] = `Bearer ${this.token}`;
          
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), timeout);
          config.signal = retryController.signal;
          
          response = await fetch(`${this.baseURL}${endpoint}`, config);
          clearTimeout(retryTimeoutId);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw refreshError;
        }
      }

      // Handle HTTP errors
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`
        }));

        // If still 401 after refresh attempt, redirect to login
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        const apiError = new Error(error.message || error.error?.message || 'Request failed');
        apiError.status = response.status;
        apiError.response = error;
        throw apiError;
      }

      // Handle empty responses
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      // Run response interceptors
      await this.runResponseInterceptors(data);

      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.isTimeout = true;
        console.error('API Request Timeout:', endpoint);
        throw timeoutError;
      }

      // Run response interceptors with error
      await this.runResponseInterceptors(null, error);

      console.error('API Request Error:', error);
      throw error;
    }
  }
  
  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }
  
  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }
  
  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
  
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
  
  // File upload with token refresh support
  async upload(endpoint, formData, onProgress) {
    const headers = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      return await this._uploadWithXHR(endpoint, formData, headers, onProgress);
    } catch (error) {
      // If 401, try to refresh token and retry
      if (error.status === 401 && this.refreshToken) {
        try {
          await this.refreshAccessToken();
          headers['Authorization'] = `Bearer ${this.token}`;
          return await this._uploadWithXHR(endpoint, formData, headers, onProgress);
        } catch (refreshError) {
          console.error('Token refresh failed during upload:', refreshError);
          throw refreshError;
        }
      }
      throw error;
    }
  }

  _uploadWithXHR(endpoint, formData, headers, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          const error = new Error(`Upload failed with status ${xhr.status}`);
          error.status = xhr.status;
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      xhr.timeout = this.timeout;

      // Set headers
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });

      xhr.send(formData);
    });
  }

  // Set custom timeout
  setTimeout(timeout) {
    this.timeout = timeout;
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Auto-add request interceptor to include token
apiClient.addRequestInterceptor((config) => {
  const token = apiClient.getToken();
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Export class for testing/custom instances
export default APIClient;