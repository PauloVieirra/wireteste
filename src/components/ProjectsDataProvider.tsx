
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase/supabaseClient';
import { useToast } from './ToastProvider';
import type { Project, UsabilityTest, TestSession, DisplayItem } from '../types';
import { getProjectsByUser, getTestsByUser, getTestSessionsByUser } from '../utils/supabase/supabaseClient';

interface ProjectsDataContextType {
  projects: Project[];
  usabilityTests: UsabilityTest[];
  testSessions: TestSession[];
  displayList: DisplayItem[];
  loading: boolean;
  error: string | null;
  fetchData: () => void;
}

const ProjectsDataContext = createContext<ProjectsDataContextType>({
  projects: [],
  usabilityTests: [],
  testSessions: [],
  displayList: [],
  loading: true,
  error: null,
  fetchData: () => {},
});

export const useProjectsData = () => useContext(ProjectsDataContext);

export const ProjectsDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [usabilityTests, setUsabilityTests] = useState<UsabilityTest[]>([]);
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      showToast("Você precisa estar logado para ver os dados.", "error");
      return;
    }

    try {
      const [dbProjects, dbTests, dbTestSessions] = await Promise.all([
        getProjectsByUser(user),
        getTestsByUser(user),
        getTestSessionsByUser(user)
      ]);

      setProjects(dbProjects);
      setUsabilityTests(dbTests);
      setTestSessions(dbTestSessions);

    } catch (err: any) {
      setError(`Erro ao carregar dados: ${err.message}`);
      showToast(`Erro ao carregar dados: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayList: DisplayItem[] = useMemo(() => {
    const wireframeItems: DisplayItem[] = projects.map(p => {
      const associatedTests = usabilityTests.filter(t => t.config?.projectId === p.id);
      const hasTestData = associatedTests.some(t => testSessions.some(s => s.testId === t.id));
      return {
        id: p.id, type: 'wireframe', name: p.name, createdAt: p.createdAt,
        resolution: p.resolution, wireframe_count: p.wireframes.length,
        projectId: p.id, tests: associatedTests, hasTestData, original: p,
      };
    });
    return [...wireframeItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects, usabilityTests, testSessions]);

  return (
    <ProjectsDataContext.Provider value={{ projects, usabilityTests, testSessions, displayList, loading, error, fetchData }}>
      {children}
    </ProjectsDataContext.Provider>
  );
};
