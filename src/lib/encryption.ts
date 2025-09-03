/**
 * Client-side encryption utility for API keys using SubtleCrypto API
 * Provides secure encryption/decryption using AES-GCM algorithm
 */

interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;

  /**
   * Derives a cryptographic key from a password using PBKDF2
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      importedKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates a master key based on user ID and session token
   */
  private static generateMasterKey(userId: string, sessionToken?: string): string {
    // Use a combination of user ID and session token for key derivation
    // In production, you might want to use additional entropy
    const baseKey = `${userId}:${sessionToken || 'default'}:api_encryption`;
    return baseKey;
  }

  /**
   * Encrypts a string using AES-GCM
   */
  static async encryptApiKey(
    plaintext: string, 
    userId: string, 
    sessionToken?: string
  ): Promise<EncryptedData> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Derive key from master key and salt
      const masterKey = this.generateMasterKey(userId, sessionToken);
      const key = await this.deriveKey(masterKey, salt);

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        data
      );

      // Convert to base64 for storage
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedData = btoa(String.fromCharCode(...encryptedArray));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const saltBase64 = btoa(String.fromCharCode(...salt));

      return {
        encryptedData,
        iv: ivBase64,
        salt: saltBase64
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt API key');
    }
  }

  /**
   * Decrypts an encrypted API key
   */
  static async decryptApiKey(
    encryptedData: EncryptedData, 
    userId: string, 
    sessionToken?: string
  ): Promise<string> {
    try {
      // Convert from base64
      const encrypted = new Uint8Array(
        atob(encryptedData.encryptedData).split('').map(char => char.charCodeAt(0))
      );
      const iv = new Uint8Array(
        atob(encryptedData.iv).split('').map(char => char.charCodeAt(0))
      );
      const salt = new Uint8Array(
        atob(encryptedData.salt).split('').map(char => char.charCodeAt(0))
      );

      // Derive the same key
      const masterKey = this.generateMasterKey(userId, sessionToken);
      const key = await this.deriveKey(masterKey, salt);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt API key');
    }
  }

  /**
   * Encrypts multiple API keys
   */
  static async encryptApiKeys(
    apiKeys: Record<string, string>, 
    userId: string, 
    sessionToken?: string
  ): Promise<Record<string, EncryptedData>> {
    const encrypted: Record<string, EncryptedData> = {};
    
    for (const [keyName, keyValue] of Object.entries(apiKeys)) {
      if (keyValue && keyValue.trim()) {
        encrypted[keyName] = await this.encryptApiKey(keyValue, userId, sessionToken);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypts multiple API keys
   */
  static async decryptApiKeys(
    encryptedKeys: Record<string, EncryptedData>, 
    userId: string, 
    sessionToken?: string
  ): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {};
    
    for (const [keyName, encryptedData] of Object.entries(encryptedKeys)) {
      try {
        decrypted[keyName] = await this.decryptApiKey(encryptedData, userId, sessionToken);
      } catch (error) {
        console.warn(`Failed to decrypt API key ${keyName}:`, error);
        // Skip failed decryptions rather than failing entirely
      }
    }
    
    return decrypted;
  }

  /**
   * Check if encryption is supported by the browser
   */
  static isSupported(): boolean {
    return (
      typeof crypto !== 'undefined' &&
      typeof crypto.subtle !== 'undefined' &&
      typeof crypto.subtle.encrypt === 'function' &&
      typeof crypto.subtle.decrypt === 'function'
    );
  }
}

export { EncryptionService };
export type { EncryptedData };