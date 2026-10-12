import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Copy,
  Check,
  Download,
  Upload,
  Link as LinkIcon,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { exportUserData, encodeSyncString, generateSyncUrl, importUserData, decodeSyncString } from '../../lib/sync';
import { useFinance } from '../../context/FinanceContext';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const { refreshData } = useFinance();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  let syncUrl = '';
  let syncKey = '';
  try {
    const payload = exportUserData();
    syncKey = encodeSyncString(payload);
    syncUrl = generateSyncUrl();
  } catch (err: any) {
    console.warn('Sync export error:', err);
  }

  const handleCopyLink = () => {
    if (!syncUrl) return;
    navigator.clipboard.writeText(syncUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyKey = () => {
    if (!syncKey) return;
    navigator.clipboard.writeText(syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleDownloadBackup = () => {
    try {
      const payload = exportUserData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wealthtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg('Backup downloaded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to download backup');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const payload = JSON.parse(content);
        importUserData(payload);
        await refreshData();
        setSuccessMsg('Data successfully imported and synchronized!');
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        setError(err?.message || 'Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleImportKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!importKeyInput.trim()) {
      setError('Please enter or paste a sync key');
      return;
    }

    setIsImporting(true);
    try {
      const payload = decodeSyncString(importKeyInput.trim());
      importUserData(payload);
      await refreshData();
      setSuccessMsg('Device linked successfully!');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Invalid sync key');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 overflow-hidden animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-700/80" />
        </div>

        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                Multi-Device Synchronization
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Link your PC account and data to your phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Option 1: 1-Click Instant Sync Link */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
              <LinkIcon className="w-4 h-4 text-emerald-400" />
              <span>Option 1: Send Instant Sync Link to Phone (Recommended)</span>
            </div>
            <p className="text-xs text-slate-400">
              Copy this link and send it to your phone (via WhatsApp, Telegram, or email). When opened on your phone, you will be <strong>automatically logged in with all your banks and investments</strong>!
            </p>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
              <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Sync Link for Phone'}</span>
            </button>
          </div>

          {/* Option 2: Copy Sync Key */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Option 2: Copy Sync Code (Manual Input)</span>
            </div>
            <p className="text-xs text-slate-400">
              Salin kode ini, lalu buka aplikasi di HP Anda, pilih tab <strong>"Link PC"</strong>, dan tempelkan kodenya:
            </p>

            <div className="relative">
              <textarea
                readOnly
                value={syncKey}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 font-mono focus:outline-none select-all"
              />
            </div>

            <button
              onClick={handleCopyKey}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Code Copied to Clipboard!' : 'Copy Sync Code'}</span>
            </button>
          </div>

          {/* Option 3: Import a Sync Key on this device */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Option 3: Import Sync Code / Link Another Device</span>
            </div>
            <form onSubmit={handleImportKeySubmit} className="space-y-2">
              <textarea
                value={importKeyInput}
                onChange={(e) => setImportKeyInput(e.target.value)}
                placeholder="Paste sync code here..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={isImporting}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import & Sync Account'}
              </button>
            </form>
          </div>

          {/* Option 4: Backup File */}
          <div className="flex items-center justify-between gap-3 pt-2 text-xs">
            <button
              onClick={handleDownloadBackup}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download Backup (.json)</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Upload Backup</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
