/**
 * Complex Real-World Test Case for Smart Symbol Naming
 * This file contains various patterns found in production codebases
 */

// React-style component with hooks
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Effect hook with cleanup
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal
        });
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch user:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
    
    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [userId]);
  
  // Event handlers
  const handleEdit = useCallback((field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleSave = useCallback(async () => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [userId, user]);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="user-profile">
      <ProfileHeader user={user} onEdit={handleEdit} />
      <ProfileForm user={user} onSave={handleSave} />
    </div>
  );
};

// Higher-order component pattern
const withAuth = (WrappedComponent) => {
  return (props) => {
    const { user, isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      return <LoginRedirect />;
    }
    
    return <WrappedComponent {...props} user={user} />;
  };
};

// API service with method chaining
class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.interceptors = [];
  }
  
  // Method that returns function
  addInterceptor(interceptor) {
    this.interceptors.push(interceptor);
    return this; // Method chaining
  }
  
  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = this.interceptors.reduce((acc, interceptor) => {
      return interceptor(acc);
    }, options);
    
    return fetch(url, config);
  }
  
  // Factory methods
  get = (endpoint) => this.request(endpoint, { method: 'GET' });
  post = (endpoint, data) => this.request(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
  put = (endpoint, data) => this.request(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
  delete = (endpoint) => this.request(endpoint, { method: 'DELETE' });
}

// Complex async/await with error handling
const processUserData = async (users) => {
  const results = await Promise.allSettled(
    users.map(async (user) => {
      try {
        const profile = await fetchUserProfile(user.id);
        const preferences = await fetchUserPreferences(user.id);
        const activity = await fetchUserActivity(user.id);
        
        return {
          ...user,
          profile,
          preferences,
          activity,
          processed: true
        };
      } catch (error) {
        console.error(`Failed to process user ${user.id}:`, error);
        return {
          ...user,
          processed: false,
          error: error.message
        };
      }
    })
  );
  
  return results.map((result, index) => ({
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null,
    originalIndex: index
  }));
};

// Event-driven pattern with observers
class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

// Decorator pattern with closures
const createLogger = (name) => {
  const startTime = Date.now();
  
  return {
    log: (message) => {
      const elapsed = Date.now() - startTime;
      console.log(`[${name}] ${elapsed}ms: ${message}`);
    },
    
    time: (label) => {
      const labelStartTime = Date.now();
      return () => {
        const duration = Date.now() - labelStartTime;
        console.log(`[${name}] ${label}: ${duration}ms`);
      };
    },
    
    group: (groupName) => {
      console.group(`[${name}] ${groupName}`);
      return () => console.groupEnd();
    }
  };
};

// Complex callback patterns
const createAsyncQueue = () => {
  const queue = [];
  let processing = false;
  
  const processNext = async () => {
    if (processing || queue.length === 0) return;
    
    processing = true;
    const { task, resolve, reject } = queue.shift();
    
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      processing = false;
      // Process next item in queue
      setImmediate(processNext);
    }
  };
  
  return {
    add: (task) => {
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        processNext();
      });
    },
    
    clear: () => {
      queue.length = 0;
    },
    
    size: () => queue.length
  };
};

// Export patterns
export default UserProfile;
export { ApiService, EventBus, createLogger, createAsyncQueue };
export const processUserData = processUserData;
export const withAuth = withAuth;
