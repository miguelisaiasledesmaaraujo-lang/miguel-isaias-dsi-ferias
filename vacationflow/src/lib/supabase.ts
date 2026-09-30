import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VacationRequest } from '../types/vacation.ts';
import { INITIAL_REQUESTS } from '../data/mockData.ts';

const STORAGE_KEY_REQUESTS = 'ferias_app_requests_v1';
const STORAGE_KEY_CONFIG = 'ferias_app_supabase_config_v1';

// Default Supabase configuration
const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || '';
const DEFAULT_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSavedConfig(): { url: string; anonKey: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || DEFAULT_URL,
        anonKey: parsed.anonKey || DEFAULT_ANON_KEY,
      };
    }
  } catch (err) {
    console.error('Erro ao ler configuração do Supabase:', err);
  }
  return {
    url: DEFAULT_URL,
    anonKey: DEFAULT_ANON_KEY,
  };
}

export function saveConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  initSupabaseClient(url.trim(), anonKey.trim());
}

export function initSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const cfg = {
    url: url || getSavedConfig().url,
    anonKey: anonKey || getSavedConfig().anonKey,
  };

  if (cfg.url && cfg.anonKey && cfg.url.startsWith('http')) {
    try {
      supabaseClient = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseClient;
    } catch (e) {
      console.warn('Falha ao inicializar cliente Supabase:', e);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
  return supabaseClient;
}

// Inicializa no carregamento
initSupabaseClient();

export function isSupabaseActive(): boolean {
  return supabaseClient !== null;
}

// ----------------- LOCAL STORAGE HELPERS -----------------

function getLocalRequests(): VacationRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler solicitações locais:', err);
  }
  // Se não existir, inicializa com INITIAL_REQUESTS
  localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(INITIAL_REQUESTS));
  return INITIAL_REQUESTS;
}

function saveLocalRequests(requests: VacationRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  } catch (err) {
    console.error('Erro ao salvar localmente:', err);
  }
}

// ----------------- CRUD API COM SUPABASE + LOCAL CACHE -----------------

export async function fetchAllVacationRequests(): Promise<{ data: VacationRequest[]; fromSupabase: boolean; error?: string }> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('vacation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Mapeia caso o schema no Supabase tenha tipos compatíveis
        const formatted: VacationRequest[] = data.map((item: any) => ({
          ...item,
          total_days: Number(item.total_days) || 15,
          year_reference: Number(item.year_reference) || 2026,
          period_number: Number(item.period_number) === 2 ? 2 : 1,
        }));
        // Atualiza cache local
        saveLocalRequests(formatted);
        return { data: formatted, fromSupabase: true };
      }
      if (error) {
        console.warn('Supabase retornou erro na busca, usando base local:', error.message);
        return { data: getLocalRequests(), fromSupabase: false, error: error.message };
      }
    } catch (e: any) {
      console.warn('Exceção ao buscar no Supabase, usando base local:', e?.message);
    }
  }
  return { data: getLocalRequests(), fromSupabase: false };
}

export async function createVacationRequest(req: VacationRequest): Promise<{ success: boolean; data: VacationRequest; error?: string }> {
  // Salva no local
  const current = getLocalRequests();
  const updated = [req, ...current];
  saveLocalRequests(updated);

  // Se Supabase estiver conectado, persiste na nuvem
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('vacation_requests')
        .insert([req])
        .select()
        .single();

      if (error) {
        console.warn('Erro ao inserir no Supabase (salvo localmente):', error.message);
        return { success: true, data: req, error: `Salvo localmente. Erro no Supabase: ${error.message}` };
      }
      return { success: true, data: data || req };
    } catch (e: any) {
      console.warn('Falha de rede ao persistir no Supabase:', e);
      return { success: true, data: req, error: 'Salvo localmente (offline/erro de conexão).' };
    }
  }

  return { success: true, data: req };
}

export async function updateVacationRequest(req: VacationRequest): Promise<{ success: boolean; data: VacationRequest; error?: string }> {
  // Atualiza no local
  const current = getLocalRequests();
  const idx = current.findIndex((r) => r.id === req.id);
  if (idx !== -1) {
    current[idx] = req;
    saveLocalRequests([...current]);
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('vacation_requests')
        .update(req)
        .eq('id', req.id)
        .select()
        .single();

      if (error) {
        return { success: true, data: req, error: `Atualizado localmente. Erro no Supabase: ${error.message}` };
      }
      return { success: true, data: data || req };
    } catch (e: any) {
      return { success: true, data: req, error: 'Atualizado localmente.' };
    }
  }

  return { success: true, data: req };
}

