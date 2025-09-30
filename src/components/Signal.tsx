import React from 'react';

interface SignalProps {
  unsavedWarning: boolean;
}

export function Signal({ unsavedWarning }: SignalProps) {
  const color = unsavedWarning ? "#f84646ff" : "#28a745";
  const title = unsavedWarning
    ? "Existem alterações não salvas"
    : "Projeto salvo e atualizado";

  return (
    <span
      className="w-2.5 h-2.5 rounded-full border-2 border-card"
      style={{ backgroundColor: color }}
      title={title}
    />
  );
}
