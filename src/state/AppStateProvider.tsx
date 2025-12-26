'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { AppStateContext, ReferenceProvider } from './AppState';
import usePathnames from '@/utility/usePathnames';
import { getAuthAction } from '@/auth/actions';
import useSWR from 'swr';
import { storeTimezoneCookie } from '@/utility/timezone';
import { AdminData, getAdminDataAction } from '@/admin/actions';
import {
  storeAuthEmailCookie,
  clearAuthEmailCookie,
  isCredentialsSignInError,
  getAuthEmailCookie,
} from '@/auth';
import { useRouter, usePathname } from 'next/navigation';
import { isPathProtected, PATH_ROOT } from '@/app/paths';
import { toastSuccess } from '@/toast';

export default function AppStateProvider({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter();

  const pathname = usePathname();

  const { previousPathname } = usePathnames();

  // CORE
  const [hasLoaded, setHasLoaded] = useState(false);
  const [swrTimestamp, setSwrTimestamp] = useState(Date.now());
  const [shouldRespondToKeyboardCommands, setShouldRespondToKeyboardCommands] =
    useState(true);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);

  // AUTH
  const [userEmail, setUserEmail] = useState<string>();
  const [userEmailEager, setUserEmailEager] = useState<string>();

  // ADMIN
  const [adminUpdateTimes, setAdminUpdateTimes] = useState<Date[]>([]);

  // PROVIDER REFERENCE
  const [referenceProvider, setReferenceProvider] = useState<ReferenceProvider | null>(null);

  useEffect(() => {
    setHasLoaded?.(true);
    storeTimezoneCookie();
  }, []);

  const invalidateSwr = useCallback(() => setSwrTimestamp(Date.now()), []);

  const {
    data: auth,
    error: authError,
    isLoading: isCheckingAuth,
  } = useSWR('getAuth', getAuthAction);
  useEffect(() => {
    setUserEmailEager(getAuthEmailCookie());
  }, []);
  useEffect(() => {
    if (authError) {
      setUserEmail(undefined);
      setUserEmailEager(undefined);
      if (isCredentialsSignInError(authError)) {
        clearAuthEmailCookie();
      }
    } else {
      setUserEmail(auth?.user?.email ?? undefined);
    }
  }, [auth, authError]);
  const isUserSignedIn = Boolean(userEmail);
  const isUserSignedInEager = Boolean(userEmailEager);

  const {
    data: adminData,
    mutate: refreshAdminData,
    isLoading: isLoadingAdminData,
  } = useSWR(
    isUserSignedIn ? 'getAdminData' : null,
    getAdminDataAction,
  );
  const updateAdminData = useCallback(
    (updatedData: Partial<AdminData>) => {
      if (adminData) {
        refreshAdminData({
          ...adminData,
          ...updatedData,
        });
      }
    }, [adminData, refreshAdminData]);

  useEffect(() => {
    if (userEmail) {
      storeAuthEmailCookie(userEmail);
    }
  }, [userEmail]);

  const registerAdminUpdate = useCallback(() =>
    setAdminUpdateTimes(updates => [...updates, new Date()])
  , []);

  const clearAuthStateAndRedirectIfNecessary = useCallback(() => {
    setUserEmail(undefined);
    setUserEmailEager(undefined);
    clearAuthEmailCookie();
    if (isPathProtected(pathname)) {
      router.push(PATH_ROOT);
    } else {
      toastSuccess('Signed out');
    }
  }, [router, pathname]);

  return (
    <AppStateContext.Provider
      value={{
        // CORE
        previousPathname,
        hasLoaded,
        setHasLoaded,
        swrTimestamp,
        invalidateSwr,
        shouldRespondToKeyboardCommands,
        setShouldRespondToKeyboardCommands,
        isCommandKOpen,
        setIsCommandKOpen,
        // AUTH
        isCheckingAuth,
        userEmail,
        userEmailEager,
        setUserEmail,
        isUserSignedIn,
        isUserSignedInEager,
        clearAuthStateAndRedirectIfNecessary,
        // ADMIN
        adminUpdateTimes,
        registerAdminUpdate,
        ...adminData,
        hasAdminData: Boolean(adminData),
        isLoadingAdminData,
        refreshAdminData,
        updateAdminData,
        // PROVIDER REFERENCE
        referenceProvider,
        setReferenceProvider,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};
