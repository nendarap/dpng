import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PesertaListView } from './components/PesertaListView';
import { PesertaFormView } from './components/PesertaFormView';
import { PesertaDetailModal } from './components/PesertaDetailModal';
import { AdvancedSearchView } from './components/AdvancedSearchView';
import { KategoriView } from './components/KategoriView';
import { ProgramView } from './components/ProgramView';
import { ImportView } from './components/ImportView';
import { ExportView } from './components/ExportView';
import { StatistikView } from './components/StatistikView';
import { UserManagementView } from './components/UserManagementView';
import { LogAktivitasView } from './components/LogAktivitasView';
import { PengaturanView } from './components/PengaturanView';
import { GasSourceModal } from './components/GasSourceModal';
import { LoginView } from './components/LoginView';
import { MapDashboardView } from './components/MapDashboardView';

import { 
  Peserta, Kategori, Program, UserItem, LogAktivitas, SettingApp, UserRole 
} from './types';
import { 
  getPeserta, createPeserta, updatePeserta, deletePeserta,
  getKategori, saveKategori, deleteKategori,
  getProgram, saveProgram, deleteProgram,
  getUsers, saveUser, deleteUser,
  getLogs, getSettings, saveSettings,
  getCurrentUser, setActiveUserRole, initializeDatabaseToDefaults, initLocalStorage,
  isUserLoggedIn, logoutUser
} from './services/storageService';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  // Initialize storage
  useEffect(() => {
    initLocalStorage();
  }, []);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => isUserLoggedIn());

  // Application Data States
  const [currentUser, setCurrentUser] = useState<UserItem>(getCurrentUser());
  const [pesertaList, setPesertaList] = useState<Peserta[]>(getPeserta());
  const [kategoriList, setKategoriList] = useState<Kategori[]>(getKategori());
  const [programList, setProgramList] = useState<Program[]>(getProgram());
  const [users, setUsers] = useState<UserItem[]>(getUsers());
  const [logs, setLogs] = useState<LogAktivitas[]>(getLogs());
  const [settings, setSettings] = useState<SettingApp>(getSettings());

  // UI Navigation States
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);

  // Modal / Selection States
  const [detailPeserta, setDetailPeserta] = useState<Peserta | null>(null);
  const [editPeserta, setEditPeserta] = useState<Peserta | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const refreshAllData = () => {
    setPesertaList(getPeserta());
    setKategoriList(getKategori());
    setProgramList(getProgram());
    setUsers(getUsers());
    setLogs(getLogs());
    setSettings(getSettings());
  };

  // Authentication Handlers
  const handleLoginSuccess = (user: UserItem) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    refreshAllData();
    showToast(`Selamat datang, ${user.nama}!`, 'success');
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    showToast('Anda telah keluar dari aplikasi.', 'success');
  };

  // Role Switcher Handler
  const handleRoleChange = (newRole: UserRole) => {
    const updated = setActiveUserRole(newRole);
    setCurrentUser(updated);
    showToast(`Hak akses simulasi beralih ke: ${newRole}`);
  };

  // Peserta Handlers
  const handleSavePeserta = (data: Partial<Peserta>, bypassDuplicate = false) => {
    if (editPeserta?.id) {
      const res = updatePeserta(editPeserta.id, data);
      if (res.success) {
        showToast(`Data peserta ${res.data?.namaLengkap} berhasil diperbarui!`);
        refreshAllData();
        setEditPeserta(null);
        setActiveTab('peserta');
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } else {
      const res = createPeserta(data as any, bypassDuplicate);
      if (res.success) {
        showToast(`Peserta baru ${res.data?.namaLengkap} (${res.data?.id}) berhasil disimpan!`);
        refreshAllData();
        setActiveTab('peserta');
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message, duplicateInfo: res.duplicateInfo };
    }
  };

  const handleDeletePeserta = (id: string) => {
    const res = deletePeserta(id);
    if (res.success) {
      showToast('Data peserta berhasil dihapus dari database Google Sheets.');
      refreshAllData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Kategori Handlers
  const handleSaveKategori = (kat: Kategori) => {
    saveKategori(kat);
    showToast(`Kategori ${kat.namaKategori} berhasil disimpan!`);
    refreshAllData();
  };

  const handleDeleteKategori = (idKat: string) => {
    deleteKategori(idKat);
    showToast('Kategori berhasil dihapus.');
    refreshAllData();
  };

  // Program Handlers
  const handleSaveProgram = (prog: Program) => {
    saveProgram(prog);
    showToast(`Program ${prog.namaProgram} berhasil disimpan!`);
    refreshAllData();
  };

  const handleDeleteProgram = (idProg: string) => {
    deleteProgram(idProg);
    showToast('Program berhasil dihapus.');
    refreshAllData();
  };

  // User Handlers
  const handleSaveUser = (u: UserItem) => {
    saveUser(u);
    showToast(`User ${u.email} (${u.role}) berhasil disimpan!`);
    refreshAllData();
  };

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId);
    showToast('Pengguna berhasil dihapus.');
    refreshAllData();
  };

  // Settings & Reset DB
  const handleSaveSettings = (newSettings: SettingApp) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Pengaturan aplikasi berhasil disimpan.');
  };

  const handleResetDatabase = () => {
    initializeDatabaseToDefaults();
    refreshAllData();
    showToast('Database Google Sheets berhasil direset ke struktur awal Unpad!');
  };

  // Import Done Handler
  const handleImportDone = (newPeserta: Peserta[]) => {
    const current = getPeserta();
    const merged = [...newPeserta, ...current];
    localStorage.setItem('simpendik_unpad_peserta', JSON.stringify(merged));
    refreshAllData();
    showToast(`${newPeserta.length} data peserta berhasil diimport ke Google Sheets!`);
    setActiveTab('peserta');
  };

  // Render Login View if not logged in
  if (!isLoggedIn) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        
        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
              toast.type === 'success' 
                ? 'bg-[#002B66] text-white border-[#FDB913]' 
                : 'bg-rose-600 text-white border-rose-400'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#FDB913] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
              )}
              <span>{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-white/70 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-[#002B66] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'gas_code') {
              setIsGasModalOpen(true);
            } else {
              if (tab === 'tambah') {
                setEditPeserta(null);
              }
              setActiveTab(tab);
            }
          }}
          userRole={currentUser.role}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardView
              pesertaList={pesertaList}
              kategoriList={kategoriList}
              programList={programList}
              recentLogs={logs}
              onNavigateToPeserta={(filters) => {
                setActiveTab('peserta');
              }}
              onNavigateToTambah={() => {
                setEditPeserta(null);
                setActiveTab('tambah');
              }}
              onNavigateToMap={() => {
                setActiveTab('map_dashboard');
              }}
            />
          )}

          {activeTab === 'map_dashboard' && (
            <MapDashboardView
              pesertaList={pesertaList}
              kategoriList={kategoriList}
              programList={programList}
              onNavigateToPeserta={(filters) => {
                setActiveTab('peserta');
              }}
            />
          )}

          {activeTab === 'peserta' && (
            <PesertaListView
              pesertaList={pesertaList}
              userRole={currentUser.role}
              onViewDetail={(p) => setDetailPeserta(p)}
              onEditPeserta={(p) => {
                setEditPeserta(p);
                setActiveTab('tambah');
              }}
              onDeletePeserta={handleDeletePeserta}
              onNavigateTambah={() => {
                setEditPeserta(null);
                setActiveTab('tambah');
              }}
              onExport={() => setActiveTab('export')}
            />
          )}

          {activeTab === 'tambah' && (
            <PesertaFormView
              initialData={editPeserta}
              kategoriList={kategoriList}
              programList={programList}
              userRole={currentUser.role}
              onSave={handleSavePeserta}
              onCancel={() => {
                setEditPeserta(null);
                setActiveTab('peserta');
              }}
              onViewExisting={(p) => setDetailPeserta(p)}
            />
          )}

          {activeTab === 'kategori' && (
            <KategoriView
              kategoriList={kategoriList}
              pesertaList={pesertaList}
              userRole={currentUser.role}
              onSaveKategori={handleSaveKategori}
              onDeleteKategori={handleDeleteKategori}
            />
          )}

          {activeTab === 'program' && (
            <ProgramView
              programList={programList}
              kategoriList={kategoriList}
              pesertaList={pesertaList}
              userRole={currentUser.role}
              onSaveProgram={handleSaveProgram}
              onDeleteProgram={handleDeleteProgram}
            />
          )}

          {activeTab === 'search' && (
            <AdvancedSearchView
              kategoriList={kategoriList}
              programList={programList}
              userRole={currentUser.role}
              onViewDetail={(p) => setDetailPeserta(p)}
              onEditPeserta={(p) => {
                setEditPeserta(p);
                setActiveTab('tambah');
              }}
            />
          )}

          {activeTab === 'import' && (
            <ImportView
              kategoriList={kategoriList}
              programList={programList}
              onImportDone={handleImportDone}
            />
          )}

          {activeTab === 'export' && (
            <ExportView
              pesertaList={pesertaList}
              kategoriList={kategoriList}
              programList={programList}
            />
          )}

          {activeTab === 'statistik' && (
            <StatistikView
              pesertaList={pesertaList}
              kategoriList={kategoriList}
              programList={programList}
            />
          )}

          {activeTab === 'user' && (
            <UserManagementView
              users={users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'log' && (
            <LogAktivitasView logs={logs} />
          )}

          {activeTab === 'setting' && (
            <PengaturanView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetDatabase={handleResetDatabase}
              onOpenGasModal={() => setIsGasModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Detail Modal */}
      <PesertaDetailModal
        peserta={detailPeserta}
        isOpen={Boolean(detailPeserta)}
        onClose={() => setDetailPeserta(null)}
        userRole={currentUser.role}
        onEdit={(p) => {
          setEditPeserta(p);
          setActiveTab('tambah');
        }}
      />

      {/* Google Apps Script Complete Source Modal */}
      <GasSourceModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border ${
            toast.type === 'success' 
              ? 'bg-[#002B66] text-white border-[#FDB913]' 
              : 'bg-rose-600 text-white border-rose-400'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#FDB913] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/70 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
