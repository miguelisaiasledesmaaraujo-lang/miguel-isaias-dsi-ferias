import React, { useState, useEffect } from 'react';
import { UserProfile, VacationRequest, UserRole } from './types/vacation.ts';
import { INITIAL_USERS } from './data/mockData.ts';
import {
  fetchAllVacationRequests,
  createVacationRequest,
  updateVacationRequest,
  isSupabaseActive,
} from './lib/supabase.ts';
import { Header } from './components/Header.tsx';
import { EmployeeDashboard } from './components/EmployeeDashboard.tsx';
import { SupervisorDashboard } from './components/SupervisorDashboard.tsx';
import { RHDashboard } from './components/RHDashboard.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Users,
  User,
  Info,
  Database,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]); // João Silva (Funcionário)
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Carrega as solicitações do Supabase ou banco persistente local
  const loadRequests = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchAllVacationRequests();
      setRequests(res.data);
    } catch (err) {
      console.error('Falha ao carregar solicitações:', err);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Criação de nova solicitação de 15 dias
  const handleCreateRequest = async (newReqData: Omit<VacationRequest, 'id' | 'created_at'>) => {
    const newRequest: VacationRequest = {
      ...newReqData,
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    const result = await createVacationRequest(newRequest);
    if (result.success) {
      setRequests((prev) => [newRequest, ...prev]);
      showToast('Solicitação de 15 dias criada com sucesso! Aguardando avaliação do Supervisor.', 'success');
    } else {
      showToast(result.error || 'Erro ao criar solicitação', 'error');
    }
  };

  // Avaliação por Supervisor ou RH
  const handleDecision = async (
    requestId: string,
    decision: 'approved' | 'rejected',
    notes: string
  ) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    let updated: VacationRequest = { ...target };
    const nowIso = new Date().toISOString();

    if (currentUser.role === 'supervisor') {
      updated = {
        ...updated,
        supervisor_id: currentUser.id,
        supervisor_name: currentUser.name,
        supervisor_decision: decision,
        supervisor_decision_at: nowIso,
        supervisor_notes: notes,
        // Se aprovado pelo supervisor, vai para o RH; se rejeitado, é finalizado como recusado
        status: decision === 'approved' ? 'pending_rh' : 'rejected',
      };
      showToast(
        decision === 'approved'
          ? 'Solicitação aprovada pelo Supervisor e enviada ao RH!'
          : 'Solicitação recusada pelo Supervisor.',
        decision === 'approved' ? 'success' : 'info'
      );
    } else if (currentUser.role === 'rh') {
      updated = {
        ...updated,
        rh_id: currentUser.id,
        rh_name: currentUser.name,
        rh_decision: decision,
        rh_decision_at: nowIso,
        rh_notes: notes,
        // Parecer final do RH: se aprovado, ambos aceitaram -> 'approved'; se rejeitado -> 'rejected'
        status: decision === 'approved' ? 'approved' : 'rejected',
      };
      showToast(
        decision === 'approved'
          ? 'Férias homologadas e APROVADAS com sucesso pelo RH!'
          : 'Solicitação recusada pelo RH.',
        decision === 'approved' ? 'success' : 'info'
      );
    }

    await updateVacationRequest(updated);
    setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
  };

  // Contadores para o switcher rápido
  const pendingSupervisorCount = requests.filter((r) => r.status === 'pending_supervisor').length;
  const pendingRHCount = requests.filter((r) => r.status === 'pending_rh').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toastMessage.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Principal */}
      <Header
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onRefresh={() => {
          setIsRefreshing(true);
          loadRequests(true);
        }}
        isRefreshing={isRefreshing}
      />

      {/* Barra de Troca Rápida de Papéis (3 Acessos: Funcionário, RH e Supervisor) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Acessos do Sistema:
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Botão Funcionário */}
              <button
                onClick={() => setCurrentUser(INITIAL_USERS[0])}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  currentUser.role === 'employee'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                1. Funcionário ({INITIAL_USERS[0].name.split(' ')[0]})
              </button>

              <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />

              {/* Botão Supervisor */}
              <button
                onClick={() => setCurrentUser(INITIAL_USERS[2])}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  currentUser.role === 'supervisor'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                2. Supervisor
                {pendingSupervisorCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded-full text-[10px] font-black">
                    {pendingSupervisorCount}
                  </span>
                )}
              </button>

              <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />

              {/* Botão RH */}
              <button
                onClick={() => setCurrentUser(INITIAL_USERS[3])}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  currentUser.role === 'rh'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                3. RH (Aval Final)
                {pendingRHCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-200 text-indigo-950 rounded-full text-[10px] font-black">
                    {pendingRHCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Carregando sistema de férias...</p>
          </div>
        ) : (
          <>
            {currentUser.role === 'employee' && (
              <EmployeeDashboard
                currentUser={currentUser}
                requests={requests}
                onCreateRequest={handleCreateRequest}
              />
            )}

            {currentUser.role === 'supervisor' && (
              <SupervisorDashboard
                currentUser={currentUser}
                requests={requests}
                onDecision={handleDecision}
              />
            )}

            {currentUser.role === 'rh' && (
              <RHDashboard
                currentUser={currentUser}
                requests={requests}
                onDecision={handleDecision}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">FériasFlow</span>
            <span>•</span>
            <span>Sistema Corporativo de Férias (2x15d) com Dupla Aprovação (Supervisor & RH)</span>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            Configurar Supabase / Ver Script SQL
          </button>
        </div>
      </footer>

      {/* Modal do Supabase */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={() => loadRequests(false)}
      />
    </div>
  );
}
