import React from 'react';
import { WireframeHeatmapDashboard } from './WireframeHeatmapDashboard';
import type { Project, TestSession } from '../types';

interface DashboardProps {
  selectedProject: Project | null | undefined;
  selectedProjectSessions: TestSession[];
  // The parent component will now handle loading and data availability
}

export function Dashboard({ selectedProject, selectedProjectSessions }: DashboardProps) {
  // The main container for the dashboard content
  const containerClasses = "p-6 h-full";

  if (!selectedProject) {
    return (
      <div className={`${containerClasses} flex items-center justify-center`}>
        <div className="text-center text-muted-foreground">
          Selecione um projeto para visualizar o dashboard.
        </div>
      </div>
    );
  }

  if (selectedProjectSessions.length === 0) {
    return (
      <div className={`${containerClasses} flex items-center justify-center`}>
        <div className="text-center text-muted-foreground">
          Nenhuma sessão de teste encontrada para o projeto "{selectedProject.name}".
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <WireframeHeatmapDashboard project={selectedProject} sessions={selectedProjectSessions} />
    </div>
  );
}