import React, { useState } from 'react';
import { UserProfile, VacationRequest } from '../types/vacation.ts';
import { INITIAL_USERS } from '../data/mockData.ts';
import {
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Briefcase,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDateBR, formatDateTimeBR } from '../lib/dateUtils.ts';
import { DecisionModal } from './DecisionModal.tsx';
import { VacationCalendar } from './VacationCalendar.tsx';

interface RHDashboardProps {
  currentUser: UserProfile;
  requests: VacationRequest[];
  onDecision: (requestId: string, decision: 'approved' | 'rejected', notes: string) => Promise<void>;
}

export const RHDashboard: React.FC<RHDashboardProps> = ({
  currentUser,
  requests,
  onDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'pending_rh' | 'all' | 'balances' | 'calendar'>('pending_rh');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  // Solicitações aprovadas pelo supervisor que estão aguardando parecer final do RH
  const pendingRHRequests = requests.filter((r) => r.status === 'pending_rh');
  const approvedTotal = requests.filter((r) => r.status === 'approved');
  const pendingSupervisorTotal = requests.filter((r) => r.status === 'pending_supervisor');
  const rejectedTotal = requests.filter((r) => r.status === 'rejected');

  const handleOpenDecision = (req: VacationRequest) => {
    setSelectedRequest(req);
    setIsDecisionModalOpen(true);
  };

  // Filtra lista geral
  const filteredAllRequests = requests.filter((req) => {
    const matchesSearch =
      req.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employee_department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Lista de funcionários e cálculo de saldos (2 períodos de 15 dias)
  const employeeBalances = INITIAL_USERS.filter((u) => u.role === 'employee').map((emp) => {
    const empRequests = requests.filter(
      (r) => r.employee_id === emp.id && r.year_reference === 2026
    );
    const approved = empRequests.filter((r) => r.status === 'approved');
    const pending = empRequests.filter(
      (r) => r.status === 'pending_supervisor' || r.status === 'pending_rh'
    );
    const approvedPeriods = approved.length;
    const canRequest = approvedPeriods < 2;

    return {
      user: emp,
      approvedPeriods,
      pendingPeriods: pending.length,
      approvedDays: approvedPeriods * 15,
      remainingDays: (2 - approvedPeriods) * 15,
      canRequest,
      statusLabel:
        approvedPeriods >= 2
          ? 'Limite Atingido (30d Gozados)'
          : approvedPeriods === 1
          ? '1 Período Concedido (Resta 1 de 15d)'
          : 'Nenhum Período Gozado (Resta 2 de 15d)',
    };
  });

  // Exportar para CSV
  const handleExportCSV = () => {
    const headers = [
      'ID Solicitação',
      'Colaborador',
      'Departamento',
      'Ano',
      'Período',
      'Data Início',
      'Data Término',
      'Dias',
      'Status',
      'Data Solicitação',
      'Parecer Supervisor',
      'Notas Supervisor',
      'Parecer RH',
      'Notas RH',
    ];

    const rows = requests.map((r) => [
      r.id,
      r.employee_name,
      r.employee_department,
      r.year_reference,
      `${r.period_number}º Período`,
      r.start_date,
      r.end_date,
      r.total_days,
      r.status,
      r.created_at,
      r.supervisor_decision || 'Pendente',
      `"${r.supervisor_notes || ''}"`,
      r.rh_decision || 'Pendente',
      `"${r.rh_notes || ''}"`,
    ]);

    const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_ferias_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Hero RH Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                2ª Etapa • Homologação Definitiva do RH
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Central de Férias & RH: {currentUser.name}
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              Supervisão de conformidade com a política de 2 períodos de 15 dias, validação de pareceres e homologação final das solicitações.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Exportar Relatório CSV
            </button>
          </div>
        </div>

        {/* Métricas do RH */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-indigo-200 block">Aguardando Aval do RH</span>
            <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline justify-between">
              <span>{pendingRHRequests.length}</span>
              <span className="text-[10px] font-bold uppercase text-amber-300">Ação Necessária</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-indigo-200 block">Totalmente Aprovadas</span>
            <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline justify-between">
              <span>{approvedTotal.length}</span>
              <span className="text-[10px] font-bold uppercase text-emerald-300">Ambos aceitaram</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-indigo-200 block">Com o Supervisor</span>
            <div className="text-2xl font-black text-slate-300 mt-1">
              <span>{pendingSupervisorTotal.length}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-indigo-200 block">Recusadas</span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              <span>{rejectedTotal.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending_rh')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'pending_rh'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Aguardando Homologação Final do RH
          {pendingRHRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white text-indigo-900 text-[10px] font-black">
              {pendingRHRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Todas as Solicitações ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'balances'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Controle de Saldos (2x15d por Colaborador)
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
          Calendário Corporativo
        </button>
      </div>

      {/* Conteúdo Aba 1: Pendentes do RH */}
      {activeTab === 'pending_rh' && (
        <div className="space-y-4">
          {pendingRHRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Fila Limpa!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não há nenhuma solicitação aprovada pelo supervisor aguardando homologação do RH no momento.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRHRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border-2 border-indigo-200 p-5 shadow-xs hover:border-indigo-400 transition space-y-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Aprovado por Supervisor • Aguarda RH
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{req.employee_name}</h3>
                      <p className="text-xs text-slate-500">{req.employee_department}</p>
                    </div>
                    <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-black">
                      P{req.period_number}
                    </span>
                  </div>

                  {/* Informações de Datas */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Período de Férias:</span>
                      <span className="font-bold text-slate-900">
                        {formatDateBR(req.start_date)} até {formatDateBR(req.end_date)} (15 Dias)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
                      <span>Ano de Referência: {req.year_reference}</span>
                      <span>Solicitado: {formatDateTimeBR(req.created_at)}</span>
                    </div>
                  </div>

                  {/* Parecer do Supervisor */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-900 font-bold">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Aprovado por {req.supervisor_name}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        {formatDateTimeBR(req.supervisor_decision_at)}
                      </span>
                    </div>
                    {req.supervisor_notes && (
                      <p className="text-emerald-800 italic">"{req.supervisor_notes}"</p>
                    )}
                  </div>

                  {/* Botão de Decisão Final */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenDecision(req)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      Emitir Parecer Final do RH (Homologar / Recusar)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Aba 2: Todas as Solicitações */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por colaborador ou departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pending_supervisor">Aguardando Supervisor</option>
                <option value="pending_rh">Aguardando RH</option>
                <option value="approved">Aprovadas (Ambos)</option>
                <option value="rejected">Recusadas</option>
              </select>
            </div>
          </div>

          {/* Tabela de Solicitações */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Departamento</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Datas (15 dias)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Supervisor</th>
                  <th className="px-4 py-3">RH</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{req.employee_name}</td>
                    <td className="px-4 py-3 text-slate-500">{req.employee_department}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{req.period_number}º Período</td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {formatDateBR(req.start_date)} a {formatDateBR(req.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Aprovada
                        </span>
                      )}
                      {req.status === 'pending_rh' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Aguardando RH
                        </span>
                      )}
                      {req.status === 'pending_supervisor' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Aguardando Supervisor
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Recusada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.supervisor_decision === 'approved' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Aceito
                        </span>
                      ) : req.supervisor_decision === 'rejected' ? (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <X className="w-3 h-3" /> Recusado
                        </span>
                      ) : (
                        <span className="text-slate-400">Pendente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.rh_decision === 'approved' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Aceito
                        </span>
                      ) : req.rh_decision === 'rejected' ? (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <X className="w-3 h-3" /> Recusado
                        </span>
                      ) : (
                        <span className="text-slate-400">Pendente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'pending_rh' ? (
                        <button
                          onClick={() => handleOpenDecision(req)}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 transition"
                        >
                          Avaliar
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo Aba 3: Controle de Saldos (2 períodos de 15 dias) */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Regra de Conformidade: 2 Períodos de 15 Dias por Ano
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              O sistema monitora rigorosamente o limite legal e corporativo de 2 períodos aceitos por ano de exercício.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {employeeBalances.map((item) => (
              <div
                key={item.user.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.user.avatarUrl}
                      alt={item.user.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.user.name}</h4>
                      <p className="text-xs text-slate-500">{item.user.position}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.canRequest
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {item.canRequest ? 'Pode Solicitar' : 'Limite Atingido'}
                  </span>
                </div>

                {/* Barra de Progresso */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Períodos Aceitos: {item.approvedPeriods} de 2</span>
                    <span className="font-bold">{item.approvedDays} de 30 dias</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(item.approvedPeriods / 2) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <span>{item.statusLabel}</span>
                  <span className="font-semibold text-slate-700">Resta: {item.remainingDays} dias</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Aba 4: Calendário */}
      {activeTab === 'calendar' && (
        <div>
          <VacationCalendar
            requests={requests}
            title="Calendário Geral de Férias Corporativo"
            subtitle="Visão consolidada de todas as solicitações aceitas e em análise na organização"
          />
        </div>
      )}

      {/* Modal de Homologação do RH */}
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