export async function deleteVacationRequest(id: string): Promise<boolean> {
  const current = getLocalRequests().filter((r) => r.id !== id);
  saveLocalRequests(current);

  if (supabaseClient) {
    try {
      await supabaseClient.from('vacation_requests').delete().eq('id', id);
    } catch (e) {
      console.warn('Erro ao deletar no Supabase:', e);
    }
  }
  return true;
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; tableExists?: boolean }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Chave Anon são obrigatórios.' };
  }
  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    const { data, error } = await testClient.from('vacation_requests').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation "public.vacation_requests" does not exist')) {
        return {
          success: true,
          tableExists: false,
          message: 'Conectado ao Supabase! A tabela "vacation_requests" ainda não existe. Execute o SQL fornecido no painel do Supabase.',
        };
      }
      return { success: false, message: `Erro ao testar: ${error.message}` };
    }

    return {
      success: true,
      tableExists: true,
      message: 'Conexão estabelecida com sucesso! Tabela "vacation_requests" encontrada e pronta para uso.',
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Falha ao conectar com o Supabase.' };
  }
}

/**
 * Retorna o script SQL pronto para criar a tabela e as políticas de segurança e armazenamento no Supabase SQL Editor
 */
export function getSupabaseSQLScript(): string {
  return `-- ==============================================================================
-- 1. TABELA DE SOLICITAÇÕES DE FÉRIAS (VACATION_REQUESTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  employee_department TEXT NOT NULL,
  year_reference INTEGER NOT NULL DEFAULT 2026,
  period_number INTEGER NOT NULL CHECK (period_number IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 15,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending_supervisor', 'pending_rh', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Parecer do Supervisor (1ª Etapa)
  supervisor_id TEXT,
  supervisor_name TEXT,
  supervisor_decision TEXT CHECK (supervisor_decision IN ('approved', 'rejected') OR supervisor_decision IS NULL),
  supervisor_decision_at TIMESTAMPTZ,
  supervisor_notes TEXT,
  
  -- Parecer do RH (2ª Etapa - Decisiva)
  rh_id TEXT,
  rh_name TEXT,
  rh_decision TEXT CHECK (rh_decision IN ('approved', 'rejected') OR rh_decision IS NULL),
  rh_decision_at TIMESTAMPTZ,
  rh_notes TEXT
);

-- Índices para buscas rápidas por colaborador, ano e status
CREATE INDEX IF NOT EXISTS idx_vacation_requests_employee_year 
  ON public.vacation_requests (employee_id, year_reference);

CREATE INDEX IF NOT EXISTS idx_vacation_requests_status 
  ON public.vacation_requests (status);

-- ==============================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) NA TABELA
-- ==============================================================================
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes se houver
DROP POLICY IF EXISTS "Permitir leitura de solicitacoes" ON public.vacation_requests;
DROP POLICY IF EXISTS "Permitir criacao de solicitacoes" ON public.vacation_requests;
DROP POLICY IF EXISTS "Permitir atualizacao de pareceres" ON public.vacation_requests;
DROP POLICY IF EXISTS "Permitir exclusao de solicitacoes" ON public.vacation_requests;

-- Políticas de segurança para a tabela
CREATE POLICY "Permitir leitura de solicitacoes" 
  ON public.vacation_requests 
  FOR SELECT 
  TO public, authenticated, anon 
  USING (true);

CREATE POLICY "Permitir criacao de solicitacoes" 
  ON public.vacation_requests 
  FOR INSERT 
  TO public, authenticated, anon 
  WITH CHECK (true);

CREATE POLICY "Permitir atualizacao de pareceres" 
  ON public.vacation_requests 
  FOR UPDATE 
  TO public, authenticated, anon 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusao de solicitacoes" 
  ON public.vacation_requests 
  FOR DELETE 
  TO public, authenticated, anon 
  USING (true);

-- ==============================================================================
-- 3. BUCKET DE ARMAZENAMENTO (SUPABASE STORAGE)
--    Para envio de avisos de férias, recibos, atestados ou comprovantes
-- ==============================================================================
-- Criar bucket de armazenamento 'ferias_documentos' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ferias_documentos',
  'ferias_documentos',
  true,
  10485760, -- limite de 10MB por arquivo
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de acesso ao Bucket de Armazenamento
-- (Nota: RLS já vem habilitado por padrão na tabela storage.objects do Supabase)
DROP POLICY IF EXISTS "Permitir download publico de documentos de ferias" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de documentos de ferias" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualizacao de documentos de ferias" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusao de documentos de ferias" ON storage.objects;

-- Leitura de arquivos do bucket ferias_documentos
CREATE POLICY "Permitir download publico de documentos de ferias"
  ON storage.objects FOR SELECT
  TO public, authenticated, anon
  USING (bucket_id = 'ferias_documentos');

-- Upload de arquivos no bucket ferias_documentos
CREATE POLICY "Permitir upload de documentos de ferias"
  ON storage.objects FOR INSERT
  TO public, authenticated, anon
  WITH CHECK (bucket_id = 'ferias_documentos');

-- Atualização de arquivos no bucket ferias_documentos
CREATE POLICY "Permitir atualizacao de documentos de ferias"
  ON storage.objects FOR UPDATE
  TO public, authenticated, anon
  USING (bucket_id = 'ferias_documentos');

-- Exclusão de arquivos no bucket ferias_documentos
CREATE POLICY "Permitir exclusao de documentos de ferias"
  ON storage.objects FOR DELETE
  TO public, authenticated, anon
  USING (bucket_id = 'ferias_documentos');
`;
}
