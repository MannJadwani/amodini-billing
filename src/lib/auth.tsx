"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ACCOUNT_KEY = "simple-billing-auth-account-v1";
const SESSION_KEY = "simple-billing-auth-session-v1";

export type AuthStatus = "checking" | "setup-required" | "signed-out" | "signed-in";

type AuthAccount = {
  ownerName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

type AuthSession = {
  signedIn: true;
  ownerName: string;
  signedInAt: string;
};

type AuthValue = {
  status: AuthStatus;
  ownerName: string;
  hasAccount: boolean;
  setupAccount: (ownerName: string, password: string) => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256(`${salt}:${password}`);
}

function readAccount(): AuthAccount | null {
  return safeParse<AuthAccount>(window.localStorage.getItem(ACCOUNT_KEY));
}

function readSession(): AuthSession | null {
  return safeParse<AuthSession>(window.localStorage.getItem(SESSION_KEY));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [ownerName, setOwnerName] = useState("");

  const refresh = useCallback(() => {
    const account = readAccount();
    if (!account) {
      setOwnerName("");
      setStatus("setup-required");
      return;
    }

    const session = readSession();
    setOwnerName(account.ownerName);
    setStatus(session?.signedIn ? "signed-in" : "signed-out");
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);

  const setupAccount = useCallback(async (nextOwnerName: string, password: string) => {
    const cleanName = nextOwnerName.trim() || "Business owner";
    const salt = makeSalt();
    const account: AuthAccount = {
      ownerName: cleanName,
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };
    const session: AuthSession = {
      signedIn: true,
      ownerName: cleanName,
      signedInAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setOwnerName(cleanName);
    setStatus("signed-in");
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    const account = readAccount();
    if (!account) {
      setStatus("setup-required");
      return false;
    }

    const passwordHash = await hashPassword(password, account.salt);
    if (passwordHash !== account.passwordHash) {
      return false;
    }

    const session: AuthSession = {
      signedIn: true,
      ownerName: account.ownerName,
      signedInAt: new Date().toISOString(),
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setOwnerName(account.ownerName);
    setStatus("signed-in");
    return true;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    const account = readAccount();
    setOwnerName(account?.ownerName ?? "");
    setStatus(account ? "signed-out" : "setup-required");
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      ownerName,
      hasAccount: status !== "checking" && status !== "setup-required",
      setupAccount,
      login,
      logout,
    }),
    [status, ownerName, setupAccount, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
