/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TiangListrik, 
  LaporanKerusakan, 
  WeatherData, 
  PushNotificationItem, 
  UserAccount,
  DamageTicketStatus,
  RepairAuditLog
} from './types';
import { dbStorage } from './services/dbStorage';
import { weatherService } from './services/weatherService';
import { notificationService } from './services/notificationService';
import { authService } from './services/authService';

// Components
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { PoleDetailModal } from './components/PoleDetailModal';
import { ReportDamageModal } from './components/ReportDamageModal';
import { QrAuditModal } from './components/QrAuditModal';
import { PredictiveAnalyticsView } from './components/PredictiveAnalyticsView';
import { DamageManagementView } from './components/DamageManagementView';
import { ReportsView } from './components/ReportsView';
import { TwoFactorAuthModal } from './components/TwoFactorAuthModal';
import { NotificationCenter } from './components/NotificationCenter';
import { Yii2DockerArchitectureView } from './components/Yii2DockerArchitectureView';

export default function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<string>('map');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Core Data State
  const [poles, setPoles] = useState<TiangListrik[]>([]);
  const [tickets, setTickets] = useState<LaporanKerusakan[]>([]);
  const [weather, setWeather] = useState<WeatherData>(weatherService.getCachedWeather());
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount>(authService.getCurrentUser());

  // Offline State
  const [isOffline, setIsOffline] = useState<boolean>(dbStorage.isOffline());
  const [offlineCount, setOfflineCount] = useState<number>(dbStorage.getOfflineQueueCount());

  // Sound State
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(notificationService.getSoundEnabled());

  // Modal States
  const [selectedPoleForDetail, setSelectedPoleForDetail] = useState<TiangListrik | null>(null);
  const [selectedPoleIdForMap, setSelectedPoleIdForMap] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [poleForReporting, setPoleForReporting] = useState<TiangListrik | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [poleForQrAudit, setPoleForQrAudit] = useState<TiangListrik | null>(null);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState<boolean>(false);

  // Initialize data on mount
  useEffect(() => {
    // Load poles & tickets
    setPoles(dbStorage.getPoles());
    setTickets(dbStorage.getTickets());

    // Subscribe to notifications
    const unsubscribeNotif = notificationService.subscribe((items) => {
      setNotifications(items);
    });

    // Request browser notification permission if available
    notificationService.requestBrowserPermission();

    // Fetch initial live weather
    handleRefreshWeather();

    // Online / Offline window listeners
    const handleOnline = () => {
      setIsOffline(false);
      handleSyncOffline();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeNotif();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Weather Refresh
  const handleRefreshWeather = async () => {
    setIsWeatherLoading(true);
    try {
      const data = await weatherService.fetchRealtimeWeather();
      setWeather(data);
    } catch {
      // Ignored
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Offline Mode Toggle
  const handleToggleOffline = () => {
    const nextVal = dbStorage.toggleSimulatedOffline();
    setIsOffline(nextVal);
    if (!nextVal) {
      handleSyncOffline();
    }
  };

  // Offline Queue Sync
  const handleSyncOffline = async () => {
    const res = await dbStorage.syncOfflineQueue();
    setOfflineCount(0);
    setTickets(dbStorage.getTickets());
    setPoles(dbStorage.getPoles());
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const nextVal = !isSoundEnabled;
    notificationService.setSoundEnabled(nextVal);
    setIsSoundEnabled(nextVal);
  };

  // User switch
  const handleSwitchUser = (userId: string) => {
    const user = authService.switchUser(userId);
    setCurrentUser(user);
  };

  // Submit Damage Report
  const handleSubmitReport = (
    reportData: Omit<LaporanKerusakan, 'id' | 'noTiket' | 'waktuLapor' | 'disinkronkan'>
  ) => {
    dbStorage.createTicket(reportData);
    setTickets(dbStorage.getTickets());
    setPoles(dbStorage.getPoles());
    setOfflineCount(dbStorage.getOfflineQueueCount());
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = (
    ticketId: string,
    status: DamageTicketStatus,
    extra?: { timTeknisi?: string; catatanPerbaikan?: string; materialDigunakan?: string[] }
  ) => {
    dbStorage.updateTicketStatus(ticketId, status, extra);
    setTickets(dbStorage.getTickets());
    setPoles(dbStorage.getPoles());
    setOfflineCount(dbStorage.getOfflineQueueCount());
  };

  // Save Audit Log
  const handleSaveAudit = (poleId: string, log: Omit<RepairAuditLog, 'id'>) => {
    dbStorage.addAuditLog(poleId, log);
    setPoles(dbStorage.getPoles());
    setOfflineCount(dbStorage.getOfflineQueueCount());
  };

  // Select pole from notification or ticket
  const handleLocatePoleOnMap = (poleId: string) => {
    setSelectedPoleIdForMap(poleId);
    setActiveTab('map');
  };

  // Count unread
  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weather={weather}
        onRefreshWeather={handleRefreshWeather}
        isWeatherLoading={isWeatherLoading}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        offlineCount={offlineCount}
        onSyncOffline={handleSyncOffline}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpen2FA={() => setIs2FAModalOpen(true)}
        onOpenNotifications={() => setIsNotifCenterOpen(true)}
        unreadNotifCount={unreadCount}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full overflow-x-hidden">
        {activeTab === 'map' && (
          <MapComponent
            poles={poles}
            selectedPoleId={selectedPoleIdForMap}
            onSelectPole={(pole) => setSelectedPoleForDetail(pole)}
            onReportDamage={(pole) => {
              setPoleForReporting(pole);
              setIsReportModalOpen(true);
            }}
            onScanQr={(pole) => {
              setPoleForQrAudit(pole || null);
              setIsQrModalOpen(true);
            }}
            weather={weather}
          />
        )}

        {activeTab === 'tickets' && (
          <DamageManagementView
            tickets={tickets}
            poles={poles}
            onUpdateStatus={handleUpdateTicketStatus}
            onOpenReportModal={() => {
              setPoleForReporting(null);
              setIsReportModalOpen(true);
            }}
            onLocatePoleOnMap={handleLocatePoleOnMap}
          />
        )}

        {activeTab === 'predictive' && (
          <PredictiveAnalyticsView
            poles={poles}
            weather={weather}
            onSelectPole={(pole) => setSelectedPoleForDetail(pole)}
            onReportDamage={(pole) => {
              setPoleForReporting(pole);
              setIsReportModalOpen(true);
            }}
          />
        )}

        {activeTab === 'qr-audit' && (
          <div className="py-6">
            <QrAuditModal
              poles={poles}
              initialPole={poleForQrAudit}
              isOpen={true}
              onClose={() => setActiveTab('map')}
              onSaveAudit={handleSaveAudit}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportsView poles={poles} tickets={tickets} />
        )}

        {activeTab === 'yii2-docker' && (
          <Yii2DockerArchitectureView />
        )}
      </main>

      {/* Modals */}
      {/* 1. Pole Technical Details & Audit Modal */}
      {selectedPoleForDetail && (
        <PoleDetailModal
          pole={selectedPoleForDetail}
          onClose={() => setSelectedPoleForDetail(null)}
          onReportDamage={(pole) => {
            setSelectedPoleForDetail(null);
            setPoleForReporting(pole);
            setIsReportModalOpen(true);
          }}
          onAddAuditLog={(pole) => {
            setSelectedPoleForDetail(null);
            setPoleForQrAudit(pole);
            setIsQrModalOpen(true);
          }}
        />
      )}

      {/* 2. Real-Time Damage Reporting Modal */}
      {isReportModalOpen && (
        <ReportDamageModal
          poles={poles}
          initialPole={poleForReporting}
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setPoleForReporting(null);
          }}
          onSubmitReport={handleSubmitReport}
          isOffline={isOffline}
        />
      )}

      {/* 3. QR Audit Scanner Modal (when triggered from other tabs) */}
      {isQrModalOpen && activeTab !== 'qr-audit' && (
        <QrAuditModal
          poles={poles}
          initialPole={poleForQrAudit}
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setPoleForQrAudit(null);
          }}
          onSaveAudit={handleSaveAudit}
        />
      )}

      {/* 4. Two-Factor Authentication (2FA) Modal */}
      {is2FAModalOpen && (
        <TwoFactorAuthModal
          isOpen={is2FAModalOpen}
          onClose={() => setIs2FAModalOpen(false)}
          currentUser={currentUser}
          onUserUpdated={(updated) => setCurrentUser(updated)}
        />
      )}

      {/* 5. Real-Time Push Notification Center */}
      {isNotifCenterOpen && (
        <NotificationCenter
          isOpen={isNotifCenterOpen}
          onClose={() => setIsNotifCenterOpen(false)}
          notifications={notifications}
          onMarkAsRead={(id) => notificationService.markAsRead(id)}
          onMarkAllAsRead={() => notificationService.markAllAsRead()}
          onClearAll={() => notificationService.clearAll()}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={handleToggleSound}
          onSelectTicket={(ticketId) => {
            const ticket = tickets.find((t) => t.id === ticketId);
            if (ticket) {
              setActiveTab('tickets');
            }
          }}
        />
      )}
    </div>
  );
}
