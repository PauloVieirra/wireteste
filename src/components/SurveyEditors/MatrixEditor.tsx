import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PlusCircle, X } from 'lucide-react';

interface MatrixItem {
  id: string;
  text: string;
}

interface MatrixEditorProps {
  rows: MatrixItem[];
  onRowsChange: (rows: MatrixItem[]) => void;
  columns: MatrixItem[];
  onColumnsChange: (columns: MatrixItem[]) => void;
}

export function MatrixEditor({ rows, onRowsChange, columns, onColumnsChange }: MatrixEditorProps) {

  const addItem = (type: 'row' | 'column') => {
    const newItem = { id: Date.now().toString(), text: '' };
    if (type === 'row') {
      onRowsChange([...rows, newItem]);
    } else {
      onColumnsChange([...columns, newItem]);
    }
  };

  const removeItem = (type: 'row' | 'column', itemId: string) => {
    if (type === 'row') {
      onRowsChange(rows.filter(i => i.id !== itemId));
    } else {
      onColumnsChange(columns.filter(i => i.id !== itemId));
    }
  };

  const updateItem = (type: 'row' | 'column', itemId: string, text: string) => {
    if (type === 'row') {
      onRowsChange(rows.map(i => i.id === itemId ? { ...i, text } : i));
    } else {
      onColumnsChange(columns.map(i => i.id === itemId ? { ...i, text } : i));
    }
  };

  return (
    <div className="pl-4 mt-4 space-y-6 border-t pt-4">
      {/* Rows Editor */}
      <div className="space-y-2">
        <Label className="font-semibold">Linhas (Afirmações)</Label>
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2">
            <Input
              value={row.text}
              onChange={(e) => updateItem('row', row.id, e.target.value)}
              placeholder={`Linha ${index + 1}`}
            />
            <Button variant="ghost" size="icon" onClick={() => removeItem('row', row.id)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addItem('row')}>
          <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Linha
        </Button>
      </div>

      {/* Columns Editor */}
      <div className="space-y-2">
        <Label className="font-semibold">Colunas (Pontos da Escala)</Label>
        {columns.map((col, index) => (
          <div key={col.id} className="flex items-center gap-2">
            <Input
              value={col.text}
              onChange={(e) => updateItem('column', col.id, e.target.value)}
              placeholder={`Coluna ${index + 1}`}
            />
            <Button variant="ghost" size="icon" onClick={() => removeItem('column', col.id)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addItem('column')}>
          <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Coluna
        </Button>
      </div>
    </div>
  );
}
