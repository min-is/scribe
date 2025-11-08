import Switcher from '@/components/Switcher';
import SwitcherItem from '@/components/SwitcherItem';
import IconSearch from '../components/icons/IconSearch';
import { useAppState } from '@/state/AppState';
import {
  SHOW_KEYBOARD_SHORTCUT_TOOLTIPS,
} from './config';
import AdminAppMenu from '@/admin/AdminAppMenu';
import Spinner from '@/components/Spinner';
import clsx from 'clsx/lite';
import { useState } from 'react';
import { useAppText } from '@/i18n/state/client';

export type SwitcherSelection = 'admin';

export default function AppViewSwitcher({
  currentSelection,
  className,
}: {
  currentSelection?: SwitcherSelection
  className?: string
}) {
  const appText = useAppText();

  const {
    isUserSignedIn,
    isUserSignedInEager,
    setIsCommandKOpen,
  } = useAppState();

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  return (
    <div
      className={clsx(
        'flex gap-1 sm:gap-2',
        className,
      )}
    >
      <Switcher>
        {/* Show spinner if admin is suspected to be logged in */}
        {(isUserSignedInEager && !isUserSignedIn) &&
          <SwitcherItem
            icon={<Spinner />}
            isInteractive={false}
            noPadding
          />}
        {isUserSignedIn &&
          <SwitcherItem
            icon={<AdminAppMenu
              isOpen={isAdminMenuOpen}
              setIsOpen={setIsAdminMenuOpen}
            />}
            noPadding
          />}
      </Switcher>
      <Switcher type="borderless">
        <SwitcherItem
          icon={<IconSearch includeTitle={false} />}
          onClick={() => setIsCommandKOpen?.(true)}
          tooltip={{...SHOW_KEYBOARD_SHORTCUT_TOOLTIPS && {
            content: appText.nav.search,
          }}}
        />
      </Switcher>
    </div>
  );
}
