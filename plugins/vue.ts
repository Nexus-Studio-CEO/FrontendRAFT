/**
 * FrontendRAFT - Vue Plugin
 * 
 * Vue composables for FrontendRAFT.
 * Note: Requires Vue 3+ to be installed separately.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 27, 2025
 */

import type { FrontendRAFT } from '../core/FrontendRAFT';
import type { QueryOptions } from '../types';

// Type-only imports for Vue (peer dependency)
type Ref<T> = { value: T };
type VueModule = {
  ref: <T>(value: T) => Ref<T>;
  onMounted: (fn: () => void) => void;
  onUnmounted: (fn: () => void) => void;
};

// Runtime Vue imports with error handling
function getVue(): VueModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('vue') as VueModule;
  } catch (e) {
    throw new Error(
      'Vue is not installed. Install it with: npm install vue\n' +
      'FrontendRAFT Vue plugin requires Vue 3+ as a peer dependency.'
    );
  }
}

export function useRAFT(raft: FrontendRAFT) {
  const vue = getVue();
  const ready = vue.ref(false);

  vue.onMounted(async () => {
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
  const vue = getVue();
  const data = vue.ref<T[]>([]);
  const loading = vue.ref(true);
  const error = vue.ref<Error | null>(null);

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

  vue.onMounted(fetchData);

  return { data, loading, error, refetch: fetchData };
}

export function useOptimistic<T>(raft: FrontendRAFT, resourceType: string) {
  const vue = getVue();
  const data = vue.ref<T | null>(null);
  const pending = vue.ref(false);

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
  const vue = getVue();
  const messages = vue.ref<T[]>([]);
  const connected = vue.ref(false);
  let subscription: any;

  vue.onMounted(async () => {
    subscription = await raft.stream!.subscribe(channel, (data: T) => {
      messages.value.push(data);
    });
    connected.value = true;
  });

  vue.onUnmounted(() => {
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
  const vue = getVue();
  const data = vue.ref<T | null>(null);
  const loading = vue.ref(true);

  vue.onMounted(async () => {
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