export type UserRole = 'employee' | 'supervisor' | 'rh';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatarUrl?: string;
  supervisorId?: string;
}

export type VacationStatus =
  | 'pending_supervisor' // Aguardando parecer do Supervisor
  | 'pending_rh'         // Aprovado pelo supervisor, aguardando parecer do RH
  | 'approved'           // Aprovado por AMBOS (Supervisor e RH)
  | 'rejected';          // Rejeitado pelo Supervisor ou pelo RH

export interface VacationRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  employee_department: string;
  year_reference: number;       // Ex: 2026
  period_number: 1 | 2;         // 1º período ou 2º período de 15 dias
  start_date: string;           // YYYY-MM-DD
  end_date: string;             // YYYY-MM-DD (sempre 15 dias corridos)
  total_days: number;           // Fixo em 15 dias conforme regra de negócio
  reason?: string;              // Observações do funcionário
  status: VacationStatus;
  created_at: string;           // ISO timestamp

  // Avaliação do Supervisor
  supervisor_id?: string;
  supervisor_name?: string;
  supervisor_decision?: 'approved' | 'rejected' | null;
  supervisor_decision_at?: string | null;
  supervisor_notes?: string | null;

  // Avaliação do RH
  rh_id?: string;
  rh_name?: string;
  rh_decision?: 'approved' | 'rejected' | null;
  rh_decision_at?: string | null;
  rh_notes?: string | null;
}

export interface EmployeeVacationBalance {
  year: number;
  totalAllowedPeriods: number; // 2 períodos de 15 dias
  approvedPeriodsCount: number; // Quantos períodos de 15 dias foram aprovados
  pendingPeriodsCount: number;  // Quantos períodos estão em análise
  canRequest: boolean;         // True se approvedPeriodsCount < 2
  remainingPeriods: number;    // 2 - approvedPeriodsCount
  approvedDays: number;        // approvedPeriodsCount * 15
  remainingDays: number;       // remainingPeriods * 15
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  tableName: string;
}
