import React, { useState, useEffect } from 'react';
import { UserProfile, VacationRequest } from '../types/vacation.ts';
import { X, Calendar, AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { calculateEndDate, formatDateBR, getMinStartDate, checkDateOverlap } from '../lib/dateUtils.ts';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  existingRequests: VacationRequest[];
  onSubmit: (request: Omit<VacationRequest, 'id' | 'created_at'>) => Promise<void>;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  existingRequests,
  onSubmit,
}) => {
  const currentYear = 2026;
  
  // Calcula solicitações do ano
  const myYearRequests = existingRequests.filter(
    (r) => r.employee_id === currentUser.id && r.year_reference === currentYear
  );
  const approvedCount = myYearRequests.filter((r) => r.status === 'approved').length;
  const pendingCount = myYearRequests.filter((r) => r.status === 'pending_supervisor' || r.status === 'pending_rh').length;

  // Determina número do período (1º ou 2º)
  const periodNumber: 1 | 2 = approvedCount === 0 ? 1 : 2;

  const [startDate, setStartDate] = useState(getMinStartDate());
  const [endDate, setEndDate] = useState(calculateEndDate(getMinStartDate(), 15));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Atualiza data de término sempre que a data de início mudar (regra rígida de 15 dias)
  useEffect(() => {
    if (startDate) {
      setEndDate(calculateEndDate(startDate, 15));
      setErrorMsg(null);
    }
  }, [startDate]);

  if (!isOpen) return null;

  // Regra fundamental: se já possui 2 ou mais aceitas, não pode solicitar
  const isLimitReached = approvedCount >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isLimitReached) {
      setErrorMsg('Você já completou o limite de 2 solicitações de 15 dias aceitas neste ano de referência.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('Selecione uma data de início válida.');
      return;
    }

    // Checar sobreposição com outros períodos deste funcionário
    const hasOverlap = myYearRequests.some((r) => {
      // Ignora solicitações recusadas
      if (r.status === 'rejected') return false;
      return checkDateOverlap(startDate, endDate, r.start_date, r.end_date);
    });

    if (hasOverlap) {
      setErrorMsg('O período selecionado coincide com outra solicitação (aprovada ou em análise) sua. Escolha outro intervalo.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        employee_id: currentUser.id,
        employee_name: currentUser.name,
        employee_email: currentUser.email,
        employee_department: currentUser.department,
        year_reference: currentYear,
        period_number: periodNumber,
        start_date: startDate,
        end_date: endDate,
        total_days: 15,
        reason: reason.trim() || undefined,
        status: 'pending_supervisor', // Sempre inicia aguardando o supervisor
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Falha ao registrar solicitação. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300 border border-indigo-400/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Solicitar Período de Férias</h2>
              <p className="text-xs text-slate-300">
                {periodNumber}º Período de 15 dias corridos ({currentYear})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Alerta de Regra de Negócio */}
          {isLimitReached ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Limite Anual Atingido</p>
                <p className="text-xs mt-1 text-rose-700 leading-relaxed">
                  Você já possui <strong>2 solicitações de 15 dias aceitas</strong> para o ano de {currentYear}. Conforme a política, funcionários têm direito a exatamente 2 períodos no ano.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Regulamento de Férias (2 períodos de 15 dias)</p>
                <p className="text-slate-600">
                  Você possui <strong>{approvedCount} de 2 períodos aceitos</strong>. Esta solicitação refere-se ao seu <strong>{periodNumber}º período de 15 dias</strong> e necessita da aprovação do <strong>Supervisor</strong> e do <strong>RH</strong>.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados do Funcionário */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 block">Colaborador(a):</span>
              <span className="font-bold text-slate-800">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Departamento:</span>
              <span className="font-bold text-slate-800">{currentUser.department}</span>
            </div>
          </div>

          {/* Seleção de Datas */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data de Início das Férias
              </label>
              <input
                type="date"
                min={getMinStartDate()}
                value={startDate}
                disabled={isLimitReached}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
              />
            </div>

            {/* Visualizador do Período Calculado */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Período Calculado (15 Dias Corridos)
                </span>
                <div className="text-sm font-extrabold text-emerald-950 mt-0.5">
                  {formatDateBR(startDate)} <span className="text-emerald-600 font-normal">até</span> {formatDateBR(endDate)}
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                15 DIAS
              </div>
            </div>
          </div>

          {/* Motivo / Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Justificativa (Opcional)
            </label>
            <textarea
              rows={3}
              value={reason}
              disabled={isLimitReached}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Viagem planejada em família, descanso de meio de ano..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50 resize-none"
            />
          </div>

          {/* Fluxo de Dupla Aprovação Indicador */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Etapas de Tramitação Necessárias:
            </span>
            <div className="flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Supervisor Avalia</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold">2</span>
                <span>RH Valida e Aceita</span>
              </div>
              <span className="text-slate-400">➔</span>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Aprovada</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLimitReached}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Gravando no Banco...' : 'Enviar Solicitação de Férias'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
