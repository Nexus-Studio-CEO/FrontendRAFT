/**
 * FrontendRAFT - React Plugin
 * 
 * React hooks and context provider for FrontendRAFT.
 * Seamless integration with React applications.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * RAFT Context
 */
const RAFTContext = createContext(null);

/**
 * RAFT Provider Component
 * 
 * @example
 * <RAFTProvider raft={raftInstance}>
 *   <App />
 * </RAFTProvider>
 */
export function RAFTProvider({ raft, children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (raft && !raft.initialized) {
      raft.init().then(() => {
        setIsReady(true);
      });
    } else if (raft && raft.initialized) {
      setIsReady(true);
    }
  }, [raft]);

  if (!isReady) {
    return <div>Loading FrontendRAFT...</div>;
  }

  return (
    <RAFTContext.Provider value={raft}>
      {children}
    </RAFTContext.Provider>
  );
}

/**
 * useRAFT Hook
 * Access RAFT instance from context
 * 
 * @example
 * const raft = useRAFT();
 * const users = await raft.get('/api/users');
 */
export function useRAFT() {
  const raft = useContext(RAFTContext);
  
  if (!raft) {
    throw new Error('useRAFT must be used within RAFTProvider');
  }
  
  return raft;
}

/**
 * useQuery Hook
 * Fetch data with caching
 * 
 * @example
 * const { data, loading, error, refetch } = useQuery('/api/users');
 */
export function useQuery(path, options = {}) {
  const raft = useRAFT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await raft.get(path, options);
      setData(result.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [raft, path, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * useMutation Hook
 * Perform mutations with optimistic updates
 * 
 * @example
 * const [createUser, { loading, error }] = useMutation('POST', '/api/users');
 * await createUser({ name: 'Alice' });
 */
export function useMutation(method, path, options = {}) {
  const raft = useRAFT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (body) => {
    setLoading(true);
    setError(null);

    try {
      const result = await raft.request(method, path, {
        ...options,
        body
      });
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [raft, method, path, options]);

  return [mutate, { loading, error }];
}

/**
 * useStream Hook
 * Subscribe to real-time stream
 * 
 * @example
 * const events = useStream('/api/events');
 */
export function useStream(path, options = {}) {
  const raft = useRAFT();
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

    async function startStream() {
      setConnected(true);
      const stream = raft.stream.open(path, options);

      for await (const event of stream) {
        if (!active) break;
        setEvents(prev => [...prev, event]);
      }

      setConnected(false);
    }

    startStream();

    return () => {
      active = false;
    };
  }, [raft, path, options]);

  return {
    events,
    connected
  };
}

/**
 * useAuth Hook
 * Authentication state and actions
 * 
 * @example
 * const { user, login, signup, logout } = useAuth();
 */
export function useAuth() {
  const raft = useRAFT();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const result = await raft.auth.login(email, password);
      setUser(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [raft]);

  const signup = useCallback(async (email, password, config) => {
    setLoading(true);
    try {
      const result = await raft.auth.signup(email, password, config);
      setUser(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [raft]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    signup,
    logout
  };
}

export default {
  RAFTProvider,
  useRAFT,
  useQuery,
  useMutation,
  useStream,
  useAuth
};