/**
 * Linera Adapter - Singleton managing all Linera blockchain interactions
 * Uses @linera/client WASM in-browser (no backend server required)
 */

import { ensureWasmInitialized } from './wasmInit';
import { AutoSigner } from './autoSigner';

// Use 'any' for dynamic module types to avoid TypeScript issues with WASM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LineraClientModule = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Faucet = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wallet = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Application = any;

// Cached module reference
let lineraClientModule: LineraClientModule | null = null;

/**
 * Dynamically load the @linera/client module and initialize WASM
 */
async function getLineraClient(): Promise<LineraClientModule> {
  if (lineraClientModule) return lineraClientModule;
  
  try {
    console.log('[LineraAdapter] Loading @linera/client module...');
    
    // Ensure WASM is initialized first
    await ensureWasmInitialized();
    
    // Import the module
    const module = await import('@linera/client');
    
    lineraClientModule = module;
    console.log('[LineraAdapter] Module loaded successfully');
    return lineraClientModule;
  } catch (error) {
    console.error('[LineraAdapter] Failed to load @linera/client:', error);
    throw error;
  }
}

// Environment configuration - read from env vars
// @ts-expect-error Vite env types
const DEFAULT_FAUCET_URL = import.meta.env?.VITE_LINERA_FAUCET_URL || 'https://faucet.testnet-conway.linera.net';
// @ts-expect-error Vite env types
const APPLICATION_ID = import.meta.env?.VITE_APPLICATION_ID || '';

/**
 * Connection state after wallet connect
 */
export interface LineraConnection {
  client: Client;
  wallet: Wallet;
  faucet: Faucet;
  chainId: string;
  autoSignerAddress: string;
  evmAddress?: string;
}

/**
 * Application connection state
 */
export interface ApplicationConnection {
  application: Application;
  applicationId: string;
}

/**
 * Connection state for external use
 */
export interface ConnectionState {
  isConnected: boolean;
  chainId: string | null;
  autoSignerAddress: string | null;
  evmAddress: string | null;
}

/**
 * LineraAdapter - Singleton class managing Linera connections
 */
class LineraAdapterClass {
  private static instance: LineraAdapterClass | null = null;
  
  // Connection state
  private connection: LineraConnection | null = null;
  private appConnection: ApplicationConnection | null = null;
  private connectPromise: Promise<LineraConnection> | null = null;
  private autoSigner: AutoSigner | null = null;

  private constructor() {
    console.log('[LineraAdapter] Instance created');
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): LineraAdapterClass {
    if (!LineraAdapterClass.instance) {
      LineraAdapterClass.instance = new LineraAdapterClass();
    }
    return LineraAdapterClass.instance;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return {
      isConnected: this.connection !== null,
      chainId: this.connection?.chainId ?? null,
      autoSignerAddress: this.connection?.autoSignerAddress ?? null,
      evmAddress: this.connection?.evmAddress ?? null,
    };
  }

  /**
   * Get the auto-signer instance
   */
  getAutoSigner(): AutoSigner | null {
    return this.autoSigner;
  }

