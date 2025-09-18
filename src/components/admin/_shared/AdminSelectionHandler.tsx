import React from 'react';
import {
  SelectionBar,
  FloatingSelectionButton,
} from './selection/SelectionComponents';
import type { SelectionEntity } from '../../../hooks/admin/useSelection';
import { useAdminSelection } from '../../../hooks/admin/useAdminSelection';

interface AdminSelectionHandlerProps {
  entityType: SelectionEntity;
  onAddToChat: () => void;
  className?: string;
  children?: React.ReactNode;
}

const AdminSelectionHandler: React.FC<AdminSelectionHandlerProps> = ({
  entityType,
  onAddToChat,
  className,
  children,
}) => {
  const { order, ticket, service } = useAdminSelection();

  const selection =
    entityType === 'order' ? order : entityType === 'ticket' ? ticket : service;

  return (
    <>
      {children}
      <SelectionBar
        items={selection.selected}
        onRemove={selection.deselect}
        onClear={selection.clear}
        onAddToChat={onAddToChat}
        entityType={entityType}
        className={className}
      />
      <FloatingSelectionButton
        count={selection.selectionCount}
        entityType={entityType}
        onAddToChat={onAddToChat}
      />
    </>
  );
};

export default AdminSelectionHandler;
