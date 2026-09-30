import React, { useState } from 'react';
import { UserProfile, VacationRequest } from '../types/vacation.ts';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  AlertCircle,
  Filter,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { formatDateBR, formatDateTimeBR } from '../lib/dateUtils.ts';
import { DecisionModal } from './DecisionModal.tsx';
import { VacationCalendar } from './VacationCalendar.tsx';

interface SupervisorDashboardProps {
  currentUser: UserProfile;
  requests: VacationRequest[];
  onDecision: (requestId: string, decision: 'approved' | 'rejected', notes: string) => Promise<void>;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  currentUser,
  requests,
  onDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'evaluated' | 'calendar'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Solicitações que necessitam do parecer deste supervisor
  const pendingRequests = requests.filter((r) => r.status === 'pending_supervisor');
  
  // Solicitações que este supervisor já avaliou
  const evaluatedRequests = requests.filter(
    (r) => r.supervisor_decision === 'approved' || r.supervisor_decision === 'rejected'
  );

  const handleOpenDecision = (req: VacationRequest) => {
    setSelectedRequest(req);
    setIsDecisionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Hero Supervisor Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                1ª Etapa de Aprovação • Gestão de Equipe
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Painel do Supervisor: {currentUser.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Como supervisor, avalie a viabilidade da escala e libere as férias da sua equipe para homologação final do RH.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 text-center min-w-28">
              <span className="text-2xl font-black text-amber-400 block">{pendingRequests.length}</span>
              <span className="text-[11px] font-medium text-slate-300">Pendentes</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 text-center min-w-28">
              <span className="text-2xl font-black text-emerald-400 block">{evaluatedRequests.length}</span>
              <span className="text-[11px] font-medium text-slate-300">Avaliadas</span>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-amber-200/90">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Regra Obrigatória:</strong> A aprovação do Supervisor é indispensável, porém a solicitação só é aceita em definitivo após o aval do RH.
          </span>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Aguardando Minha Avaliação
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('evaluated')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'evaluated'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Histórico de Avaliações ({evaluatedRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Escala de Férias da Equipe
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Tudo em dia!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não há nenhuma solicitação de férias aguardando seu parecer no momento.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-xs hover:border-amber-400 transition space-y-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Aguardando Supervisor
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{req.employee_name}</h3>
                      <p className="text-xs text-slate-500">{req.employee_department}</p>
                    </div>
                    <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-black">
                      P{req.period_number}
                    </span>
                  </div>

                  {/* Informações de Datas */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Período de 15 Dias:</span>
                      <span className="font-bold text-slate-900">
                        {formatDateBR(req.start_date)} até {formatDateBR(req.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Ano de Referência: {req.year_reference}</span>
                      <span>Solicitado: {formatDateTimeBR(req.created_at)}</span>
                    </div>
                  </div>

                  {req.reason && (
                    <div className="text-xs bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                      <span className="font-semibold text-slate-500">Motivo:</span> "{req.reason}"
                    </div>
                  )}

                  {/* Ação de Decisão */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDecision(req)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Avaliar Solicitação (Aprovar / Recusar)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'evaluated' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Solicitações Avaliadas por Você
            </h3>
            <span className="text-xs text-slate-500">{evaluatedRequests.length} registro(s)</span>
          </div>

          {evaluatedRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma solicitação avaliada ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {evaluatedRequests.map((req) => (
                <div key={req.id} className="p-4 sm:p-5 hover:bg-slate-50 transition space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-slate-900">{req.employee_name}</span>
                      <span className="text-xs text-slate-500 ml-2">({req.employee_department})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {req.period_number}º Período (15d)
                      </span>
                      {req.supervisor_decision === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Aprovado por Você
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> Recusado por Você
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-4 pt-1">
                    <span>
                      Datas: <strong>{formatDateBR(req.start_date)}</strong> até{' '}
                      <strong>{formatDateBR(req.end_date)}</strong>
                    </span>
                    <span>Avaliado em: {formatDateTimeBR(req.supervisor_decision_at)}</span>
                    <span>
                      Status Geral:{' '}
                      <strong className="text-slate-800">
                        {req.status === 'approved'
                          ? 'Totalmente Aprovado (Supervisor + RH)'
                          : req.status === 'pending_rh'
                          ? 'Aguardando Parecer do RH'
                          : 'Recusado'}
                      </strong>
                    </span>
                  </div>

                  {req.supervisor_notes && (
                    <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                      Seu parecer: "{req.supervisor_notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div>
          <VacationCalendar
            requests={requests}
            title="Escala Geral da Equipe"
            subtitle="Consulte os afastamentos da equipe para evitar sobreposições de ausências críticas"
          />
        </div>
      )}

      {/* Modal de Avaliação do Supervisor */}
      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        request={selectedRequest}
        currentUser={currentUser}
        onConfirmDecision={onDecision}
      />
    </div>
  );
};
