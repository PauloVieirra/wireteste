import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add a type for the user object, which is used in several functions.
interface User {
  id: string;
  // Add other user properties as needed.
}

/**
 * Fetches projects for a given user.
 * @param user The user object.
 * @returns A list of projects.
 */
export const getProjectsByUser = async (user: User) => {
  if (!user) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  // Transform the data to match the frontend's expected structure.
  return data.map(project => ({
    ...project.project_data,
    id: project.id,
    name: project.name,
    createdAt: project.created_at,
    updated_at: project.updated_at,
  }));
};

/**
 * Fetches tests for a given user.
 * @param user The user object.
 * @returns A list of tests.
 */
export const getTestsByUser = async (user: User) => {
  if (!user) return [];

  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tests:', error);
    return [];
  }
  return data;
};

/**
 * Fetches test sessions for a given user.
 * @param user The user object.
 * @returns A list of test sessions.
 */
export const getTestSessionsByUser = async (user: User) => {
  if (!user) return [];

  // First, get the tests created by the user.
  const { data: tests, error: testsError } = await supabase
    .from('tests')
    .select('id')
    .eq('admin_id', user.id);

  if (testsError) {
    console.error('Error fetching tests for sessions:', testsError);
    return [];
  }

  const testIds = tests.map(test => test.id);

  if (testIds.length === 0) {
    return [];
  }

  // Then, fetch the sessions for those tests.
  const { data: sessions, error: sessionsError } = await supabase
    .from('test_sessions')
    .select('*')
    .in('test_id', testIds)
    .order('start_time', { ascending: false });

  if (sessionsError) {
    console.error('Error fetching test sessions:', sessionsError);
    return [];
  }
  return sessions.map(s => ({
    id: s.id,
    testId: s.test_id,
    userName: s.user_name,
    userEmail: s.user_email,
    clicks: s.clicks,
    answers: s.answers,
    startTime: s.start_time,
    endTime: s.end_time,
    completed: s.completed,
    duration: s.duration,
    clicksPerWireframe: s.clicks_per_wireframe,
    timePerWireframe: s.time_per_wireframe,
    correctClicks: s.correct_clicks,
    incorrectClicks: s.incorrect_clicks,
    idleTime: s.idle_time,
    percent: s.percent,
  }));
};

export const getSurveysByUser = async (user: User) => {
  if (!user) return [];

  const { data, error } = await supabase
    .from('pesquisa')
    .select('id, nome, tipo, perguntas, criado_em, atualizado_em')
    .eq('user_id', user.id)
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Error fetching surveys:', error);
    return [];
  }

  return data.map(survey => ({
    id: survey.id,
    name: survey.nome,
    type: survey.tipo,
    questions: survey.perguntas,
    createdAt: survey.criado_em,
    updated_at: survey.atualizado_em,
  }));
};

export const saveTest = async (testData: any) => {
    const { data, error } = await supabase.from('tests').insert([testData]);
    if (error) {
        console.error('Error saving test:', error);
        throw error;
    }
    return data;
};

export const saveSurvey = async (surveyData: any) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated. Cannot save survey.');
    }

    const dataToUpsert = {
        id: surveyData.id,
        user_id: user.id,
        nome: surveyData.name,
        tipo: surveyData.type,
        perguntas: surveyData.questions,
    };

    const { data, error } = await supabase
        .from('pesquisa')
        .upsert(dataToUpsert, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error saving survey:', error);
        throw error;
    }

    return data;
};

export const getSurveyById = async (surveyId: string) => {
    const { data, error } = await supabase
        .from('pesquisa')
        .select('*')
        .eq('id', surveyId)
        .single();

    if (error) {
        console.error('Error fetching survey:', error);
        throw error;
    }

    return {
        id: data.id,
        name: data.nome,
        type: data.tipo,
        questions: data.perguntas,
        createdAt: data.criado_em,
        updated_at: data.atualizado_em,
    };
};

