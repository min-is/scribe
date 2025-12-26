'use client';

import {
  Dispatch,
  SetStateAction,
  createContext,
  use,
} from 'react';
import { AdminData } from '@/admin/actions';
import { Provider } from '@prisma/client';

// Provider type with page content for reference sidebar
export type ReferenceProvider = Provider & {
  page: { content: any } | null;
};

export type AppStateContextType = {
  // CORE
  previousPathname?: string
  hasLoaded?: boolean
  setHasLoaded?: Dispatch<SetStateAction<boolean>>
  swrTimestamp?: number
  invalidateSwr?: () => void
  shouldRespondToKeyboardCommands?: boolean
  setShouldRespondToKeyboardCommands?: Dispatch<SetStateAction<boolean>>
  isCommandKOpen?: boolean
  setIsCommandKOpen?: Dispatch<SetStateAction<boolean>>
  // AUTH
  userEmail?: string
  userEmailEager?: string
  setUserEmail?: Dispatch<SetStateAction<string | undefined>>
  isUserSignedIn?: boolean
  isUserSignedInEager?: boolean
  clearAuthStateAndRedirectIfNecessary?: () => void
  // ADMIN
  isCheckingAuth?: boolean
  adminUpdateTimes?: Date[]
  registerAdminUpdate?: () => void
  hasAdminData?: boolean
  isLoadingAdminData?: boolean
  refreshAdminData?: () => void
  updateAdminData?: (updatedData: Partial<AdminData>) => void
  // PROVIDER REFERENCE
  referenceProvider?: ReferenceProvider | null
  setReferenceProvider?: (provider: ReferenceProvider | null) => void
} & Partial<AdminData>

export const AppStateContext = createContext<AppStateContextType>({});

export const useAppState = () => use(AppStateContext);
