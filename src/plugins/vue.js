/**
 * FrontendRAFT - Vue Plugin
 * 
 * Vue 3 composables for FrontendRAFT.
 * Seamless integration with Vue applications.
 * 
 * Based on CSOP: https://github.com/Nexus-Studio-CEO/CSOP
 * 
 * @author DAOUDA Abdoul Anzize - Nexus Studio
 * @version 0.1.0
 * @date December 28, 2025
 */

import { ref, onMounted, onUnmounted, inject, provide } from 'vue';

const RAFTSymbol = Symbol('RAFT');

/**
 * Create RAFT plugin for Vue
 * 
 * @example
 * import { createRAFT } from '@nexusstudio/frontendraft';
 * app.use(createRAFT(raftInstance));
 */
export function createRAFT(raft) {
  return {
    install(app) {
      app.provide(RAFTSymbol, raft);
      app.config.globalProperties.$raft = raft;
    }
  };
}

/**
 * useRAFT Composable
 * Access RAFT instance
 * 
 * @example
 * const raft = useRAFT();
 */
export function useRAFT() {
  const raft = inject(RAFTSymbol);
  
  if (!raft) {
    throw new Error('RAFT not provided. Use createRAFT() plugin.');
  }
  
  return raft;
}

/**
 * useQuery Composable
 * Fetch data with reactivity
 * 
 * @example
 * const { data, loading, error, refetch } = useQuery('/api/users');
 */
export function useQuery(path, options = {}) {
  const raft = useRAFT();
  const data = ref(null);
  const loading = ref(true);
  const error = ref(null);

  async function fetchData() {
    loading.value = true;
    error.value = null;

    try {
      const result = await raft.get(path, options);
      data.value = result.data;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    fetchData();
  });

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * useMutation Composable
 * Perform mutations
 * 
 * @example
 * const { mutate, loading, error } = useMutation('POST', '/api/users');
 * await mutate({ name: 'Alice' });
 */
export function useMutation(method, path, options = {}) {
  const raft = useRAFT();
  const loading = ref(false);
  const error = ref(null);

  async function mutate(body) {
    loading.value = true;
    error.value = null;

    try {
      const result = await raft.request(method, path, {
        ...options,
        body
      });
      return result;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    mutate,
    loading,
    error
  };
}

/**
 * useStream Composable
 * Subscribe to real-time stream
 * 
 * @example
 * const { events, connected } = useStream('/api/events');
 */
export function useStream(path, options = {}) {
  const raft = useRAFT();
  const events = ref([]);
  const connected = ref(false);
  let streamActive = false;

  async function startStream() {
    streamActive = true;
    connected.value = true;

    const stream = raft.stream.open(path, options);

    for await (const event of stream) {
      if (!streamActive) break;
      events.value.push(event);
    }

    connected.value = false;
  }

  onMounted(() => {
    startStream();
  });

  onUnmounted(() => {
    streamActive = false;
  });

  return {
    events,
    connected
  };
}

/**
 * useAuth Composable
 * Authentication state
 * 
 * @example
 * const { user, login, signup, logout } = useAuth();
 */
export function useAuth() {
  const raft = useRAFT();
  const user = ref(null);
  const loading = ref(false);

  async function login(email, password) {
    loading.value = true;
    try {
      const result = await raft.auth.login(email, password);
      user.value = result;
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function signup(email, password, config) {
    loading.value = true;
    try {
      const result = await raft.auth.signup(email, password, config);
      user.value = result;
      return result;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
  }

  return {
    user,
    loading,
    login,
    signup,
    logout
  };
}

export default {
  createRAFT,
  useRAFT,
  useQuery,
  useMutation,
  useStream,
  useAuth
};