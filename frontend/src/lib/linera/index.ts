// Linera module exports
export { 
  lineraAdapter, 
  isConnected, 
  getChainId, 
  getAutoSignerAddress, 
  getEvmAddress,
  disconnect,
  logout,
  query, 
  mutate, 
  queryWithSync,
  syncInboxFast
} from './lineraAdapter';

export type { ConnectionState, LineraConnection } from './lineraAdapter';
export { AutoSigner, createAutoSigner } from './autoSigner';
export { ensureWasmInitialized, isWasmReady } from './wasmInit';
