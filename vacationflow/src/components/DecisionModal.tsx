import React, { useState } from 'react';
import { VacationRequest, UserProfile } from '../types/vacation.ts';
import { X, CheckCircle, XCircle, Clock, ShieldCheck, Users, Calendar, AlertCircle } from 'lucide-react';
import { formatDateBR, formatDateTimeBR } from '../lib/dateUtils.ts';
import confetti from 'canvas-confetti';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: VacationRequest | null;
  currentUser: UserProfile;
  onConfirmDecision: (
    requestId: string,
    decision: 'approved' | 'rejected',
    notes: string
  ) => Promise<void>;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  isOpen,
  onClose,
  request,
  currentUser,
  onConfirmDecision,
}) => {
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const isSupervisorRole = currentUser.role === 'supervisor';
  const isRHRole = currentUser.role === 'rh';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (decision === 'rejected' && !notes.trim()) {
      setErrorMsg('Por favor, informe a justificativa para a recusa da solicitação.');
      return;
    }

    try {
      setIsProcessing(true);
      await onConfirmDecision(request.id, decision, notes.trim());

      // Se foi aprovação final pelo RH, celebra com confetes!
      if (decision === 'approved' && isRHRole) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err?.message || 'Erro ao processar decisão. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 text-white ${
            isSupervisorRole
              ? 'bg-gradient-to-r from-amber-700 to-slate-900'
              : 'bg-gradient-to-r from-indigo-800 to-slate-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl text-white">
              {isSupervisorRole ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isSupervisorRole ? 'Avaliação do Supervisor' : 'Homologação Final pelo RH'}
              </h2>
              <p className="text-xs text-slate-200">
                {isSupervisorRole
                  ? '1ª Etapa: Validação de escala da equipe'
                  : '2ª Etapa: Homologação e aceite definitivo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados Resumidos da Solicitação */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Colaborador Solicitante
                </span>
                <span className="text-sm font-bold text-slate-900">{request.employee_name}</span>
                <span className="text-xs text-slate-500 block">{request.employee_department}</span>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                  {request.period_number}º Período de 15d
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">Ano {request.year_reference}</span>
              </div>
            </div>

            {/* Período de Datas */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold">
                  {formatDateBR(request.start_date)} até {formatDateBR(request.end_date)}
                </span>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {request.total_days} dias corridos
              </span>
            </div>

            {request.reason && (
              <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                <span className="font-semibold text-slate-500 block mb-0.5">Observação do Funcionário:</span>
                "{request.reason}"
              </div>
            )}
          </div>

          {/* Se for avaliação do RH, exibe o parecer já dado pelo Supervisor */}
          {isRHRole && request.supervisor_decision === 'approved' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Aprovado pelo Supervisor
                </span>
                <span className="text-[11px] text-emerald-700">
                  {formatDateTimeBR(request.supervisor_decision_at)}
                </span>
              </div>
              <p className="text-emerald-800">
                <strong>{request.supervisor_name}</strong> validou a liberação de escala.
              </p>
              {request.supervisor_notes && (
                <p className="text-emerald-700 italic">"{request.supervisor_notes}"</p>
              )}
            </div>
          )}

          {/* Seleção de Decisão: Aprovar ou Recusar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Seu Parecer ({currentUser.name})
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition ${
                  decision === 'approved'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {isSupervisorRole ? 'Aprovar (Ir para RH)' : 'Aprovar Definitivamente'}
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition ${
                  decision === 'rejected'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Recusar Solicitação
              </button>
            </div>
          </div>

          {/* Justificativa / Parecer Textual */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Comentários / Parecer Formal {decision === 'rejected' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                decision === 'approved'
                  ? 'Ex: Escala ajustada e autorizada sem prejuízo às atividades.'
                  : 'Descreva detalhadamente o motivo da recusa (obrigatório).'
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition disabled:opacity-50 ${
                decision === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {isProcessing
                ? 'Gravando Parecer...'
                : decision === 'approved'
                ? isSupervisorRole
                  ? 'Confirmar Aprovação (Enviar ao RH)'
                  : 'Confirmar Aprovação Final'
                : 'Confirmar Recusa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
