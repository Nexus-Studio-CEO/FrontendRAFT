/**
 * FrontendRAFT - React Plugin
 * 
 * React hooks and utilities for FrontendRAFT.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FrontendRAFT } from '../core/FrontendRAFT';
import type { QueryOptions } from '../types';

export function useRAFT(raft: FrontendRAFT) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    raft.init().then(() => setReady(true));
  }, [raft]);

  return { raft, ready };
}

export function useQuery<T>(
  raft: FrontendRAFT,
  resourceType: string,
  options?: QueryOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await raft.query!.query<T>(resourceType, options);
        if (!cancelled) {
          setData(result.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [raft, resourceType, JSON.stringify(options)]);

  return { data, loading, error };
}

export function useOptimistic<T>(raft: FrontendRAFT, resourceType: string) {
  const [data, setData] = useState<T | null>(null);
  const [pending, setPending] = useState(false);

  const create = useCallback(async (
    optimisticData: T,
    actualRequest: () => Promise<T>
  ) => {
    setPending(true);
    setData(optimisticData);

    try {
      const result = await raft.optimistic!.create(
        resourceType,
        optimisticData,
        actualRequest,
        {
          onSuccess: (result) => setData(result),
          onError: () => setData(null)
        }
      );
      return result;
    } finally {
      setPending(false);
    }
  }, [raft, resourceType]);

  return { data, pending, create };
}

export function useStream<T>(raft: FrontendRAFT, channel: string) {
  const [messages, setMessages] = useState<T[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let subscription: any;

    const connect = async () => {
      subscription = await raft.stream!.subscribe(channel, (data: T) => {
        setMessages(prev => [...prev, data]);
      });
      setConnected(true);
    };

    connect();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        setConnected(false);
      }
    };
  }, [raft, channel]);

  const broadcast = useCallback(async (data: T) => {
    await raft.stream!.broadcast(channel, data);
  }, [raft, channel]);

  return { messages, connected, broadcast };
}

export function useCache<T>(raft: FrontendRAFT, key: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCache = async () => {
      const cached = await raft.cache!.get<T>(key);
      setData(cached);
      setLoading(false);
    };

    loadCache();
  }, [raft, key]);

  const setCache = useCallback(async (value: T, options?: any) => {
    await raft.cache!.set(key, value, options);
    setData(value);
  }, [raft, key]);

  return { data, loading, setCache };
}