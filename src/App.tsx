import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectList } from './components/ProjectList';
import { WireframeEditor } from './components/WireframeEditor';
import { TestCreator } from './components/TestCreator';
import { Dashboard } from './components/Dashboard';
import { UserSessionDetail } from './components/UserSessionDetail';
import { UserTestInterface } from './components/UserTestInterface';
import { UserSurveyInterface } from './components/UserSurveyInterface';
import { LandingPage } from './components/LandingPage';
import { UserHomePage } from './components/UserHomePage';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { ToastProvider, useToast } from './components/ToastProvider';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getProjectsByUser, getTestsByUser, getSurveysByUser, getTestSessionsByUser, saveTest as saveTestToDb, saveSurvey, getTestById, getSurveyById, getProjectById, deleteProjectById, deleteTestById, deleteSurveyById, saveTestSession, saveOrUpdateProject } from './utils/supabase/supabaseClient';
import { supabase } from './utils/supabase/client';
import { NewProjectModal } from './components/NewProjectModal';
import { CreateWireframeDialog } from './components/CreateWireframeDialog';
import { CreateSurveyPage } from './components/CreateSurveyPage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './components/ui/alert-dialog';
import { CreateUsabilityTest } from './components/CreateUsabilityTest';
import ChooseTestType from './components/ConfigureTest/ChooseTestType';
import ProfileForm from './components/UserProfile/ProfileForm';
import CreateTestGroup from './components/ConfigureTest/CreateTestGroup';
import { ConfigureTestModal } from './components/ConfigureTest/ConfigureTestModal';
import { SendSurveyModal } from './components/SendSurveyModal';
import TesterSignupPage from './components/TesterSignupPage';
import IncompleteProfileNotification from './components/IncompleteProfileNotification';
import localforage from 'localforage'; // Import localforage
import { useOnlineStatus } from './hooks/useOnlineStatus'; // Importar o hook de status online
// import ManageTestScreen from './components/ManageTestScreen'; // Removido: Importar ManageTestScreen
import { Loader2 } from 'lucide-react'; // Importar Loader2 para o estado de carregamento
import { useLoading } from './components/GlobalLoading'; // Importar useLoading

import { ProjectsDataProvider, useProjectsData } from './components/ProjectsDataProvider';
import type { DisplayItem, Project, User, Wireframe, Test, UsabilityTest, TestSession, Survey } from './types';

type View = 'projects' | 'wireframe-editor' | 'test-creator' | 'dashboard' | 'user-test' | 'user-survey' | 'user-home' | 'session-detail' | 'create-usability-test' | 'profile' | 'signup-tester' | 'manage-test' | 'create-survey' | 'survey-editor';

