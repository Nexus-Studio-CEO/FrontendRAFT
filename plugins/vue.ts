/**
 * FrontendRAFT - Vue Plugin
 * 
 * Vue composables for FrontendRAFT.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import type { FrontendRAFT } from '../core/FrontendRAFT';
import type { QueryOptions } from '../types';

export function useRAFT(raft: FrontendRAFT) {
  const ready = ref(false);

  onMounted(async () => {
    await raft.init();
    ready.value = true;
  });

  return { raft, ready };
}

export function useQuery<T>(
  raft: FrontendRAFT,
  resourceType: string,
  options?: QueryOptions
) {
  const data: Ref<T[]> = ref([]);
  const loading = ref(true);
  const error: Ref<Error | null> = ref(null);

  const fetchData = async () => {
    try {
      loading.value = true;
      const result = await raft.query!.query<T>(resourceType, options);
      data.value = result.data;
      error.value = null;
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchData);

  return { data, loading, error, refetch: fetchData };
}

export function useOptimistic<T>(raft: FrontendRAFT, resourceType: string) {
  const data: Ref<T | null> = ref(null);
  const pending = ref(false);

  const create = async (
    optimisticData: T,
    actualRequest: () => Promise<T>
  ) => {
    pending.value = true;
    data.value = optimisticData;

    try {
      const result = await raft.optimistic!.create(
        resourceType,
        optimisticData,
        actualRequest,
        {
          onSuccess: (result) => { data.value = result; },
          onError: () => { data.value = null; }
        }
      );
      return result;
    } finally {
      pending.value = false;
    }
  };

  return { data, pending, create };
}

export function useStream<T>(raft: FrontendRAFT, channel: string) {
  const messages: Ref<T[]> = ref([]);
  const connected = ref(false);
  let subscription: any;

  onMounted(async () => {
    subscription = await raft.stream!.subscribe(channel, (data: T) => {
      messages.value.push(data);
    });
    connected.value = true;
  });

  onUnmounted(() => {
    if (subscription) {
      subscription.unsubscribe();
      connected.value = false;
    }
  });

  const broadcast = async (data: T) => {
    await raft.stream!.broadcast(channel, data);
  };

  return { messages, connected, broadcast };
}

export function useCache<T>(raft: FrontendRAFT, key: string) {
  const data: Ref<T | null> = ref(null);
  const loading = ref(true);

  onMounted(async () => {
    const cached = await raft.cache!.get<T>(key);
    data.value = cached;
    loading.value = false;
  });

  const setCache = async (value: T, options?: any) => {
    await raft.cache!.set(key, value, options);
    data.value = value;
  };

  return { data, loading, setCache };
}