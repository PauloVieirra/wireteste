import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card } from './ui/card';
import { Edit } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
}

export function NewProjectModal({ isOpen, onClose, onSelectType }: NewProjectModalProps) {
  return (
    // Dialog com grid e cards consistentes
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent
    style={{
      width: "95vw",         // ocupa a maior parte da largura da tela
      maxWidth: "1200px",    // limite máximo
      maxHeight: "90vh",     // limita a altura para permitir scroll interno
    }}
    className="rounded-lg p-6 shadow-xl"
  >
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-gray-800">Novo Projeto de Wireframe</DialogTitle>
      <DialogDescription className="text-gray-500">
        Comece a criar seu wireframe com um novo projeto.
      </DialogDescription>
    </DialogHeader>

    {/* area que permite scroll se houver muitos cards */}
    <div className="mt-6 overflow-auto" style={{ maxHeight: "72vh" }}>
      {/* auto-rows-fr garante que todas as linhas tenham a mesma altura (cards uniformes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        <Card
          key="wireframe"
          onClick={() => onSelectType('wireframe')}
          className={`group flex flex-col h-full p-6 rounded-lg border transition-all relative overflow-hidden cursor-pointer bg-white hover:border-blue-500 hover:shadow-lg`}
        >
          {/* ícone com detalhe de cor */}
          <div
            className="mb-4 flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: 52,
              height: 52,
              backgroundColor: '#e6f5ff',
              borderRadius: 9999,
            }}
          >
            <Edit className="w-8 h-8 text-blue-500" />
          </div>
          {/* título e descrição*/}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 transition-colors group-hover:text-blue-600">
              Projeto de Wireframe
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Crie e edite wireframes interativos do zero.
            </p>
          </div>
        </Card>
      </div>
    </div>
  </DialogContent>
</Dialog>


  );
}
