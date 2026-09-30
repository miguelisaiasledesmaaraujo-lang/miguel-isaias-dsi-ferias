import React, { useState } from 'react';
import { UserProfile, VacationRequest } from '../types/vacation.ts';
import {
  Calendar,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { formatDateBR, formatDateTimeBR } from '../lib/dateUtils.ts';
import { VacationCalendar } from './VacationCalendar.tsx';
import { RequestModal } from './RequestModal.tsx';

interface EmployeeDashboardProps {
  currentUser: UserProfile;
  requests: VacationRequest[];
  onCreateRequest: (request: Omit<VacationRequest, 'id' | 'created_at'>) => Promise<void>;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  requests,
  onCreateRequest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentYear = 2026;

  // Filtra apenas as solicitações do funcionário logado no ano atual
  const myRequests = requests.filter(
    (r) => r.employee_id === currentUser.id && r.year_reference === currentYear
  );

  const approvedRequests = myRequests.filter((r) => r.status === 'approved');
  const pendingRequests = myRequests.filter(
    (r) => r.status === 'pending_supervisor' || r.status === 'pending_rh'
  );
  const rejectedRequests = myRequests.filter((r) => r.status === 'rejected');

  const approvedCount = approvedRequests.length;
  // Regra expressa do usuário:
  // "o funcinario pode ter acesso se tiver 0 ou 1 solicitações aceitas, mas 2 ou mais solicitações não poderá ser aceita"
  const canRequestNewPeriod = approvedCount < 2;

  // Busca se já existe período 1 ou 2 aprovado
  const period1 = approvedRequests.find((r) => r.period_number === 1) || approvedRequests[0];
  const period2 = approvedRequests.find((r) => r.period_number === 2 && r.id !== period1?.id) || (approvedRequests.length > 1 ? approvedRequests[1] : null);

  const renderStatusBadge = (status: VacationRequest['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Aprovada (Ambos aceitaram)
          </span>
        );
      case 'pending_supervisor':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Aguardando Supervisor
          </span>
        );
      case 'pending_rh':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" /> Aprovado por Supervisor; Aguardando RH
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Recusada
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Eligibility Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/15">
                Portal do Colaborador • {currentYear}
              </span>
              <span className="text-xs text-indigo-300">Regra: 2 Períodos de 15 dias</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              Gerencie suas férias com dupla aprovação necessária (Supervisor Direto + Recursos Humanos).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!canRequestNewPeriod}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold shadow-lg transition ${
                canRequestNewPeriod
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-98 cursor-pointer'
                  : 'bg-slate-700/80 text-slate-400 cursor-not-allowed border border-slate-600'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              {canRequestNewPeriod ? 'Solicitar Férias (15 Dias)' : 'Limite Anual Atingido'}
            </button>
          </div>
        </div>

        {/* Status da Regra de Negócio */}
        <div className="mt-6 pt-6 border-t border-white/10 grid sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-xs font-semibold text-indigo-200">1º Período (15 Dias)</div>
            <div className="text-lg font-bold mt-1 flex items-center justify-between">
              <span>{period1 ? formatDateBR(period1.start_date) : 'Disponível'}</span>
              {period1 ? (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Aprovado
                </span>
              ) : (
                <span className="text-xs text-indigo-300">Pode solicitar</span>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-xs font-semibold text-indigo-200">2º Período (15 Dias)</div>
            <div className="text-lg font-bold mt-1 flex items-center justify-between">
              <span>{period2 ? formatDateBR(period2.start_date) : 'Disponível'}</span>
              {period2 ? (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Aprovado
                </span>
              ) : (
                <span className="text-xs text-indigo-300">Pode solicitar</span>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-xs font-semibold text-indigo-200">Saldo de Períodos Aceitos</div>
            <div className="text-lg font-bold mt-1 flex items-center justify-between">
              <span>{approvedCount} de 2 Aceitos</span>
              <span className="text-xs text-emerald-300 font-mono">
                {approvedCount * 15} / 30 dias
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Acesso / Regra */}
      {!canRequestNewPeriod ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-rose-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Limite de Férias Atingido para {currentYear}</p>
            <p className="text-xs text-rose-700 mt-0.5">
              Você já possui <strong>2 solicitações de 15 dias aceitas</strong> pelo Supervisor e RH. De acordo com a regra da empresa, cada funcionário tem direito a 2 períodos de 15 dias por ano. Novas solicitações para este ano não poderão ser aceitas.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5 text-emerald-950 shadow-2xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">
              Acesso Liberado para Solicitação ({approvedCount === 0 ? '0 solicitações aceitas' : '1 solicitação aceita'})
            </p>
            <p className="text-xs text-emerald-800 mt-0.5">
              Você possui direito a agendar {2 - approvedCount} período(s) de 15 dias. Clique no botão acima para escolher sua data de início.
            </p>
          </div>
        </div>
      )}

      {/* Grade Principal: Minhas Solicitações e Calendário */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Minhas Solicitações (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              Minhas Solicitações no Ano ({myRequests.length})
            </h2>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Nenhuma solicitação encontrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Você ainda não solicitou nenhum período de férias para este ano. Agende seu primeiro período de 15 dias!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                <PlusCircle className="w-4 h-4" /> Solicitar 1º Período (15 Dias)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-300 transition space-y-4"
                >
                  {/* Topo do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-extrabold">
                        P{req.period_number}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {req.period_number}º Período de Férias ({req.total_days} Dias)
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Solicitado em {formatDateTimeBR(req.created_at)}
                        </span>
                      </div>
                    </div>
                    <div>{renderStatusBadge(req.status)}</div>
                  </div>

                  {/* Detalhes de Datas */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Data de Início</span>
                      <span className="font-bold text-slate-800 text-sm">{formatDateBR(req.start_date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Data de Término</span>
                      <span className="font-bold text-slate-800 text-sm">{formatDateBR(req.end_date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Duração Total</span>
                      <span className="font-bold text-emerald-700 text-sm">{req.total_days} dias corridos</span>
                    </div>
                  </div>

                  {req.reason && (
                    <div className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-500">Observação:</span> "{req.reason}"
                    </div>
                  )}

                  {/* Linha do Tempo de Aprovação (Supervisor + RH) */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Trâmite de Aprovações:
                    </span>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* Etapa 1: Supervisor */}
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          req.supervisor_decision === 'approved'
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : req.supervisor_decision === 'rejected'
                            ? 'bg-rose-50/80 border-rose-200'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> 1. Parecer do Supervisor
                          </span>
                          {req.supervisor_decision === 'approved' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Aprovado
                            </span>
                          )}
                          {req.supervisor_decision === 'rejected' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              Recusado
                            </span>
                          )}
                          {!req.supervisor_decision && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Em Análise
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {req.supervisor_decision_at
                            ? `Avaliado em ${formatDateTimeBR(req.supervisor_decision_at)}`
                            : 'Aguardando avaliação do gestor direto'}
                        </p>
                        {req.supervisor_notes && (
                          <p className="text-[11px] text-slate-700 mt-1 italic font-sans">
                            "{req.supervisor_notes}"
                          </p>
                        )}
                      </div>

                      {/* Etapa 2: RH */}
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          req.rh_decision === 'approved'
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : req.rh_decision === 'rejected'
                            ? 'bg-rose-50/80 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" /> 2. Homologação do RH
                          </span>
                          {req.rh_decision === 'approved' && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Aceito pelo RH
                            </span>
                          )}
                          {req.rh_decision === 'rejected' && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              Recusado pelo RH
                            </span>
                          )}
                          {!req.rh_decision && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                              Aguardando
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {req.rh_decision_at
                            ? `Homologado em ${formatDateTimeBR(req.rh_decision_at)}`
                            : req.supervisor_decision === 'approved'
                            ? 'Em fila para validação final do RH'
                            : 'Aguardando aprovação prévia do supervisor'}
                        </p>
                        {req.rh_notes && (
                          <p className="text-[11px] text-slate-700 mt-1 italic font-sans">
                            "{req.rh_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendário do Funcionário (5 colunas) */}
        <div className="lg:col-span-5">
          <VacationCalendar
            requests={myRequests}
            title="Meu Calendário de Férias"
            subtitle="Datas marcadas dos seus 2 períodos de 15 dias"
          />
        </div>
      </div>

      {/* Modal de Solicitação */}
      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
        existingRequests={requests}
        onSubmit={onCreateRequest}
      />
    </div>
  );
};
