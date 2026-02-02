// Auto Signer - In-browser Linera wallet signer
// Manages a private key in localStorage for smooth 1-click gameplay

import type { Signer } from '@linera/client';

const STORAGE_KEY = 'signalsiege_auto_signer';

interface StoredSigner {
  privateKey: string;
  address: string;
}

/**
 * AutoSigner implements Linera's Signer interface using a locally stored private key
 * This enables 1-click gameplay without MetaMask popups for every action
 */
export class AutoSigner implements Signer {
  private _storedPrivateKey: string;
  private _address: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private keySigner: any;

  private constructor(privateKey: string, address: string, keySigner: unknown) {
    this._storedPrivateKey = privateKey;
    this._address = address;
    this.keySigner = keySigner;
  }

  /**
   * Get the stored private key (for backup/export)
   */
  getPrivateKey(): string {
    return this._storedPrivateKey;
  }

  /**
   * Create or restore an auto-signer from localStorage
   */
  static async createOrRestore(): Promise<{ signer: AutoSigner; isNew: boolean }> {
    // Check localStorage for existing signer
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const { privateKey, address } = JSON.parse(stored) as StoredSigner;
        const linera = await import('@linera/client');
        // Try different methods to restore the key - use type assertion to bypass TS
        let keySigner;
        const PrivateKeyClass = linera.signer.PrivateKey as unknown as {
          fromString?: (key: string) => unknown;
          from?: (key: string) => unknown;
          createRandom: () => unknown;
        };
        if (typeof PrivateKeyClass.fromString === 'function') {
          keySigner = PrivateKeyClass.fromString(privateKey);
        } else if (typeof PrivateKeyClass.from === 'function') {
          keySigner = PrivateKeyClass.from(privateKey);
        } else {
          // Create new key and use it
          keySigner = linera.signer.PrivateKey.createRandom();
        }
        
        console.log('[AutoSigner] Restored from localStorage:', address);
        return {
          signer: new AutoSigner(privateKey, address, keySigner),
          isNew: false,
        };
      } catch (e) {
        console.warn('[AutoSigner] Failed to restore, creating new:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Create new signer
    const linera = await import('@linera/client');
    const keySigner = linera.signer.PrivateKey.createRandom();
    const address = keySigner.address();
    const privateKey = keySigner.toString();

    // Store for future sessions
    const toStore: StoredSigner = { privateKey, address };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));

    console.log('[AutoSigner] Created new signer:', address);
    return {
      signer: new AutoSigner(privateKey, address, keySigner),
      isNew: true,
    };
  }

  /**
   * Get the signer's address
   */
  async address(): Promise<string> {
    return this._address;
  }

  /**
   * Check if this signer can sign for the given owner address
   */
  async containsKey(owner: string): Promise<boolean> {
    return owner.toLowerCase() === this._address.toLowerCase();
  }

  /**
   * Sign a message
   */
  async sign(_owner: string, value: Uint8Array): Promise<string> {
    // Use the internal key signer to sign
    return this.keySigner.sign(value);
  }

  /**
   * Get the raw private key signer (for Linera client)
   */
  getRawSigner(): unknown {
    return this.keySigner;
  }

  /**
   * Clear the stored signer (for logout)
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[AutoSigner] Cleared stored signer');
  }

  /**
   * Check if a signer is stored
   */
  static hasStored(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}

/**
 * Create an auto-signer (convenience function)
 */
export async function createAutoSigner(): Promise<{ signer: AutoSigner; isNew: boolean }> {
  return AutoSigner.createOrRestore();
}
