import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Badge } from './ui/badge';
import { Button } from './ui/button'; // Importar o componente Button

interface ConnectionStatusIndicatorProps {
  hasUnsavedChanges: boolean;
  onSyncLocalChanges: () => void; // Nova prop para a função de sincronização
}

export function ConnectionStatusIndicator({ hasUnsavedChanges, onSyncLocalChanges }: ConnectionStatusIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Badge variant="destructive" className="bg-gray-700 text-gray-100 ">
          Trabalhando Offline
        </Badge>
      </div>
    );
  }

 

  return null;
}
