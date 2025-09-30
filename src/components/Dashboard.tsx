import React from 'react';
import { DisplayItem } from '../App';
import { DashboardProvider } from './DashboardProvider';
import { WireframeHeatmapDashboard } from './WireframeHeatmapDashboard';
import { SurveyDashboard } from './SurveyDashboard';

interface DashboardProps {
  item: DisplayItem;
}

export function Dashboard({ item }: DashboardProps) {
  const renderSpecificDashboard = () => {
    switch (item.type) {
      case 'wireframe':
        if (!item.testId) {
          return <div className="p-6 text-center">Nenhum teste de usabilidade associado a este wireframe ainda.</div>;
        }
        return (
          <DashboardProvider itemId={item.testId} itemType={'mapa_calor'}>
            <WireframeHeatmapDashboard itemId={item.testId} itemType={'mapa_calor'} />
          </DashboardProvider>
        );
      case 'mapa_calor':
        if (!item.projectId) {
          return <div className="p-6 text-center">Nenhum projeto associado a este teste de mapa de calor.</div>;
        }
        return (
          <DashboardProvider itemId={item.id} itemType={item.type}>
            <WireframeHeatmapDashboard itemId={item.id} itemType={item.type} />
          </DashboardProvider>
        );
      case 'pesquisa':
        return (
          <DashboardProvider itemId={item.id} itemType={item.type}>
            <SurveyDashboard itemId={item.id} />
          </DashboardProvider>
        );
      default:
        return <div className="p-6 text-center">Tipo de projeto desconhecido para dashboard: {item.type}</div>;
    }
  };

  return (
    <div className="dashboard-container">
      {renderSpecificDashboard()}
    </div>
  );
}