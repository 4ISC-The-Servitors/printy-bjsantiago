import { useMemo } from 'react';
import {
  useOrderSelection,
  useTicketSelection,
  useServiceSelection,
  useGlobalSelection,
} from './SelectionContext';

export const useAdminSelection = () => {
  const order = useOrderSelection();
  const ticket = useTicketSelection();
  const service = useServiceSelection();
  const global = useGlobalSelection();

  return useMemo(
    () => ({ order, ticket, service, global }),
    [order, ticket, service, global]
  );
};

export default useAdminSelection;
