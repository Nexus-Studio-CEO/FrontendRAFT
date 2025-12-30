/**
 * FrontendRAFT - Vue Plugin
 * 
 * Vue composables for RAFT
 * RAFT = Reactive API for Frontend Transformation
 * 
 * Inspired by CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { ref, computed, onMounted, onUnmounted, inject, provide } from 'vue';

const RAFTSymbol = Symbol('raft');

export function provideRAFT(raft) {
  provide(RAFTSymbol, raft);
}

export function useRAFT() {
  const raft = inject(RAFTSymbol);
  
  if (!raft) {
    throw new Error('RAFT not provided. Use provideRAFT in parent component.');
  }
  
  return raft;
}

export function useQuery(initialData, queryOptions) {
  const raft = useRAFT();
  const data = ref(initialData);

  const refresh = () => {
    if (initialData.value) {
      data.value = raft.queryData(initialData.value, queryOptions.value);
    }
  };

  onMounted(refresh);

  return { data, refresh };
}

export function useStream(channel, generator, config) {
  const raft = useRAFT();
  const messages = ref([]);
  const isActive = ref(false);

  let stopStream = null;

  onMounted(async () => {
    isActive.value = true;
    
    for await (const message of raft.stream(channel.value, generator, config.value)) {
      if (!isActive.value) break;
      messages.value.push(message);
    }
  });

  onUnmounted(() => {
    isActive.value = false;
  });

  return { messages, isActive };
}

export function useSubscribe(channel) {
  const raft = useRAFT();
  const messages = ref([]);

  onMounted(() => {
    const unsubscribe = raft.subscribe(channel.value, (message) => {
      messages.value.push(message);
    });

    onUnmounted(unsubscribe);
  });

  return { messages };
}

export function useOptimistic(entity, originalData) {
  const raft = useRAFT();
  const data = ref(originalData);
  const isPending = ref(false);
  const error = ref(null);

  const update = async (optimisticData, actualRequest) => {
    isPending.value = true;
    error.value = null;
    
    const result = await raft.optimisticUpdate(
      entity.value,
      optimisticData,
      actualRequest,
      {
        originalData: data.value,
        onOptimistic: (optData) => {
          data.value = optData;
        },
        onConfirm: (actualData) => {
          data.value = actualData;
          isPending.value = false;
        },
        onRollback: (rollbackData) => {
          data.value = rollbackData;
          isPending.value = false;
          error.value = 'Update failed';
        }
      }
    );

    if (!result.success) {
      error.value = result.error;
    }

    return result;
  };

  return { data, isPending, error, update };
}

export function useCache(key, fetcher, ttl) {
  const raft = useRAFT();
  const data = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const load = async () => {
    try {
      const result = await raft.executeWithCache(key.value, fetcher, ttl.value);
      data.value = result;
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  };

  const invalidate = async () => {
    raft.cache.delete(key.value);
    loading.value = true;
    data.value = null;
    
    try {
      const result = await fetcher();
      data.value = result;
      loading.value = false;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
    }
  };

  onMounted(load);

  return { data, loading, error, invalidate };
}

export function useAuth() {
  const raft = useRAFT();
  const user = ref(null);
  const token = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const signup = async (email, password, metadata) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await raft.auth.signup(email, password, metadata);
      user.value = result.user;
      token.value = result.token;
      loading.value = false;
      return result;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
      throw err;
    }
  };

  const login = async (email, password) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await raft.auth.login(email, password);
      user.value = result.user;
      token.value = result.token;
      loading.value = false;
      return result;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
      throw err;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
  };

  return { user, token, loading, error, signup, login, logout };
}

export function useRAFTRequest(method, path) {
  const raft = useRAFT();
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const execute = async (body, options = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await raft.handle({
        method: method.value,
        path: path.value,
        body,
        headers: options.headers || {},
        query: options.query || {}
      });

      data.value = response.data;
      loading.value = false;
      return response;
    } catch (err) {
      error.value = err.message;
      loading.value = false;
      throw err;
    }
  };

  return { data, loading, error, execute };
}