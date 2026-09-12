import React, { useState } from 'react';
import { WifiOff, Wifi, HardDrive, CheckCircle2, ShieldCheck, Download, X, Info } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { NoteFile, Folder } from '../types';
import { exportVaultBundle } from '../utils/storage';

interface OfflineIndicatorProps {
  notes: NoteFile[];
  folders: Folder[];
  onOpenBackupCenter?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ notes, folders, onOpenBackupCenter }) => {
  const { isOnline, reconnected } = useOnlineStatus();
  const [showModal, setShowModal] = useState(false);
  const [dismissOfflineBanner, setDismissOfflineBanner] = useState(false);

  // If online and not recently reconnected, don't show the persistent toast, but allow the user to view storage info if triggered
  if (isOnline && !reconnected && !showModal) {
    return null;
  }

  return (
    <>
      {/* Non-intrusive Toast Status */}
      {!dismissOfflineBanner && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
          style={{
            backgroundColor: !isOnline ? '#181126' : '#0f172a',
            borderColor: !isOnline ? '#f59e0b' : '#10b981',
            color: '#faf5ff',
          }}
        >
          {!isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-amber-300">Offline Mode</span>
                <span className="text-gray-300 hidden sm:inline">— Local vault active & auto-saving</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setDismissOfflineBanner(true)}
                className="ml-1 text-gray-400 hover:text-gray-200 p-0.5 rounded cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : reconnected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-300">Back Online</span>
              <span className="text-gray-300 hidden sm:inline">— All local notes intact</span>
            </>
          ) : null}
        </div>
      )}

      {/* Offline Vault & Storage Health Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-[#150d24] border border-[#2e1c52] p-5 shadow-2xl text-[#faf5ff]">
            <div className="flex items-start justify-between pb-3 border-b border-[#2e1c52]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/50">
                  <HardDrive className="w-5 h-5 text-[#ec4899]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#faf5ff]">Offline Vault & Storage Health</h3>
                  <p className="text-[11px] text-[#c084fc]">Your Personal Knowledge Base operates 100% offline-first</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-[#0c0714] border border-[#2e1c52]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Network State</span>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs">
                    {!isOnline ? (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400">Disconnected (Offline)</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Connected (Online)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0c0714] border border-[#2e1c52]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Service Worker</span>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active & Precached</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0c0714] border border-[#2e1c52] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Local Notes in Vault:</span>
                  <span className="font-mono font-semibold text-[#faf5ff]">{notes.length} notes</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Directories & Folders:</span>
                  <span className="font-mono font-semibold text-[#faf5ff]">{folders.length} folders</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Storage Provider:</span>
                  <span className="font-mono text-[11px] text-[#c084fc]">localStorage + IDB Sync</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/40 text-[11px] text-[#e9d5ff] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#c084fc] shrink-0 mt-0.5" />
                <span>
                  All your notes, markdown documents, wiki-links, tag taxonomy, and graph relationships are persisted locally on your device. No cloud internet connection is required to create, view, edit, or traverse your notes.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#2e1c52] gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    exportVaultBundle(notes, folders);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2e1c52] hover:bg-[#3d246e] text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#ec4899]" />
                  <span>Quick Export</span>
                </button>

                {onOpenBackupCenter && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      onOpenBackupCenter();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f1338] hover:bg-[#2e1c52] border border-[#2e1c52] text-xs font-medium text-[#ec4899] transition-colors cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-[#ec4899]" />
                    <span>Backup Center</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