export default function App() {
  const { showToast } = useToast();
  const { showLoading, hideLoading } = useLoading(); // Usar o hook de loading
  const [currentView, setCurrentView] = useState<View>('projects');
  const [initialView, setInitialView] = useState<View>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tests, setTests] = useState<Test[]>([]); // Old hotspot tests
  const [usabilityTests, setUsabilityTests] = useState<UsabilityTest[]>([]); // New heatmap/eye/face tests
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [selectedSurveyToTake, setSelectedSurveyToTake] = useState<Survey | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedSession, setSelectedSession] = useState<TestSession | null>(null);
  const [selectedProjectIdForDashboard, setSelectedProjectIdForDashboard] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isTesterProfileIncomplete, setIsTesterProfileIncomplete] = useState(false);
  const [unsavedProjectIds, setUnsavedProjectIds] = useState<string[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCreateWireframeDialogOpen, setIsCreateWireframeDialogOpen] = useState(false);
  const [isConfigureTestModalOpen, setIsConfigureTestModalOpen] = useState(false);
  const [isSendSurveyModalOpen, setIsSendSurveyModalOpen] = useState(false);
  const [selectedSurveyToSend, setSelectedSurveyToSend] = useState<Survey | null>(null);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<any>(null); // Old hotspot test
  const [refreshUserInboxKey, setRefreshUserInboxKey] = useState(0); // Novo estado para forçar recarga da caixa de entrada
  // const [isLoading, setIsLoading] = useState(true); // Removido: Usar useLoading
  const [sendingMessage, setSendingMessage] = useState('');
  const isOnline = useOnlineStatus(); // Usar o hook de status online
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Novo estado para controlar alterações não salvas
  const [viewHistory, setViewHistory] = useState<View[]>([]); // Histórico de visualizações
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const userIdRef = useRef<string | null>(null);


  const offlineToastShownRef = useRef(false); // Novo ref para controlar o toast offline
  const unsavedChangesToastShownRef = useRef(false); // Novo ref para controlar o toast de alterações não salvas
  const prevOnlineStatusRef = useRef(isOnline);

  // --- DATA FETCHING AND OFFLINE PERSISTENCE ---
  const fetchAllData = async (currentUser: User | null) => {
    if (!currentUser) return;
    showLoading("Carregando dados..."); // Ativar loading

    try {
      if (isOnline) {
        // Resetar o ref de toast offline ao ficar online
        offlineToastShownRef.current = false;
        unsavedChangesToastShownRef.current = false; // Resetar este também
        
        const [dbProjects, dbTests, dbTestSessions, dbSurveys] = await Promise.all([
          getProjectsByUser(currentUser),
          getTestsByUser(currentUser),
          getTestSessionsByUser(currentUser),
          getSurveysByUser(currentUser)
        ]);
        console.log("Fetched Test Sessions (Online): ", dbTestSessions);
        
        await localforage.setItem('projects', dbProjects);
        await localforage.setItem('usabilityTests', dbTests);
        await localforage.setItem('testSessions', dbTestSessions);
        await localforage.setItem('surveys', dbSurveys);

        setProjects(dbProjects);
        setUsabilityTests(dbTests);
        setTestSessions(dbTestSessions);
        setSurveys(dbSurveys);
        showToast("Dados sincronizados com o servidor.", "success");
      } else {
        // Carrega do localforage se offline
        if (!offlineToastShownRef.current) {
          showToast("Trabalhando offline: carregando dados locais.", "info");
          offlineToastShownRef.current = true;
        }
        const localProjects = await localforage.getItem<Project[]>('projects') || [];
        const localUsabilityTests = await localforage.getItem<UsabilityTest[]>('usabilityTests') || [];
        const localTestSessions = await localforage.getItem<TestSession[]>('testSessions') || [];
        const localSurveys = await localforage.getItem<Survey[]>('surveys') || [];

        setProjects(localProjects);
        setUsabilityTests(localUsabilityTests);
        setTestSessions(localTestSessions);
        setSurveys(localSurveys);
      }
    } catch (error) {
      console.error("Failed to sync or load data:", error);
      if (!offlineToastShownRef.current) {
        showToast(`Erro ao carregar dados: ${error instanceof Error ? error.message : String(error)}. Carregando dados locais.`, "error");
        offlineToastShownRef.current = true;
      }
      // Tenta carregar do localforage mesmo com erro online
      const localProjects = await localforage.getItem<Project[]>('projects') || [];
      const localUsabilityTests = await localforage.getItem<UsabilityTest[]>('usabilityTests') || [];
      const localTestSessions = await localforage.getItem<TestSession[]>('testSessions') || [];
      const localSurveys = await localforage.getItem<Survey[]>('surveys') || [];
      setProjects(localProjects);
      setUsabilityTests(localUsabilityTests);
      setTestSessions(localTestSessions);
      setSurveys(localSurveys);
      if (localProjects.length > 0) {
        // showToast("Dados locais carregados devido a erro na sincronização.", "warning"); // Este toast agora está coberto pelo acima
      }
    } finally {
      hideLoading(); // Desativar loading
    }
  };

  // Função para salvar um projeto atualizado localmente e definir hasUnsavedChanges
  const handleLocalProjectUpdate = async (updatedProject: Project) => {
    // Primeiro, atualize o estado local dos projetos
    setProjects(prevProjects => {
      const newProjects = prevProjects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      );
      // Em seguida, salve a lista atualizada no localforage
      localforage.setItem('projects', newProjects); 
      return newProjects;
    });
    setSelectedProject(updatedProject); // Manter o projeto selecionado atualizado
    setHasUnsavedChanges(true); // Indica que há alterações não salvas
  };

  // Função para sincronizar alterações locais com o Supabase
  const syncLocalChanges = async () => {
    if (!user || !isOnline) return; 

    showLoading("Sincronizando alterações locais..."); // Ativar loading
    try {
      const localProjects = await localforage.getItem<Project[]>('projects') || [];
      for (const localProject of localProjects) {
        const dbProject = await getProjectById(localProject.id); 
        const localData = {
          resolution: localProject.resolution,
          wireframes: localProject.wireframes,
          gridConfig: localProject.gridConfig,
        };
        const dbData = dbProject ? {
          resolution: dbProject.resolution,
          wireframes: dbProject.wireframes,
          gridConfig: dbProject.gridConfig,
        } : null;

        if (!dbProject || JSON.stringify(localData) !== JSON.stringify(dbData)) {
          await saveOrUpdateProject(localProject); 
        }
      }
      setHasUnsavedChanges(false); 
      unsavedChangesToastShownRef.current = false; // Resetar o ref após sincronização
      showToast("Alterações locais sincronizadas com sucesso!", "success");
      await fetchAllData(user); 
    } catch (error) {
      console.error("Erro ao sincronizar alterações locais:", error);
      showToast(`Erro ao sincronizar: ${error instanceof Error ? error.message : String(error)}`, "error");
    } finally {
      hideLoading(); // Desativar loading
    }
  };

  // Função para mudar a visualização e registrar no histórico
  const navigateTo = (view: View) => {
    setCurrentView(prevView => {
      setViewHistory(prevHistory => [...prevHistory, prevView]);
      return view;
    });
  };

  // --- UNIFIED DISPLAY LIST (for admins) ---
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
    const surveyItems: DisplayItem[] = surveys.map(s => ({
      id: s.id, type: 'survey', name: s.name, createdAt: s.createdAt,
      question_count: s.questions.length, tests: [], original: s,
    }));
    return [...wireframeItems, ...surveyItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects, surveys, usabilityTests, testSessions]);

  const selectedItemForDashboard = useMemo(() => {
    if (!selectedProjectIdForDashboard) return null;
    return displayList.find(item => item.id === selectedProjectIdForDashboard) || null;
  }, [selectedProjectIdForDashboard, displayList]);

  const projectsWithData = useMemo(() => {
    return projects.filter(p => {
      const projectTests = usabilityTests.filter(t => t.config?.projectId === p.id);
      if (projectTests.length === 0) return false;
      const testIds = projectTests.map(t => t.id);
      return testSessions.some(s => testIds.includes(s.testId));
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects, usabilityTests, testSessions]);

  const selectedProjectForDashboard = useMemo(() => {
    return projects.find(p => p.id === selectedProjectIdForDashboard);
  }, [selectedProjectIdForDashboard, projects]);

  const selectedProjectSessionsForDashboard = useMemo(() => {
    if (!selectedProjectIdForDashboard) return [];
    const selectedProjectTests = usabilityTests.filter(t => t.config?.projectId === selectedProjectIdForDashboard);
    const selectedProjectTestIds = selectedProjectTests.map(t => t.id);
    return testSessions.filter(s => selectedProjectTestIds.includes(s.testId));
  }, [selectedProjectIdForDashboard, usabilityTests, testSessions]);


  // --- EFFECTS ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const testIdFromUrl = params.get('testId');

    const surveyIdFromUrl = params.get('surveyId');

    const handleExternalTest = async (testId: string) => {
      showLoading("Iniciando teste..."); // Ativar loading
      await handleStartUserTest(testId);
      hideLoading(); // Desativar loading
    };

    const handleExternalSurvey = async (surveyId: string) => {
      showLoading("Iniciando pesquisa..."); // Ativar loading
      const survey = await getSurveyById(surveyId);
      if (survey) {
        setSelectedSurveyToTake(survey);
        navigateTo('user-survey');
      }
      hideLoading(); // Desativar loading
    };

    if (viewParam === 'user-test' && testIdFromUrl) {
      handleExternalTest(testIdFromUrl);
      return; // Stop further execution to avoid auth checks
    }

    if (viewParam === 'user-survey' && surveyIdFromUrl) {
      handleExternalSurvey(surveyIdFromUrl);
      return; // Stop further execution to avoid auth checks
    }

    if (viewParam === 'signup-tester') {
        setInitialView('signup-tester');
    }

    const handleUserSession = async (sessionUser: any) => {
        showLoading("Verificando sessão de usuário...");
        let role = 'user'; // Default role

        if (isOnline) {
            const { data: userProfileData } = await supabase
                .from('users_profile')
                .select('role')
                .eq('id', sessionUser.id)
                .single();
            role = userProfileData?.role || 'user';
        } else {
            // If offline, the sessionUser is from localforage and should have the role
            role = sessionUser.role || 'user';
        }

        const appUser: User = {
            id: sessionUser.id,
            email: sessionUser.email || '',
            name: sessionUser.user_metadata?.name || sessionUser.name || 'User', // Handle both session and local user objects
            plan: 'pro',
            projectsCreated: 0,
            reportsGenerated: 0,
            role: role,
        };
        setUser(appUser);
        userIdRef.current = appUser.id;

        // Persist user data for offline access
        if (isOnline) { // Only save user to localforage if we know they are valid
          await localforage.setItem('user', appUser);
        }
        await localforage.setItem('userId', appUser.id);

        await fetchAllData(appUser);

        if (appUser.role === 'admin') {
          setCurrentView('projects');
        } else if (appUser.role === 'user') {
              setIsTesterProfileIncomplete(false);
              setCurrentView('user-home');
        } else {
          setCurrentView('projects');
        }
        hideLoading();
    };

    const checkSession = async () => {
      showLoading("Verificando sessão...");
      try {
        // If offline, try to load from local storage first.
        if (!isOnline) {
          const localUser = await localforage.getItem<User>('user');
          if (localUser) {
            console.log("Offline: loaded user from localforage", localUser);
            await handleUserSession(localUser);
          } else {
            // No local user and offline, can't do anything.
            setUser(null);
            navigateTo('projects');
          }
          return; // End execution here if offline
        }

        // If online, proceed with Supabase auth check.
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Erro ao obter sessão:", error);
          await supabase.auth.signOut();
          setUser(null);
          navigateTo('projects');
          return;
        }

        if (session?.user) {
          // const { error: refreshError } = await supabase.auth.refreshSession();
          // if (refreshError) {
          //   console.error('Falha ao atualizar a sessão (online):', refreshError);
          //   // This could be a network blip or a real auth error.
          //   // Instead of signing out, let's try loading local user as a fallback.
          //   const localUser = await localforage.getItem<User>('user');
          //   if (localUser) {
          //     await handleUserSession(localUser);
          //   } else {
          //     await supabase.auth.signOut();
          //     setUser(null);
          //     navigateTo('projects');
          //   }
          //   return;
          // }
          await handleUserSession(session.user);
        } else {
          if (viewParam === 'signup-tester') {
            setCurrentView('signup-tester');
          }
        }
      } catch (e) {
        console.error("Uma exceção ocorreu ao verificar a sessão:", e);
        // Generic catch-all, sign out to be safe.
        await supabase.auth.signOut();
        setUser(null);
        navigateTo('projects');
      } finally {
        hideLoading();
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (testIdFromUrl) return;

      if (_event === 'SIGNED_IN') {
        if (session?.user && session.user.id !== userIdRef.current) {
          handleUserSession(session.user);
        }
      } else if (_event === 'SIGNED_OUT') {
        userIdRef.current = null;
        setUser(null);
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'signup-tester') {
            navigateTo('signup-tester'); // Usar navigateTo
        } else if (currentView !== 'user-test') { // Do not redirect if on a public test
            navigateTo('projects'); // Usar navigateTo
        }
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []); // Removido isOnline da dependência para evitar recargas indesejadas

  useEffect(() => {
    if (currentView === 'dashboard') {
        if (projectsWithData.length > 0) {
            if (!selectedProjectIdForDashboard || !projectsWithData.some(p => p.id === selectedProjectIdForDashboard)) {
                setSelectedProjectIdForDashboard(projectsWithData[0].id); // Default to most recent
            }
        }
    }
  }, [currentView, projectsWithData, selectedProjectIdForDashboard]);

  useEffect(() => {
    const wasOnline = prevOnlineStatusRef.current;

    // Check for transition from offline to online
    if (!wasOnline && isOnline && user && hasUnsavedChanges) {
      showToast("Você está online novamente. Sincronizando alterações...", "info");
      syncLocalChanges();
    } else if (user && isOnline && hasUnsavedChanges && !unsavedChangesToastShownRef.current) {
      // If already online and has unsaved changes, show the warning toast
      showToast("Você tem alterações locais não salvas. Clique em 'Sincronizar' para salvar.", "warning");
      unsavedChangesToastShownRef.current = true;
    } else if (!isOnline) {
      // When going offline, reset the toast ref so it can be shown again when back online
      unsavedChangesToastShownRef.current = false;
    }

    // Update the ref with the current status for the next render
    prevOnlineStatusRef.current = isOnline;
  }, [isOnline, hasUnsavedChanges, user, showToast, syncLocalChanges]);

  // ... other handlers ...
  const handleGoToProfile = () => {
    navigateTo('profile'); // Usar navigateTo
  };

  const handleConfigureTest = (project: any) => {
    setSelectedProject(project);
    setIsConfigureTestModalOpen(true);
  };

  // const handleManageTest = (project: any) => { // Removido: Nova função para gerenciar testes
  //   setSelectedProject(project);
  //   navigateTo('manage-test');
  // };

  const handleStartUserTest = async (testId: string, isDemo: boolean = false) => {
    if (!testId) return;

    if (isDemo) {
      const url = `${window.location.origin}/?view=user-test&testId=${testId}`;
      window.open(url, '_blank');
      return;
    }

    setIsDemoMode(isDemo);
    showLoading("Iniciando teste..."); // Ativar loading
    try {
      const test = await getTestById(testId);
      if (test && test.config?.projectId) {
        const project = await getProjectById(test.config.projectId);
        setActiveTest(test);
        setSelectedProject(project);
        navigateTo('user-test'); // Usar navigateTo
      } else {
        console.error("Teste ou ID do projeto não encontrado na configuração do teste.");
      }
    } catch (error) {
      console.error("Erro ao iniciar o teste:", error);
    } finally {
      hideLoading(); // Desativar loading
    }
  };

  const navigateBack = async () => {
    showLoading("Saindo..."); // Ativar loading ao sair

    if (user) {
      await fetchAllData(user);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('testId')) {
      setActiveTest(null);
      navigateTo('projects'); // Usar navigateTo
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
      hideLoading(); // Desativar loading antes de recarregar a página
      return;
    }

    // Remove a visualização atual do histórico e volta para a anterior
    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setCurrentView(previousView);
      setViewHistory(prevHistory => prevHistory.slice(0, -1)); // Remove a última do histórico
    } else {
      // Se não há histórico, volta para a visualização padrão (projects)
      setCurrentView('projects');
    }
    setSelectedProject(null); 
    setSelectedProjectIdForDashboard(null);
    setActiveTest(null);
    hideLoading(); // Desativar loading antes de navegar
  };

  const goBack = async () => {
    if (currentView === 'wireframe-editor' && hasUnsavedChanges) {
      setIsExitConfirmOpen(true);
      return;
    }
    navigateBack();
  };

  const handleSaveAndExit = async () => {
    setIsExitConfirmOpen(false);
    await syncLocalChanges();
    navigateBack();
  };


  // Função para finalizar um teste


  // Função para finalizar um teste
  const handleFinishTest = async (session: any) => {
    showLoading("Finalizando seu teste..."); // Ativar loading
    console.log("[Debug] App.tsx -> handleFinishTest: Recebida a sessão do teste.", session);

    try {
      // Salvar a sessão de teste
      console.log("[Debug] App.tsx -> handleFinishTest: Chamando saveTestSession...");
      await saveTestSession(session);
      console.log("[Debug] App.tsx -> handleFinishTest: saveTestSession completado com sucesso.");
      setTestSessions(prev => [...prev, session]);

      if (user) { // All user-specific logic should be inside this block
        const test = usabilityTests.find(t => t.id === session.testId);
        if (test) {
          const project = projects.find(p => p.id === test.config?.projectId);
          if (project) {
            showToast(`Novo teste respondido para o projeto: ${project.name}`, 'success');
          }
        }

        // 2. Atualizar o status do convite na tabela emails (integrado aqui)
        console.log("DEBUG handleFinishTest: Tentando buscar email para atualização.");
        const { data: emailRow, error: fetchError } = await supabase
          .from('emails')
          .select('messages')
          .eq('receiver_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Erro ao buscar email para atualização:", fetchError);
          showToast('Teste finalizado, mas houve erro ao atualizar convite.', 'error');
          // Continuar mesmo com erro no email, mas logar
        }
        console.log("DEBUG handleFinishTest: Email Row Retornado para atualização.", emailRow);

        if (emailRow) {
          let updatedMessages = (emailRow.messages as any[]).map(message => {
            if (message.testId === session.testId) { // Usa session.testId
              return { ...message, status: 'completed' };
            }
            return message;
          });

          console.log("DEBUG handleFinishTest: Tentando atualizar status do convite.", updatedMessages);
          const { error: updateError } = await supabase
            .from('emails')
            .update({ messages: updatedMessages, last_updated_at: new Date().toISOString() })
            .eq('receiver_id', user.id);

          if (updateError) {
            console.error("Erro ao atualizar status do convite:", updateError);
            showToast('Teste finalizado, mas houve erro ao atualizar convite.', 'error');
            // Continuar mesmo com erro no email, mas logar
          }
          console.log("DEBUG handleFinishTest: Status do convite atualizado com sucesso (se aplicável).");
        }

        // Lógica de redirecionamento pós-teste
        console.log("DEBUG handleFinishTest: Iniciando redirecionamento.", user.role);
        if (user.role === 'user') {
          setRefreshUserInboxKey(prev => prev + 1); // Força a recarga da caixa de entrada
          navigateTo('user-home'); // Redireciona para a caixa de entrada do testador
        } else if (user.role === 'admin') {
          navigateTo('projects'); // Redireciona para projetos do admin
        } else {
          // Fallback para usuários não logados ou outros roles (pode ser a página inicial pública)
          window.location.href = window.location.origin; 
        }
      } else {
        // Lógica para usuários não logados
        showToast('Teste finalizado com sucesso! Obrigado por sua participação.', 'success');
        // Redirect to landing page
        setTimeout(() => {
            window.location.href = window.location.origin;
        }, 2000); // Delay to allow user to see the toast
      }

    } catch (error) {
      console.error("[Debug] App.tsx -> handleFinishTest: Erro capturado!", error);
      showToast('Erro ao finalizar teste.', 'error');
      hideLoading(); // Hide loading on error
      if (user) {
        goBack(); // Volta para a tela anterior em caso de erro
      } else {
        window.location.href = window.location.origin;
      }
    }
  };

  const handleTestCreated = async (session: any) => { // Corrigido para aceitar 'session' em vez de 'testId'
    if (user) {
      showLoading("Processando criação do teste..."); // Ativar loading
      await fetchAllData(user);
      hideLoading(); // Desativar loading
    }
  };

  // --- RENDER LOGIC ---

  if (currentView === 'sending-test') { // Removido: O GlobalLoading cuidará disso
    return (
      <div className="flex-1 flex items-center justify-center bg-muted" style={{ minHeight: '100vh' }}>
        <div className="text-center max-w-md bg-opacity-20">
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center relative">
            <div className="absolute w-24 h-2 bg-muted-foreground rotate-45 animate-pulse"></div>
            <div className="absolute w-2 h-12 bg-primary rounded-full rotate-12 animate-bounce"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-2 border-primary animate-spin-slow"></div>
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-muted-foreground animate-ping"></div>
          </div>
          <h2>{currentView === 'sending-test' ? sendingMessage : 'Carregando...'}</h2>
        </div>
      </div>
    )
  }

  // --- RENDER LOGIC ---

  // Unauthenticated views
  if (!user) {
    if (currentView === 'user-test') {
      return (
          <main className="flex-1">
            {activeTest && (
              <UserTestInterface 
                test={activeTest} 
                project={selectedProject}
                onFinishTest={handleFinishTest}
                onCancel={goBack}
              />
            )}
          </main>
      );
    }
    if (currentView === 'signup-tester') {
      return <TesterSignupPage />;
    }
    return <LandingPage onLogin={() => {}} />;
  }

  // Authenticated views
  return (
      <ToastProvider>
        <AuthenticatedLayout user={user} onLogout={() => supabase.auth.signOut()} hasUnsavedChanges={hasUnsavedChanges} onSyncLocalChanges={syncLocalChanges}> {/* Passa hasUnsavedChanges */}
          {isTesterProfileIncomplete && user.role === 'tester' && currentView !== 'profile' && (
            <IncompleteProfileNotification onCompleteProfile={handleGoToProfile} />
          )}
          
          <NewProjectModal
            isOpen={isNewProjectModalOpen}
            onClose={() => setIsNewProjectModalOpen(false)}
            onSelectType={(type) => {
              setIsNewProjectModalOpen(false);
              if (type === 'wireframe') {
                setIsCreateWireframeDialogOpen(true);
              } else if (type === 'survey') {
                navigateTo('create-survey');
              }
            }}
          />
          <CreateWireframeDialog
            isOpen={isCreateWireframeDialogOpen}
            onClose={() => setIsCreateWireframeDialogOpen(false)}
            onCreateProject={async (name, resolution, description) => {
              const newProject: Project = {
                id: uuidv4(),
                name,
                resolution,
                description,
                wireframes: [],
                createdAt: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                components: [],
              };
              
              showLoading("Criando novo projeto...");
              try {
                // Salva primeiro no banco de dados
                await saveOrUpdateProject(newProject);
                
                // Atualiza o estado local e o localforage
                handleLocalProjectUpdate(newProject);
                
                // Limpa o estado de "alterações não salvas" para este novo projeto
                setHasUnsavedChanges(false);
                unsavedChangesToastShownRef.current = false;

                showToast("Projeto criado com sucesso!", "success");
                
                // Navega para o editor
                setIsCreateWireframeDialogOpen(false);
                setSelectedProject(newProject);
                navigateTo('wireframe-editor');
              } catch (error) {
                console.error("Erro ao criar novo projeto:", error);
                showToast(`Erro ao criar projeto: ${error instanceof Error ? error.message : String(error)}`, "error");
              } finally {
                hideLoading();
              }
            }}
          />

          <ConfigureTestModal
            isOpen={isConfigureTestModalOpen}
            onClose={() => setIsConfigureTestModalOpen(false)}
            selectedProject={selectedProject}
            onStartUserTest={handleStartUserTest}
          />

          <SendSurveyModal
            isOpen={isSendSurveyModalOpen}
            onClose={() => setIsSendSurveyModalOpen(false)}
            survey={selectedSurveyToSend}
          />

          <AlertDialog open={isExitConfirmOpen} onOpenChange={setIsExitConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sair do modo de edição?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você possui alterações não salvas. Para não perdê-las, salve antes de sair.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSaveAndExit}>Salvar e Sair</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>


        <div className="w-full flex flex-col">
          {currentView !== 'projects' && currentView !== 'user-home' && currentView !== 'wireframe-editor' && (
            <header className="border-b border-border bg-card flex-shrink-0">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <h1 className="text-xl font-medium">
                    {currentView === 'profile' && 'Meu Perfil'}
                    {currentView === 'configure-test' && 'Configurar Novo Teste'}
                    {currentView === 'create-test-group' && 'Criar Grupo de Teste'}
                    {currentView === 'user-test' && activeTest?.name}
                    {currentView === 'dashboard' && 'Dashboard'}
                  </h1>
                </div>
                {currentView === 'dashboard' && (
                  <div className="flex items-center gap-4">
                    {projectsWithData.length > 0 ? (
                        <Select onValueChange={(value) => setSelectedProjectIdForDashboard(value)} value={selectedProjectIdForDashboard || ''}>
                            <SelectTrigger className="w-auto md:w-[280px]">
                                <SelectValue placeholder="Selecione um projeto" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectsWithData.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <span className="text-sm text-muted-foreground">Nenhum projeto com dados de teste.</span>
                    )}
                  </div>
                )}
              </div>
            </header>
          )}

          <div className="flex-1 overflow-y-auto">
            {currentView === 'projects' && (
              <ProjectList
                items={displayList}
                user={user}
                onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                onEditProject={(project) => {
                  setSelectedProject(project);
                  navigateTo('wireframe-editor'); // Usar navigateTo
                }}
                onViewDashboard={(item) => {
                  setSelectedProjectIdForDashboard(item.id);
                  navigateTo('dashboard'); // Usar navigateTo
                }}
                onStartUserTest={(testId, testType, isDemo) => handleStartUserTest(testId, isDemo || false)}
                onDeleteProject={async (itemId, itemType) => {
                  try {
                    showLoading("Deletando projeto..."); // Ativar loading
                    if (itemType === 'wireframe') {
                      await deleteProjectById(itemId);
                    } else if (itemType === 'survey') {
                      await deleteSurveyById(itemId);
                    }
                    await fetchAllData(user); // Re-busca dados do DB e atualiza localforage
                    showToast('Projeto excluído com sucesso!', 'success');
                  } catch (error) {
                    console.error("Erro ao deletar projeto:", error);
                    showToast(`Erro ao deletar projeto: ${error instanceof Error ? error.message : String(error)}`, "error");
                  } finally {
                    hideLoading(); // Desativar loading
                  }
                }}
                onCreateTest={(project) => {
                  setSelectedProject(project);
                  navigateTo('create-usability-test'); // Usar navigateTo
                }}
                onConfigureTest={handleConfigureTest}
                onEditSurvey={(survey) => {
                  setSelectedSurvey(survey);
                  navigateTo('survey-editor');
                }}
                onSendSurvey={(survey) => {
                  setSelectedSurveyToSend(survey);
                  setIsSendSurveyModalOpen(true);
                }}
                // onManageTest={handleManageTest} // Removido
              />
            )}

            {currentView === 'dashboard' && (
              <Dashboard
                selectedProject={selectedProjectForDashboard}
                selectedProjectSessions={selectedProjectSessionsForDashboard}
              />
            )}

            {currentView === 'user-test' && activeTest && (
              <UserTestInterface 
                test={activeTest} 
                project={selectedProject}
                onFinishTest={handleFinishTest}
                onCancel={goBack}
                isDemoMode={isDemoMode}
              />
            )}

            {currentView === 'user-survey' && selectedSurveyToTake && (
              <UserSurveyInterface 
                survey={selectedSurveyToTake}
                onFinishSurvey={(answers) => {
                  console.log('Survey answers:', answers);
                  showToast('Pesquisa enviada com sucesso!', 'success');
                  navigateTo('projects');
                }}
              />
            )}

            {currentView === 'create-usability-test' && selectedProject && (
              <CreateUsabilityTest
                user={user}
                selectedProject={selectedProject}
                onSaveTest={async (testData) => {
                  showLoading("Salvando teste de usabilidade..."); // Ativar loading
                  await saveTestToDb(testData);
                  await fetchAllData(user);
                  navigateTo('projects'); // Usar navigateTo
                  hideLoading(); // Desativar loading
                }}
              />
            )}

            {currentView === 'wireframe-editor' && selectedProject && (
              <WireframeEditor
                project={selectedProject}
                onUpdateProject={handleLocalProjectUpdate} // Usar a nova função de atualização local
                onBack={goBack}
                user={user}
              />
            )}

            {currentView === 'user-home' && user.role === 'user' && (
              <UserHomePage onGoToProfile={handleGoToProfile} refreshKey={refreshUserInboxKey} />
            )}

            {currentView === 'profile' && (
              <ProfileForm />
            )}

            {currentView === 'create-survey' && (
              <CreateSurveyPage onBack={goBack} />
            )}

            {currentView === 'survey-editor' && selectedSurvey && (
              <CreateSurveyPage onBack={goBack} survey={selectedSurvey} />
            )}



            {/* Removido: O GlobalLoading cuidará disso */}
            {/* {currentView === 'sending-test' && sendingMessage && ( 
              <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800">
                <Loader2 className="h-16 w-16 animate-spin text-indigo-600 mb-4" />
                <p className="text-xl font-medium">{sendingMessage}</p>
              </div>
            )} */}
          </div>
        </div>
        </AuthenticatedLayout>
      </ToastProvider>
  );
}