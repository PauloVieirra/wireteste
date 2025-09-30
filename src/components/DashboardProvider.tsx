import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/supabaseClient';
import { useToast } from './ToastProvider';
import localforage from 'localforage';

// Define a generic type for dashboard data
interface DashboardData {
  [key: string]: any;
}

interface DashboardContextType {
  data: DashboardData[];
  loading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType>({
  data: [],
  loading: true,
  error: null,
});

export const useDashboard = () => useContext(DashboardContext);

interface DashboardProviderProps {
  itemId: string; // The ID of the test
  itemType: 'mapa_calor' | 'pesquisa' | 'eye_tracking' | 'face_tracking'; // The type of test
  children: React.ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ itemId, itemType, children }) => {
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  console.log(`[DashboardProvider] Initializing for itemId: ${itemId}, itemType: ${itemType}`);

  const fetchData = useCallback(async () => {
    console.log(`[DashboardProvider] fetchData triggered for itemId: ${itemId}`);
    if (!itemId) {
      console.log('[DashboardProvider] No itemId, aborting fetch.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    console.log('[DashboardProvider] User:', user);
    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      showToast("Você precisa estar logado para ver os dados do dashboard.", "error");
      return;
    }

    const cacheKey = `dashboard-${itemType}-${itemId}-${user.id}`;
    console.log(`[DashboardProvider] Cache key: ${cacheKey}`);

    try {
      console.log('[DashboardProvider] Attempting to fetch from cache...');
      const cachedData = await localforage.getItem<DashboardData[]>(cacheKey);
      if (cachedData && cachedData.length > 0) {
        console.log('[DashboardProvider] Cache hit! Data found in localforage.', cachedData);
        setData(cachedData);
        setLoading(false);
        return;
      }
      console.log('[DashboardProvider] Cache miss or empty cache. Fetching from Supabase...');
    } catch (cacheError) {
      console.error("[DashboardProvider] Error reading from cache:", cacheError);
    }

    let tableName: string;
    let filterColumn: string;
    let query;

    // Todos os tipos de testes (mapa_calor, pesquisa, eye_tracking, face_tracking) buscam de test_sessions
    tableName = 'test_sessions';
    filterColumn = 'test_id';
    console.log(`[DashboardProvider] Antes de construir a query. User ID: ${user.id}, Item ID: ${itemId}, Item Type: ${itemType}`);
    console.log(`[DashboardProvider] Building query for ${tableName} with test_id=${itemId}, itemType=${itemType} and admin_id=${user.id}`);
    query = supabase
      .from(tableName)
      .select('*, tests!inner(admin_id, type)') // Reintroduzido o select com inner join
      .eq(filterColumn, itemId)
      .eq('tests.admin_id', user.id); // Reintroduzido o filtro por admin_id

    try {
      console.log('[DashboardProvider] Executing Supabase query...');
      const { data: fetchedData, error: fetchError } = await query;
      console.log('[DashboardProvider] Supabase response received. Data:', fetchedData, 'Error:', fetchError);

      if (fetchError) {
        console.error('[DashboardProvider] Fetch Error details:', fetchError);
        throw fetchError;
      }

      if (fetchedData && fetchedData.length > 0) {
        console.log('[DashboardProvider] Storing fetched data in cache.');
        await localforage.setItem(cacheKey, fetchedData);
      } else {
        console.log('[DashboardProvider] Fetched data is empty or null, removing from cache.');
        await localforage.removeItem(cacheKey);
      }

      setData(fetchedData || []);

      if (!fetchedData || fetchedData.length === 0) {
        showToast('Nenhum dado encontrado para o dashboard.', 'info');
      }
    } catch (err: any) {
      console.error(`[DashboardProvider] Caught error fetching data for ${itemType}:`, err);
      setError(`Erro ao carregar dados: ${err.message}`);
      showToast(`Erro ao carregar dados: ${err.message}`, 'error');
    } finally {
      console.log('[DashboardProvider] Fetch process finished.');
      setLoading(false);
    }
  }, [itemId, itemType, showToast]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`dashboard-realtime-${itemId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'test_sessions'
        },
        async (payload) => {
          console.log('[DashboardProvider] Real-time change received!', payload);
          showToast("Novos dados disponíveis, atualizando...", "info");
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const cacheKey = `dashboard-${itemType}-${itemId}-${user.id}`;
            await localforage.removeItem(cacheKey);
          }
          // fetchData(); // REMOVER ESTA LINHA para evitar loop infinito em caso de dados vazios
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, itemId, itemType, showToast]);

  return (
    <DashboardContext.Provider value={{ data, loading, error }}>
      {children}
    </DashboardContext.Provider>
  );
};