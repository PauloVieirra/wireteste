import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface IncompleteProfileNotificationProps {
  onCompleteProfile: () => void;
}

const IncompleteProfileNotification: React.FC<IncompleteProfileNotificationProps> = ({ onCompleteProfile }) => {
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-3" />
        <p>
          <span className="font-bold">Perfil Incompleto:</span> Para ser elegível para os testes, por favor, complete seu perfil.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onCompleteProfile}>
        Completar Perfil
      </Button>
    </div>
  );
};

export default IncompleteProfileNotification;
