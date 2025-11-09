'use client';

import MoreMenu from '@/components/more/MoreMenu';
import { PATH_ADMIN_CONFIGURATION, PATH_PRACTICE_TYPING } from '@/app/paths';
import { useAppState } from '@/state/AppState';
import { IoArrowDown, IoArrowUp } from 'react-icons/io5';
import { clsx } from 'clsx/lite';
import AdminAppInfoIcon from './AdminAppInfoIcon';
import { signOutAction } from '@/auth/actions';
import { ComponentProps, useMemo } from 'react';
import IconSignOut from '@/components/icons/IconSignOut';
import IconKeyboard from '@/components/icons/IconKeyboard';
import MoreMenuItem from '@/components/more/MoreMenuItem';
import { useAppText } from '@/i18n/state/client';

export default function AdminAppMenu({
  active,
  animateMenuClose,
  isOpen,
  setIsOpen,
  className,
}: {
  active?: boolean
  animateMenuClose?: boolean
  isOpen?: boolean
  setIsOpen?: (isOpen: boolean) => void
  className?: string
}) {
  const { clearAuthStateAndRedirectIfNecessary, refreshAdminData } = useAppState();

  const appText = useAppText();

  // Minimal admin menu - photography features removed
  const sectionMain: ComponentProps<typeof MoreMenuItem>[] = useMemo(() => [{
    label: appText.admin.appConfig,
    icon: <AdminAppInfoIcon
      size="small"
      className="translate-x-[-0.5px] translate-y-[0.5px]"
    />,
    href: PATH_ADMIN_CONFIGURATION,
  }, {
    label: 'Typing Practice',
    icon: <IconKeyboard size={15} />,
    href: PATH_PRACTICE_TYPING,
  }], [appText]);

  const sectionSignOut: ComponentProps<typeof MoreMenuItem>[] =
    useMemo(() => ([{
      label: appText.auth.signOut,
      icon: <IconSignOut size={15} />,
      action: () => signOutAction().then(clearAuthStateAndRedirectIfNecessary),
    }]), [appText.auth.signOut, clearAuthStateAndRedirectIfNecessary]);

  const sections = useMemo(() =>
    [sectionMain, sectionSignOut]
  , [sectionMain, sectionSignOut]);

  return (
    <MoreMenu
      {...{ isOpen, setIsOpen }}
      icon={<div className={clsx(
        'w-[28px] h-[28px]',
        'overflow-hidden',
      )}>
        <div className={clsx(
          'flex flex-col items-center justify-center gap-2',
          'relative transition-transform',
          animateMenuClose ? 'duration-300' : 'duration-0',
          'translate-y-[-18px]',
        )}>
          <IoArrowDown size={16} className="shrink-0" />
          <IoArrowUp size={16} className="shrink-0" />
        </div>
      </div>}
      align="start"
      sideOffset={12}
      alignOffset={-85}
      onOpen={refreshAdminData}
      className={clsx(
        'border-medium',
        className,
      )}
      classNameButton={clsx(
        'p-0!',
        'w-full h-full',
        'flex items-center justify-center',
        'hover:bg-transparent dark:hover:bg-transparent',
        'active:bg-transparent dark:active:bg-transparent',
        'rounded-none focus:outline-none',
        active
          ? 'text-black dark:text-white'
          : 'text-gray-400 dark:text-gray-600',
      )}
      classNameButtonOpen={clsx(
        'bg-dim text-main!',
        '[&>*>*]:translate-y-[6px]',
        !animateMenuClose && '[&>*>*]:duration-300',
      )}
      sections={sections}
      ariaLabel="Admin Menu"
    />
  );
}
