import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ShieldCheck,
  CloudUpload,
} from 'lucide-react';
import {
  getStoredFirebaseConfig,
  parseFirebaseConfigInput,
  saveFirebaseConfig,
  removeFirebaseConfig,
  isFirebaseActive,
  FirebaseConfig,
} from '../../lib/firebase';
import { firestoreService } from '../../lib/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { refreshData } = useFinance();

  const [inputConfig, setInputConfig] = useState('');
  const [currentConfig, setCurrentConfig] = useState<FirebaseConfig | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migratedCount, setMigratedCount] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentConfig(getStoredFirebaseConfig());
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inputConfig.trim()) {
      setError('Please paste your Firebase configuration object or JSON');
      return;
    }

    setIsSaving(true);
    try {
      const parsed = parseFirebaseConfigInput(inputConfig);
      saveFirebaseConfig(parsed);
      setCurrentConfig(parsed);
      setSuccess('Firebase configuration saved successfully! Cloud sync is now active.');
      setInputConfig('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse Firebase configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect Firebase cloud sync? The app will revert to local offline storage.')) {
      removeFirebaseConfig();
    }
  };

  const handleMigrateData = async () => {
    if (!user) return;
    setIsMigrating(true);
    setError('');
    try {
      const count = await firestoreService.uploadLocalDataToFirestore(user.id);
      setMigratedCount(count);
      setSuccess(`Successfully uploaded ${count} local items to your Firebase cloud database!`);
      await refreshData();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload local data to cloud');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 overflow-hidden animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-700/80" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500/30 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                  Real-Time Cloud Sync (Firebase)
                </h3>
                {currentConfig && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Otomatis sinkron 2 arah antara HP & PC tanpa perlu kirim kode
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Status Card */}
          {currentConfig ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cloud Sync Sedang Aktif!</span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Terhubung ke project: <strong className="text-white font-mono">{currentConfig.projectId}</strong>. Setiap input pengeluaran di HP akan langsung muncul di PC secara real-time!
              </p>

              {user && (
                <div className="pt-2 border-t border-emerald-500/20">
                  <button
                    type="button"
                    onClick={handleMigrateData}
                    disabled={isMigrating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>{isMigrating ? 'Mengunggah...' : 'Upload Data Offline Lokal ke Cloud'}</span>
                  </button>
                  {migratedCount !== null && (
                    <p className="text-[11px] text-emerald-300 mt-1">
                      &check; {migratedCount} data berhasil disinkronkan ke database online.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Step by Step Guide in Indonesian */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Panduan 3 Langkah Setup Firebase (100% Gratis)</span>
                  </h4>
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                  >
                    <span>Buka Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
                  <li>
                    <strong>Buat Project Gratis</strong>: Buka{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline font-medium"
                    >
                      console.firebase.google.com
                    </a>
                    , klik <em>"Add project"</em> dan beri nama apa saja (misal: <code>expenses-tracker</code>).
                  </li>
                  <li>
                    <strong>Aktifkan Fitur (2 Menit)</strong>:
                    <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-slate-400 text-[11px]">
                      <li>
                        Di menu kiri, pilih <strong>Build &gt; Authentication</strong> &gt; klik <em>Get Started</em> &gt; aktifkan <strong>Email/Password</strong>.
                      </li>
                      <li>
                        Di menu kiri, pilih <strong>Build &gt; Firestore Database</strong> &gt; klik <em>Create database</em> &gt; pilih <em>Start in test mode</em> &gt; klik Create.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Dapatkan Config Web</strong>:
                    <p className="pl-4 pt-0.5 text-slate-400 text-[11px]">
                      Di halaman utama project, klik ikon Web (<code>&lt;/&gt;</code>) untuk daftarkan web app. Salin kode <code>firebaseConfig</code> yang muncul, lalu tempel di kotak bawah ini:
                    </p>
                  </li>
                </ol>
              </div>

              {/* Paste Form */}
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Paste Firebase Config
                  </label>
                  <textarea
                    value={inputConfig}
                    onChange={(e) => setInputConfig(e.target.value)}
                    placeholder={`Contoh yang ditempel:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "myproject.firebaseapp.com",\n  projectId: "myproject",\n  ...\n};`}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono leading-relaxed"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format otomatis dikenali: baik berupa snippet JavaScript <code>const firebaseConfig = ...</code> maupun JSON mentah.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:opacity-95 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-4 h-4 fill-slate-950" />
                  <span>{isSaving ? 'Menghubungkan...' : 'Simpan & Aktifkan Real-Time Sync'}</span>
                </button>
              </form>
            </>
          )}

          {/* Security & Free Guarantee Note */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-[11px]">Gratis &amp; Aman 100%</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Paket gratis Firebase (Spark Plan) mencakup hingga 50.000 baca dan 20.000 tulis per hari — jauh lebih dari cukup untuk pencatatan keuangan harian pribadi selamanya tanpa biaya sepeser pun.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
