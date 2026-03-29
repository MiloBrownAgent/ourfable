"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  deriveKeyEncryptionKey,
  unwrapFamilyKey,
  importKey,
  type WrappedKey,
} from "./vault-encryption";

// ── Context Type ─────────────────────────────────────────────────────────────

interface VaultKeyContextType {
  /** The decrypted family key, held in memory only. null = not unlocked yet. */
  familyKey: CryptoKey | null;

  /** Whether the key is currently being unlocked. */
  unlocking: boolean;

  /** Unlock the family key using the user's password and the stored wrapped key. */
  unlockFamilyKey: (
    password: string,
    keySalt: string,
    encryptedFamilyKey: string // JSON-encoded WrappedKey
  ) => Promise<boolean>;

  /** Store an already-decrypted family key (e.g. from invite flow). */
  setFamilyKey: (key: CryptoKey | null) => void;

  /** Clear the family key from memory (on logout). */
  clearFamilyKey: () => void;

  /** Whether the vault has encryption set up for this family. */
  isEncryptionEnabled: boolean;
  setEncryptionEnabled: (enabled: boolean) => void;
}

const VaultKeyContext = createContext<VaultKeyContextType>({
  familyKey: null,
  unlocking: false,
  unlockFamilyKey: async () => false,
  setFamilyKey: () => {},
  clearFamilyKey: () => {},
  isEncryptionEnabled: false,
  setEncryptionEnabled: () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function VaultKeyProvider({ children }: { children: ReactNode }) {
  const [familyKey, setFamilyKeyState] = useState<CryptoKey | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [isEncryptionEnabled, setEncryptionEnabled] = useState(false);

  const unlockFamilyKey = useCallback(
    async (
      password: string,
      keySalt: string,
      encryptedFamilyKeyJson: string
    ): Promise<boolean> => {
      try {
        setUnlocking(true);

        // Derive KEK from password + salt
        const kek = await deriveKeyEncryptionKey(password, keySalt);

        // Parse the wrapped key
        const wrappedKey: WrappedKey = JSON.parse(encryptedFamilyKeyJson);

        // Unwrap the family key
        const key = await unwrapFamilyKey(wrappedKey, kek);
        setFamilyKeyState(key);
        setEncryptionEnabled(true);
        return true;
      } catch (err) {
        console.error("[VaultKey] Failed to unlock family key:", err);
        return false;
      } finally {
        setUnlocking(false);
      }
    },
    []
  );

  const setFamilyKey = useCallback((key: CryptoKey | null) => {
    setFamilyKeyState(key);
    if (key) setEncryptionEnabled(true);
  }, []);

  const clearFamilyKey = useCallback(() => {
    setFamilyKeyState(null);
  }, []);

  return (
    <VaultKeyContext.Provider
      value={{
        familyKey,
        unlocking,
        unlockFamilyKey,
        setFamilyKey,
        clearFamilyKey,
        isEncryptionEnabled,
        setEncryptionEnabled,
      }}
    >
      {children}
    </VaultKeyContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useVaultKey() {
  return useContext(VaultKeyContext);
}
