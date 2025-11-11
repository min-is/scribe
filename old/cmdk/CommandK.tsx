import CommandKClient from './CommandKClient';
import { ADMIN_DEBUG_TOOLS_ENABLED } from '@/app/config';

export default async function CommandK() {
  return (
    <CommandKClient
      showDebugTools={ADMIN_DEBUG_TOOLS_ENABLED}
      footer=""
    />
  );
}
