import React, { useState } from 'react';
import { VacationRequest } from '../types/vacation.ts';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getMonthNameBR, formatDateBR } from '../lib/dateUtils.ts';

interface VacationCalendarProps {
  requests: VacationRequest[];
  title?: string;
  subtitle?: string;
  filterEmployeeId?: string;
}

export const VacationCalendar: React.FC<VacationCalendarProps> = ({
  requests,
  title = 'Calendário de Férias',
  subtitle = 'Visualize os períodos de 15 dias agendados no ano',
  filterEmployeeId,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Outubro 2026 (baseado no contexto atual)
  const [selectedDayRequests, setSelectedDayRequests] = useState<{ day: string; items: VacationRequest[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayRequests(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayRequests(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDayRequests(null);
  };

  // Filtra as solicitações
  const displayRequests = filterEmployeeId
    ? requests.filter((r) => r.employee_id === filterEmployeeId)
    : requests;

  // Primeiro dia do mês e total de dias
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Segunda...
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Dias do mês anterior para preencher grade
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  const daysFromPrevMonth = firstDayIndex;

  // Cria array de dias
  const calendarCells: {
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isWeekend: boolean;
  }[] = [];

  // Dias do mês anterior
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevM = month === 0 ? 11 : month - 1;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(prevY, prevM, d).getDay();
    calendarCells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  // Dias do mês atual
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    calendarCells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  // Preenche o restante da semana
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(nextY, nextM, d).getDay();
    calendarCells.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  // Função para verificar se há férias em uma data
  const getRequestsForDate = (dateStr: string) => {
    return displayRequests.filter((r) => dateStr >= r.start_date && dateStr <= r.end_date);
  };

  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header do Calendário */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs"
          >
            Mês Atual
          </button>
          <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-l-lg transition"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-36 text-center select-none">
              {getMonthNameBR(month)} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-r-lg transition"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legenda de Status */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-500 font-medium">Legenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-700 font-medium">Aprovada (Ambos aceitaram)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-700 font-medium">Em Análise (Supervisor/RH)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-400" />
          <span className="text-slate-700 font-medium">Recusada</span>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="p-4">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {weekDayLabels.map((lbl, idx) => (
            <div
              key={lbl}
              className={`text-xs font-bold py-1.5 ${
                idx === 0 || idx === 6 ? 'text-rose-500' : 'text-slate-500'
              }`}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Células de dias */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell, idx) => {
            const matches = getRequestsForDate(cell.dateStr);
            const hasMatches = matches.length > 0;
            const isApproved = matches.some((m) => m.status === 'approved');
            const isPending = matches.some(
              (m) => m.status === 'pending_supervisor' || m.status === 'pending_rh'
            );
            const isRejected = matches.some((m) => m.status === 'rejected');

            return (
              <div
                key={idx}
                onClick={() => hasMatches && setSelectedDayRequests({ day: cell.dateStr, items: matches })}
                className={`min-h-16 p-1.5 rounded-xl border transition flex flex-col justify-between ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/50 border-slate-100 text-slate-300'
                    : cell.isWeekend
                    ? 'bg-slate-50/70 border-slate-200/80 text-slate-600'
                    : 'bg-white border-slate-200 text-slate-800'
                } ${
                  hasMatches
                    ? 'cursor-pointer ring-1 ring-indigo-200 hover:ring-indigo-400 hover:shadow-xs'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      !cell.isCurrentMonth
                        ? 'text-slate-300'
                        : cell.isWeekend
                        ? 'text-rose-600/70'
                        : 'text-slate-700'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {hasMatches && (
                    <span className="text-[10px] font-bold px-1 rounded-sm bg-indigo-100 text-indigo-700">
                      {matches.length}
                    </span>
                  )}
                </div>

                {/* Marcadores de férias na célula */}
                <div className="space-y-1 mt-1">
                  {matches.slice(0, 2).map((req) => {
                    let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                    if (req.status === 'approved') {
                      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                    } else if (req.status === 'rejected') {
                      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                    }

                    return (
                      <div
                        key={req.id}
                        className={`text-[10px] px-1 py-0.5 rounded font-medium border truncate leading-tight ${badgeClass}`}
                        title={`${req.employee_name} (${req.period_number}º Período - 15d)`}
                      >
                        {req.employee_name.split(' ')[0]} (15d)
                      </div>
                    );
                  })}
                  {matches.length > 2 && (
                    <div className="text-[9px] text-slate-500 font-bold">
                      +{matches.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhe do dia selecionado */}
      {selectedDayRequests && (
        <div className="p-4 bg-indigo-50/70 border-t border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              Solicitações no dia {formatDateBR(selectedDayRequests.day)}
            </h4>
            <button
              onClick={() => setSelectedDayRequests(null)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Fechar
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedDayRequests.items.map((req) => (
              <div
                key={req.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{req.employee_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {req.period_number}º Período
                  </span>
                </div>
                <p className="text-slate-500">
                  {formatDateBR(req.start_date)} até {formatDateBR(req.end_date)} ({req.total_days} dias corridos)
                </p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium">
                  {req.status === 'approved' && (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Aprovado (Supervisor & RH)
                    </span>
                  )}
                  {req.status === 'pending_supervisor' && (
                    <span className="text-amber-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Aguardando parecer do Supervisor
                    </span>
                  )}
                  {req.status === 'pending_rh' && (
                    <span className="text-blue-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" /> Aprovado por Supervisor; Aguardando RH
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="text-rose-700 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> Recusado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
