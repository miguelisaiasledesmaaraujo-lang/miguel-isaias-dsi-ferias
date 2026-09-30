import React, { useState } from 'react';
import { X, Database, CheckCircle, AlertTriangle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { getSavedConfig, saveConfig, testSupabaseConnection, getSupabaseSQLScript } from '../lib/supabase.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose, onConfigUpdated }) => {
  const currentConfig = getSavedConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableExists?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    saveConfig(url, anonKey);
    onConfigUpdated();
    onClose();
  };

  const copySql = () => {
    navigator.clipboard.writeText(getSupabaseSQLScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Integração com Supabase</h2>
              <p className="text-xs text-slate-300">Conecte seu banco de dados PostgreSQL na nuvem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Banco de Dados Ativo e Híbrido</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                O sistema funciona imediatamente com armazenamento persistente em banco local. Ao preencher as credenciais abaixo, ele sincroniza e salva as solicitações diretamente na sua tabela do Supabase.
              </p>
            </div>
          </div>

          {/* Form Credentials */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Project URL do Supabase
              </label>
              <input
                type="text"
                placeholder="https://exemplo-seu-projeto.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <span className="text-[11px] text-slate-500">Encontrado no painel do Supabase &gt; Project Settings &gt; API</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Anon / Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono"
              />
              <span className="text-[11px] text-slate-500">Chave pública para operações no navegador</span>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.success ? 'Conexão Bem-sucedida' : 'Falha na Conexão'}</p>
                <p className="text-xs mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* SQL Script Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Script SQL para Criar Tabela no Supabase
              </span>
              <button
                type="button"
                onClick={copySql}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md transition shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Copie este código e cole no <strong>SQL Editor</strong> do seu dashboard do Supabase para criar a tabela com os campos exatos de datas e pareceres:
            </p>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-40">
              {getSupabaseSQLScript()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !url}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Testar Conexão
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
