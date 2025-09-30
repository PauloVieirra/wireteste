
import React from 'react';
import { useDashboard } from './DashboardProvider';

// This is a generic dashboard component.
// You would create specific dashboards for each project type.
export const TestDashboard: React.FC = () => {
  const { results, loading } = useDashboard();

  if (loading) {
    return <div>Carregando resultados do teste...</div>;
  }

  if (results.length === 0) {
    return <div>Nenhum resultado encontrado para este teste ainda.</div>;
  }

  return (
    <div>
      <h2>Resultados do Teste</h2>
      <p>{results.length} participantes responderam.</p>
      
      {/* 
        Aqui você começaria a construir seus gráficos.
        Por exemplo, usando uma biblioteca como Recharts.
      */}
      
      <h3>Dados Brutos:</h3>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
};
