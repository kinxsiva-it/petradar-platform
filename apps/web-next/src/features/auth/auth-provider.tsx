'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ApiClientError, apiRequest, type ApiRequestOptions } from '../../lib/api/http-client';
import * as authApi from './auth-api';
import type {
  AuthSession,
  AuthStatus,
  AuthUser,
  AuthenticatedRequest,
  LoginRequest,
  RegisterRequest,
} from './auth-types';

export interface AuthContextValue {
  accessToken: string | null;
  authenticatedRequest: AuthenticatedRequest;
  login(request: LoginRequest): Promise<void>;
  logout(): Promise<void>;
  register(request: RegisterRequest): Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const sessionRef = useRef<AuthSession | null>(null);

  const setSession = useCallback((nextSession: AuthSession | null) => {
    sessionRef.current = nextSession;
    setSessionState(nextSession);
    setStatus(nextSession ? 'authenticated' : 'anonymous');
  }, []);

  useEffect(() => {
    let active = true;

    void restoreSession()
      .then((restoredSession) => {
        if (active) {
          setSession(restoredSession);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      });

    return () => {
      active = false;
    };
  }, [setSession]);

  const authenticatedRequest = useCallback(
    async <T,>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
      const accessToken = sessionRef.current?.accessToken;
      if (!accessToken) {
        throw new ApiClientError('Sign in to continue.', 401, null);
      }

      try {
        return await apiRequest<T>(path, { ...options, accessToken });
      } catch (error) {
        if (!(error instanceof ApiClientError) || error.status !== 401) {
          throw error;
        }

        try {
          const refreshedSession = await restoreSession();
          setSession(refreshedSession);
          return await apiRequest<T>(path, {
            ...options,
            accessToken: refreshedSession.accessToken,
          });
        } catch (refreshError) {
          setSession(null);
          throw refreshError;
        }
      }
    },
    [setSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: session?.accessToken ?? null,
      authenticatedRequest,
      login: async (request) => {
        setSession(await authApi.login(request));
      },
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          setSession(null);
        }
      },
      register: async (request) => {
        setSession(await authApi.register(request));
      },
      status,
      user: session?.user ?? null,
    }),
    [authenticatedRequest, session, setSession, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function restoreSession(): Promise<AuthSession> {
  const session = await authApi.refreshSessionOnce();
  const user = await authApi.getCurrentUser(session.accessToken);
  return { ...session, user };
}