  /**
   * Connect to Linera network with auto-signer
   * Optionally associates an EVM address for identity
   */
  async connect(
    evmAddress?: string,
    faucetUrl: string = DEFAULT_FAUCET_URL
  ): Promise<ConnectionState> {
    // If already connected, return existing connection
    if (this.connection) {
      console.log('[LineraAdapter] Already connected');
      // Update EVM address if provided
      if (evmAddress && !this.connection.evmAddress) {
        this.connection.evmAddress = evmAddress.toLowerCase();
      }
      return this.getState();
    }

    // If connection in progress, wait for it
    if (this.connectPromise) {
      console.log('[LineraAdapter] Connection in progress, waiting...');
      await this.connectPromise;
      return this.getState();
    }

    // Start new connection
    this.connectPromise = this.performConnect(faucetUrl, evmAddress);
    
    try {
      await this.connectPromise;
      return this.getState();
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Internal connection implementation
   * Creates or restores auto-signer and claims a chain
   */
  private async performConnect(
    faucetUrl: string,
    evmAddress?: string
  ): Promise<LineraConnection> {
    try {
      console.log('[LineraAdapter] Starting connection...');
      console.log('[LineraAdapter] Faucet URL:', faucetUrl);
      if (evmAddress) {
        console.log('[LineraAdapter] EVM address (for identity):', evmAddress);
      }
      
      // Step 1: Load @linera/client module
      const lineraModule = await getLineraClient();
      const { Faucet, Client, signer: signerModule } = lineraModule;
      
      // Step 2: Create faucet connection
      console.log('[LineraAdapter] Connecting to faucet...');
      const faucet = new Faucet(faucetUrl);
      console.log('[LineraAdapter] Faucet connected');
      
      // Step 3: Create wallet
      console.log('[LineraAdapter] Creating wallet...');
      const wallet = await faucet.createWallet();
      console.log('[LineraAdapter] Wallet created');
      
      // Step 4: Create auto-signer (fresh each time for proper key management)
      console.log('[LineraAdapter] Creating auto-signer...');
      const rawSigner = signerModule.PrivateKey.createRandom();
      const autoSignerAddress = rawSigner.address();
      console.log('[LineraAdapter] Auto-signer address:', autoSignerAddress);
      
      // Step 5: Claim a microchain using auto-signer address as owner
      console.log('[LineraAdapter] Claiming microchain...');
      const chainId = await faucet.claimChain(wallet, autoSignerAddress);
      console.log('[LineraAdapter] Claimed chain:', chainId);
      
      // Step 6: Register auto-signer in wallet (CRITICAL - this was missing!)
      console.log('[LineraAdapter] Registering auto-signer in wallet...');
      if (typeof wallet.setOwner === 'function') {
        await wallet.setOwner(chainId, autoSignerAddress);
        console.log('[LineraAdapter] Auto-signer registered in wallet');
      } else {
        console.log('[LineraAdapter] wallet.setOwner not available, skipping');
      }
      
      // Step 7: Create Linera client with auto-signer
      console.log('[LineraAdapter] Creating client...');
      let client = new Client(wallet, rawSigner);
      // Client constructor may return a promise in some SDK versions
      if (client instanceof Promise) {
        client = await client;
      }
      console.log('[LineraAdapter] Client created');
      
      // Step 8: Sync chain - wrap in try/catch to handle network issues
      console.log('[LineraAdapter] Syncing chain...');
      try {
        // Check if chain method exists
        if (typeof client.chain === 'function') {
          await client.chain(chainId);
          console.log('[LineraAdapter] Chain synced');
        } else if (typeof client.connectToChain === 'function') {
          // Alternative method name in some SDK versions
          await client.connectToChain(chainId);
          console.log('[LineraAdapter] Chain connected');
        } else {
          // Log available methods for debugging
          console.log('[LineraAdapter] Client methods:', Object.keys(client).filter(k => typeof client[k] === 'function'));
          console.log('[LineraAdapter] Skipping chain sync - method not found');
        }
      } catch (syncError) {
        // Don't fail if sync has network issues with some validators
        console.warn('[LineraAdapter] Chain sync warning (non-fatal):', syncError);
      }
      
      // Store connection
      this.connection = {
        client,
        wallet,
        faucet,
        chainId,
        autoSignerAddress,
        evmAddress: evmAddress?.toLowerCase(),
      };
      
      console.log('[LineraAdapter] Connection complete!');
      console.log('[LineraAdapter] Chain ID:', chainId);
      console.log('[LineraAdapter] Auto-signer address:', autoSignerAddress);
      
      return this.connection;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[LineraAdapter] Connection failed:', message);
      this.connection = null;
      throw error;
    }
  }

  /**
   * Connect to the application
   */
  async connectApplication(applicationId: string = APPLICATION_ID): Promise<ApplicationConnection> {
    if (!this.connection) {
      throw new Error('Must connect wallet before connecting to application');
    }

    if (this.appConnection && this.appConnection.applicationId === applicationId) {
      return this.appConnection;
    }

    if (!applicationId) {
      throw new Error('Application ID is not configured');
    }

    console.log('[LineraAdapter] Connecting to application:', applicationId);
    
    // Get chain - handle different SDK API versions
    let chain;
    if (typeof this.connection.client.chain === 'function') {
      chain = await this.connection.client.chain(this.connection.chainId);
    } else if (typeof this.connection.client.getChain === 'function') {
      chain = await this.connection.client.getChain(this.connection.chainId);
    } else {
      // Try to create application directly if chain method doesn't exist
      console.warn('[LineraAdapter] chain method not found, trying direct application access');
      const app = await this.connection.client.application?.(applicationId);
      if (app) {
        this.appConnection = { application: app, applicationId };
        console.log('[LineraAdapter] Application connected (direct)');
        return this.appConnection;
      }
      throw new Error('Unable to connect to application - no suitable method found');
    }
    
    const application = await chain.application(applicationId);
    
    this.appConnection = {
      application,
      applicationId,
    };
    
    console.log('[LineraAdapter] Application connected');
    return this.appConnection;
  }

  /**
   * Disconnect from Linera
   */
  disconnect(): void {
    this.connection = null;
    this.appConnection = null;
    console.log('[LineraAdapter] Disconnected');
  }

  /**
   * Full logout (clears stored signer too)
   */
  logout(): void {
    this.disconnect();
    AutoSigner.clear();
    console.log('[LineraAdapter] Logged out and cleared signer');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Check if application is connected
   */
  isApplicationConnected(): boolean {
    return this.appConnection !== null;
  }

  /**
   * Get chain ID
   */
  getChainId(): string {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    return this.connection.chainId;
  }

  /**
   * Get auto-signer address (Linera wallet address)
   */
  getAutoSignerAddress(): string {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    return this.connection.autoSignerAddress;
  }

  /**
   * Get EVM address (if linked)
   */
  getEvmAddress(): string | null {
    return this.connection?.evmAddress ?? null;
  }

  /**
   * Set EVM address (after Dynamic login)
   */
  setEvmAddress(address: string): void {
    if (this.connection) {
      this.connection.evmAddress = address.toLowerCase();
    }
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = unknown>(
    graphqlQuery: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    if (!this.connection) {
      throw new Error('Must connect wallet before querying');
    }

    // Ensure application is connected
    if (!this.appConnection) {
      await this.connectApplication();
    }

    const payload = JSON.stringify({
      query: graphqlQuery,
      variables: variables || {},
    });

    console.log('[LineraAdapter] Query:', graphqlQuery.slice(0, 80) + '...');

    const result = await this.appConnection!.application.query(payload);
    const parsed = JSON.parse(result);

    if (parsed.data) {
      console.log('[LineraAdapter] Query response:', JSON.stringify(parsed.data).slice(0, 200));
    }

    if (parsed.errors) {
      const errorMsg = parsed.errors[0]?.message || 'Query failed';
      console.error('[LineraAdapter] Query error:', errorMsg);
      throw new Error(errorMsg);
    }

    return parsed.data;
  }

  /**
   * Execute a GraphQL mutation
   * Mutations in Linera use schedule_operation, so we need to sync and wait for block processing
   */
  async mutate<T = unknown>(
    graphqlMutation: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    if (!this.connection) {
      throw new Error('Must connect wallet before mutating');
    }

    // Ensure application is connected
    if (!this.appConnection) {
      await this.connectApplication();
    }

    const payload = JSON.stringify({
      query: graphqlMutation,
      variables: variables || {},
    });

    console.log('[LineraAdapter] Mutation:', graphqlMutation.slice(0, 80) + '...');
    console.log('[LineraAdapter] Variables:', JSON.stringify(variables));

    // Execute mutation - this schedules the operation
    const result = await this.appConnection!.application.query(payload);
    const parsed = JSON.parse(result);

    console.log('[LineraAdapter] Mutation result:', JSON.stringify(parsed));

    if (parsed.errors) {
      const errorMsg = parsed.errors[0]?.message || 'Mutation failed';
      console.error('[LineraAdapter] Mutation error:', errorMsg);
      throw new Error(errorMsg);
    }

    // After mutation, we need to wait for the block to be created and processed
    console.log('[LineraAdapter] Waiting for block processing...');
    
    // Multiple sync attempts to ensure block is processed
    for (let i = 0; i < 3; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Get chain using available method
        let chain;
        if (typeof this.connection.client.chain === 'function') {
          chain = await this.connection.client.chain(this.connection.chainId);
        } else if (typeof this.connection.client.getChain === 'function') {
          chain = await this.connection.client.getChain(this.connection.chainId);
        }
        console.log(`[LineraAdapter] Chain sync attempt ${i + 1} completed`);
        
        // Try to process any pending operations
        if (chain && typeof chain.processInbox === 'function') {
          await chain.processInbox();
          console.log('[LineraAdapter] Inbox processed');
        }
      } catch (syncError) {
        console.warn(`[LineraAdapter] Chain sync attempt ${i + 1} warning:`, syncError);
      }
    }

    console.log('[LineraAdapter] Mutation complete, block should be processed');
    return parsed.data;
  }

  /**
   * Query with chain sync (for receiving opponent moves)
   */
  async queryWithSync<T = unknown>(
    graphqlQuery: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    if (!this.connection) {
      throw new Error('Must connect wallet before querying');
    }

    // Sync chain first
    console.log('[LineraAdapter] Syncing chain before query...');
    try {
      if (typeof this.connection.client.chain === 'function') {
        await this.connection.client.chain(this.connection.chainId);
      } else if (typeof this.connection.client.getChain === 'function') {
        await this.connection.client.getChain(this.connection.chainId);
      }
    } catch (error) {
      console.warn('[LineraAdapter] Chain sync warning:', error);
    }

    return this.query<T>(graphqlQuery, variables);
  }

  /**
   * Get connection (for advanced use)
   */
  getConnection(): LineraConnection | null {
    return this.connection;
  }
}

// Export singleton instance
export const lineraAdapter = LineraAdapterClass.getInstance();

// Export convenience functions
export function isConnected(): boolean {
  return lineraAdapter.isConnected();
}

export function getChainId(): string {
  return lineraAdapter.getChainId();
}

export function getAutoSignerAddress(): string {
  return lineraAdapter.getAutoSignerAddress();
}

export function getEvmAddress(): string | null {
  return lineraAdapter.getEvmAddress();
}

export function disconnect(): void {
  lineraAdapter.disconnect();
}

export function logout(): void {
  lineraAdapter.logout();
}

export async function query<T>(q: string, v?: Record<string, unknown>): Promise<T> {
  return lineraAdapter.query<T>(q, v);
}

export async function mutate<T>(m: string, v?: Record<string, unknown>): Promise<T> {
  return lineraAdapter.mutate<T>(m, v);
}

export async function queryWithSync<T>(q: string, v?: Record<string, unknown>): Promise<T> {
  return lineraAdapter.queryWithSync<T>(q, v);
}