export const deleteProjectById = async (projectId: string) => {
    const { data, error } = await supabase.from('projects').delete().match({ id: projectId });
    if (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
    return data;
};

export const deleteTestById = async (testId: string) => {
    const { data, error } = await supabase.from('tests').delete().match({ id: testId });
    if (error) {
        console.error('Error deleting test:', error);
        throw error;
    }
    return data;
};

export const deleteSurveyById = async (surveyId: string) => {
    const { data, error } = await supabase.from('pesquisa').delete().match({ id: surveyId });
    if (error) {
        console.error('Error deleting survey:', error);
        throw error;
    }
    return data;
};

export const saveTestSession = async (sessionData: any) => {
    console.log("[Debug] supabaseClient.ts -> saveTestSession: Iniciando salvamento.", { sessionData });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        console.error("[Debug] supabaseClient.ts -> saveTestSession: Erro ao buscar usuário.", userError);
    }
    console.log("[Debug] supabaseClient.ts -> saveTestSession: Usuário obtido:", user);

    const testId = sessionData.testId;
    if (!testId) {
        console.error("[Debug] supabaseClient.ts -> saveTestSession: ID do teste não encontrado na sessionData.");
        throw new Error('O ID do teste é necessário para salvar uma sessão.');
    }

    const dataToInsert = {
        id: sessionData.id,
        test_id: sessionData.testId,
        user_id: user ? user.id : null, // Explicitly set to null if no user
        user_name: sessionData.userName,
        user_email: sessionData.userEmail,
        start_time: sessionData.startTime,
        end_time: sessionData.endTime,
        completed: sessionData.completed,
        clicks: sessionData.clicks || null,
        duration: sessionData.duration,
        clicks_per_wireframe: sessionData.clicksPerWireframe,
        time_per_wireframe: sessionData.timePerWireframe,
        correct_clicks: sessionData.correctClicks,
        incorrect_clicks: sessionData.incorrectClicks,
        idle_time: sessionData.idleTime,
        answers: sessionData.answers,
        percent: sessionData.percent,
    };

    console.log("[Debug] supabaseClient.ts -> saveTestSession: Dados a serem inseridos:", dataToInsert);

    const { data, error } = await supabase.from('test_sessions').insert([dataToInsert]);

    if (error) {
        console.error('[Debug] supabaseClient.ts -> saveTestSession: Erro do Supabase ao inserir!', error);
        throw error;
    }

    console.log("[Debug] supabaseClient.ts -> saveTestSession: Inserção no Supabase bem-sucedida. Resposta:", data);
    return data;
};

/**
 * Busca um projeto pelo seu ID.
 * @param projectId O ID do projeto a ser buscado.
 * @returns O projeto encontrado ou null.
 */
export const getProjectById = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: a consulta não retornou linhas
    console.error('Erro ao buscar o projeto:', error);
    throw error;
  }

  if (!data) return null;

  // Transforma o project_data de volta para a estrutura do frontend
  return {
    ...data.project_data,
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updated_at: data.updated_at
  };
};

export const getTestById = async (testId: string) => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (error) {
    console.error('Error fetching test:', error);
    throw error;
  }

  return data;
};

export const getTestsByProjectId = async (projectId: string) => {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('config->>projectId', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tests by project id:', error);
    return [];
  }

  return data;
};

// Definição de tipo para o objeto do projeto, pode ser movido para um arquivo de tipos compartilhado
interface Project {
  id: string;
  name: string;
  description?: string;
  resolution: 'mobile' | 'tablet' | 'desktop';
  wireframes: any[]; // Simplificado para any[] para evitar importações complexas aqui
  gridConfig?: any;
  components?: any[];
}

/**
 * Salva ou atualiza um projeto no banco de dados.
 * @param project O objeto completo do projeto a ser salvo.
 * @returns O resultado da operação do Supabase.
 */
export const saveOrUpdateProject = async (project: Project) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado. Não é possível salvar o projeto.');
  }

  if (!project.id) {
    throw new Error('O projeto deve ter um ID para ser salvo.');
  }

  const projectDataToSave = {
    id: project.id,
    user_id: user.id,
    name: project.name,
    description: project.description,
    project_data: {
      resolution: project.resolution,
      wireframes: project.wireframes,
      gridConfig: project.gridConfig,
      components: project.components,
    },
  };

  const { data, error } = await supabase
    .from('projects')
    .upsert(projectDataToSave, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar o projeto:', error);
    throw error;
  }

  // Return the fully transformed project object, consistent with getProjectsByUser
  return {
    ...data.project_data,
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updated_at: data.updated_at
  };
};