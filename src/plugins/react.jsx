/**
 * FrontendRAFT - React Plugin
 * 
 * React hooks and components for RAFT
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';

const RAFTContext = createContext(null);

export function RAFTProvider({ raft, children }) {
  return (
    <RAFTContext.Provider value={raft}>
      {children}
    </RAFTContext.Provider>
  );
}

export function useRAFT() {
  const raft = useContext(RAFTContext);
  
  if (!raft) {
    throw new Error('useRAFT must be used within RAFTProvider');
  }
  
  return raft;
}

export function useQuery(initialData, queryOptions) {
  const raft = useRAFT();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (initialData) {
      const result = raft.queryData(initialData, queryOptions);
      setData(result);
    }
  }, [initialData, queryOptions]);

  return data;
}

export function useStream(channel, generator, config) {
  const raft = useRAFT();
  const [messages, setMessages] = useState([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let active = true;
    setIsActive(true);

    (async () => {
      for await (const message of raft.stream(channel, generator, config)) {
        if (!active) break;
        setMessages(prev => [...prev, message]);
      }
    })();

    return () => {
      active = false;
      setIsActive(false);
    };
  }, [channel]);

  return { messages, isActive };
}

export function useSubscribe(channel) {
  const raft = useRAFT();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = raft.subscribe(channel, (message) => {
      setMessages(prev => [...prev, message]);
    });

    return unsubscribe;
  }, [channel]);

  return messages;
}

export function useOptimistic(entity, originalData) {
  const raft = useRAFT();
  const [data, setData] = useState(originalData);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (optimisticData, actualRequest) => {
    setIsPending(true);
    setError(null);
    
    const result = await raft.optimisticUpdate(
      entity,
      optimisticData,
      actualRequest,
      {
        originalData: data,
        onOptimistic: (optData) => setData(optData),
        onConfirm: (actualData) => {
          setData(actualData);
          setIsPending(false);
        },
        onRollback: (rollbackData) => {
          setData(rollbackData);
          setIsPending(false);
          setError('Update failed');
        }
      }
    );

    if (!result.success) {
      setError(result.error);
    }

    return result;
  }, [entity, data]);

  return { data, isPending, error, update };
}

export function useCache(key, fetcher, ttl) {
  const raft = useRAFT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const result = await raft.executeWithCache(key, fetcher, ttl);
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [key]);

  const invalidate = useCallback(() => {
    raft.cache.delete(key);
    setLoading(true);
    setData(null);
    
    (async () => {
      try {
        const result = await fetcher();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    })();
  }, [key]);

  return { data, loading, error, invalidate };
}

export function useAuth() {
  const raft = useRAFT();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signup = useCallback(async (email, password, metadata) => {
    setLoading(true);
    setError(null);

    try {
      const result = await raft.auth.signup(email, password, metadata);
      setUser(result.user);
      setToken(result.token);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await raft.auth.login(email, password);
      setUser(result.user);
      setToken(result.token);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return { user, token, loading, error, signup, login, logout };
}

export function useRAFTRequest(method, path) {
  const raft = useRAFT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await raft.handle({
        method,
        path,
        body,
        headers: options.headers || {},
        query: options.query || {}
      });

      setData(response.data);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [method, path]);

  return { data, loading, error, execute };
}