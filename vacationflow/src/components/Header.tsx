import React from 'react';
import { UserProfile, UserRole } from '../types/vacation.ts';
import { INITIAL_USERS } from '../data/mockData.ts';
import { Calendar, Database, ShieldCheck, User, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { isSupabaseActive } from '../lib/supabase.ts';

interface HeaderProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onOpenSupabaseModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  onOpenSupabaseModal,
  onRefresh,
  isRefreshing,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const supabaseConnected = isSupabaseActive();

  // Fecha dropdown ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'employee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <User className="w-3 h-3" /> Funcionário
          </span>
        );
      case 'supervisor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3" /> Supervisor (1ª Aprovação)
          </span>
        );
      case 'rh':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Users className="w-3 h-3" /> RH (Aprovação Final)
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">FériasFlow</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  CLT 2x15d
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Gestão Corporativa de Férias</p>
            </div>
          </div>

          {/* Center/Right Actions: Supabase Status & User Switcher */}
          <div className="flex items-center gap-3">
            {/* Supabase connection indicator */}
            <button
              onClick={onOpenSupabaseModal}
              title="Clique para gerenciar banco de dados e Supabase"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                supabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${supabaseConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {supabaseConnected ? 'Supabase Conectado' : 'Banco de Dados (Configurar)'}
              </span>
              <span className="sm:hidden">{supabaseConnected ? 'Supabase' : 'BD'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>

            {/* User Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition bg-white shadow-2xs"
              >
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                />
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{currentUser.position}</div>
                </div>
                {getRoleBadge(currentUser.role)}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Alternar Perfil de Acesso
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Teste os 3 acessos: Funcionário, Supervisor e RH
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {INITIAL_USERS.map((user) => {
                      const isSelected = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSelectUser(user);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition ${
                            isSelected ? 'bg-indigo-50/60' : ''
                          }`}
                        >
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate">{user.name}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">{user.position}</span>
                            <div className="mt-1">{getRoleBadge(user.role)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
