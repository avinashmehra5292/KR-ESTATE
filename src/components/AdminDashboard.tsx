import React, { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle, Database, LayoutDashboard, Building, Users, Settings,
  LogOut, Plus, ChevronRight, ChevronDown, Activity, Globe, Phone, MapPin, Sparkles,
  Save, Compass, FileText, Check, AlertCircle, Edit, Trash2, ExternalLink,
  MessageCircle, RefreshCw, Menu, Video, Play, Film, Upload, Search, Bell,
  ArrowUpRight, ArrowUp, Zap, Clock, Calendar, CheckSquare, Layers, Home,
  UploadCloud, FilePlus, Edit3, ShieldCheck
} from 'lucide-react';
import { Property, LocalityInfo, DroneTour } from '../types';
import { NOIDA_PROPERTIES } from '../data/properties';
import { INITIAL_DRONE_TOURS } from '../data/droneTours';
import { AdminPropertyForm } from './AdminPropertyForm';
import { useSiteSettings } from '../context/SiteSettingsContext';
import defaultLocalities from '../data/localities.json';
import { getAdminAuthHeaders, clearAdminAuth } from '../utils/adminAuth';
import { VideoSizeExceededModal } from './VideoSizeExceededModal';

interface AdminDashboardProps {
  onClose: () => void;
}

type AdminTab =
  | 'overview'
  | 'properties'
  | 'drone_tours'
  | 'add_property'
  | 'website_content'
  | 'agency_contact'
  | 'locality_guides'
  | 'inquiries'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { settings, updateSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<'properties' | 'visits' | 'valuations' | null>(null);

  // Top header and overview controls
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceRange, setPerformanceRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [performanceDropdownOpen, setPerformanceDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kr_admin_read_notif_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const adminNotifications: { id: string; title: string; subtitle: string; tab: AdminTab }[] = [
    {
      id: 'lead-whatsapp-eon',
      title: 'New lead from WhatsApp',
      subtitle: 'Inquiry on EON Fairfox • 2 min ago',
      tab: 'inquiries',
    },
    {
      id: 'tour-4k-active',
      title: '4K Drone Tour Active',
      subtitle: 'Vertical 4K walkthrough uploaded • 25 min ago',
      tab: 'drone_tours',
    },
    {
      id: 'seo-audit-done',
      title: 'SEO Audit Complete',
      subtitle: 'Score 98/100 • 1 hour ago',
      tab: 'settings',
    },
  ];

  const unreadNotifsCount = adminNotifications.filter(n => !readNotifIds.includes(n.id)).length;

  const handleMarkAllNotificationsRead = () => {
    const allIds = adminNotifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('kr_admin_read_notif_ids', JSON.stringify(allIds));
    } catch { }
  };

  const handleNotificationClick = (notif: { id: string; tab: AdminTab }) => {
    if (!readNotifIds.includes(notif.id)) {
      const updated = [...readNotifIds, notif.id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('kr_admin_read_notif_ids', JSON.stringify(updated));
      } catch { }
    }
    setActiveTab(notif.tab);
    setNotificationsOpen(false);
  };

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Time-aware dynamic greeting & formatted date/time
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  const [timeGreeting, setTimeGreeting] = useState<string>(getTimeGreeting);
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  });
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeGreeting(getTimeGreeting());
      setCurrentDateFormatted(now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }));
      setCurrentTimeFormatted(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Status message for saves
  const [saveStatus, setSaveStatus] = useState<{ tab: string; message: string; isError?: boolean } | null>(null);

  // Property list & Drone Tours state
  const [propertiesList, setPropertiesList] = useState<Property[]>(NOIDA_PROPERTIES);
  const [droneToursList, setDroneToursList] = useState<DroneTour[]>(INITIAL_DRONE_TOURS);
  const [editingDroneTourId, setEditingDroneTourId] = useState<string | null>(null);
  const [droneTourModalOpen, setDroneTourModalOpen] = useState(false);
  const [droneTourForm, setDroneTourForm] = useState({
    title: '',
    sector: 'Noida Expressway & Sector 150 Corridor',
    locality: 'Expressway Growth Hub',
    videoUrl: '',
    thumbnailUrl: '',
    duration: '02:45',
    description: '',
    altitude: '180M • 4K 60FPS',
    badge: 'Master Corridor · 4K 60FPS',
    isFeatured: false
  });
  const [isUploadingDroneVideo, setIsUploadingDroneVideo] = useState(false);
  const [droneUploadStatus, setDroneUploadStatus] = useState('');
  const [droneActionLoading, setDroneActionLoading] = useState(false);
  const [previewDroneVideo, setPreviewDroneVideo] = useState<{ title: string; videoUrl: string; duration?: string; description?: string } | null>(null);
  const [isPreviewPortrait, setIsPreviewPortrait] = useState(false);
  const [deletingDroneTourId, setDeletingDroneTourId] = useState<string | null>(null);
  const droneFileInputRef = useRef<HTMLInputElement>(null);
  const droneUrlInputRef = useRef<HTMLInputElement>(null);
  const [sizeExceededModal, setSizeExceededModal] = useState<{
    isOpen: boolean;
    sizeMb: number;
    fileName: string;
  }>({
    isOpen: false,
    sizeMb: 0,
    fileName: ''
  });

  // Forms for Website Content
  const [heroForm, setHeroForm] = useState(settings.hero);
  const [statsForm, setStatsForm] = useState(settings.stats);
  const [agencyForm, setAgencyForm] = useState(settings.agency);
  const [seoForm, setSeoForm] = useState(settings.seo);

  // Sync with context settings when they load
  useEffect(() => {
    setHeroForm(settings.hero);
    setStatsForm(settings.stats);
    setAgencyForm(settings.agency);
    setSeoForm(settings.seo);
  }, [settings]);

  // Locality Guides state
  const [localitiesList, setLocalitiesList] = useState<LocalityInfo[]>(defaultLocalities as LocalityInfo[]);
  const [selectedLocalityIdx, setSelectedLocalityIdx] = useState(0);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  // Brochure Inquiries state
  const [brochureLeads, setBrochureLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [passwordTotp, setPasswordTotp] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState('');

  // TOTP Setup state
  const [setupTotpData, setSetupTotpData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [setupToken, setSetupToken] = useState('');
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [setupError, setSetupError] = useState('');

  // Fetch localities on mount
  useEffect(() => {
    fetch('/api/localities')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLocalitiesList(data);
        }
      })
      .catch(() => { });

    // Also preload brochure & site leads count and live properties
    fetchBrochureLeads();
    refreshPropertiesList();
    fetchDroneTours();
  }, []);

  // Fetch properties and sync on mount
  const refreshPropertiesList = async () => {
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPropertiesList(data);
        }
      }
    } catch {
      // Keep static NOIDA_PROPERTIES
    }
  };

  // Fetch standalone Drone Tours on mount
  const fetchDroneTours = async () => {
    try {
      const res = await fetch('/api/drone-tours');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDroneToursList(data);
        }
      }
    } catch {
      // Keep static INITIAL_DRONE_TOURS
    }
  };

  // Drone Tours Action Handlers (Completely standalone - no property coupling)
  const handleOpenAddDroneTour = (existingTour?: DroneTour) => {
    if (existingTour) {
      setEditingDroneTourId(existingTour.id);
      setDroneTourForm({
        title: existingTour.title,
        sector: existingTour.sector || 'Noida Expressway & Sector 150 Corridor',
        locality: existingTour.locality || 'Expressway Growth Hub',
        videoUrl: existingTour.videoUrl,
        thumbnailUrl: existingTour.thumbnailUrl || '/corridor-expressway.jpg',
        duration: existingTour.duration || '02:45',
        description: existingTour.description || '',
        altitude: existingTour.altitude || '180M • 4K 60FPS',
        badge: existingTour.badge || 'Master Corridor · 4K 60FPS',
        isFeatured: Boolean(existingTour.isFeatured)
      });
    } else {
      setEditingDroneTourId(null);
      setDroneTourForm({
        title: '',
        sector: 'Noida Expressway & Sector 150 Corridor',
        locality: 'Expressway Growth Hub',
        videoUrl: '',
        thumbnailUrl: '/corridor-expressway.jpg',
        duration: '02:45',
        description: 'Comprehensive 4K aerial drone survey capturing master corridors, arterial sector roads, and regional growth masterplan developments.',
        altitude: '180M • 4K 60FPS',
        badge: 'Master Corridor · 4K 60FPS',
        isFeatured: false
      });
    }
    setDroneUploadStatus('');
    setDroneTourModalOpen(true);
  };

  const handleSaveDroneTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!droneTourForm.title.trim()) {
      alert('Please enter a Title for the drone tour.');
      return;
    }
    if (!droneTourForm.videoUrl.trim()) {
      alert('Please provide a video URL or upload an MP4/WebM video file.');
      return;
    }

    setDroneActionLoading(true);
    try {
      const isEdit = Boolean(editingDroneTourId);
      const url = isEdit ? `/api/admin/drone-tours/${editingDroneTourId}` : '/api/admin/drone-tours';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(droneTourForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (isEdit) {
          setDroneToursList(prev => prev.map(t => t.id === editingDroneTourId ? data.droneTour : t));
        } else {
          setDroneToursList(prev => [...prev, data.droneTour]);
        }
        setDroneTourModalOpen(false);
        setSaveStatus({ tab: 'drone_tours', message: `Drone Tour "${data.droneTour?.title || droneTourForm.title}" successfully published!` });
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        alert(data.error || 'Failed to save drone tour');
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving drone tour');
    } finally {
      setDroneActionLoading(false);
    }
  };

  const handleDeleteDroneTour = async (tourId: string, tourTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the Drone Tour "${tourTitle}"?\n\nThis will remove it from the Drone Tours & Aerial Showcase.`)) {
      return;
    }

    setDeletingDroneTourId(tourId);
    try {
      const res = await fetch(`/api/admin/drone-tours/${tourId}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDroneToursList(prev => prev.filter(t => t.id !== tourId));
        setSaveStatus({ tab: 'drone_tours', message: `Drone Tour "${tourTitle}" deleted!` });
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        alert(data.error || 'Failed to delete drone tour');
      }
    } catch (err: any) {
      alert(err.message || 'Network error deleting drone tour');
    } finally {
      setDeletingDroneTourId(null);
    }
  };

  const handleUploadDroneFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > 50) {
      setSizeExceededModal({
        isOpen: true,
        sizeMb: fileSizeMb,
        fileName: file.name
      });
      setDroneUploadStatus(`File is too large (${fileSizeMb.toFixed(1)} MB). Direct upload is limited to 50MB. Please paste a YouTube or Google Drive link below.`);
      if (droneFileInputRef.current) droneFileInputRef.current.value = '';
      return;
    }

    setIsUploadingDroneVideo(true);
    setDroneUploadStatus(`Preparing ${file.name} (${fileSizeMb.toFixed(1)} MB)...`);

    try {
      // 1. Request signed cloud upload URL from server
      const slotRes = await fetch('/api/admin/get-video-upload-url', {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ name: file.name, size: file.size })
      });

      const slotData = await slotRes.json().catch(() => null);
      if (!slotRes.ok || !slotData?.success) {
        throw new Error(slotData?.error || `Failed to initiate video upload (HTTP ${slotRes.status})`);
      }

      let finalVideoUrl = '';

      if (slotData.directUpload && slotData.signedUrl) {
        // Direct binary upload to Supabase Storage:
        // Completely bypasses Render reverse proxy limits and RAM constraints!
        setDroneUploadStatus(`Uploading ${file.name} directly to cloud storage (${fileSizeMb.toFixed(1)} MB)...`);

        const uploadRes = await fetch(slotData.signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'video/mp4'
          },
          body: file
        });

        if (!uploadRes.ok) {
          if (uploadRes.status === 413) {
            setSizeExceededModal({
              isOpen: true,
              sizeMb: fileSizeMb,
              fileName: file.name
            });
            throw new Error(`Video file exceeds cloud storage size limit (50MB). Please paste a YouTube or Google Drive link.`);
          }
          let errDetail = `HTTP ${uploadRes.status}`;
          try {
            const errJson = await uploadRes.json();
            if (errJson?.message) errDetail = errJson.message;
            else if (errJson?.error) errDetail = errJson.error;
          } catch {
            const errText = await uploadRes.text().catch(() => '');
            if (errText) errDetail = errText;
          }
          throw new Error(`Cloud upload failed (${errDetail}). Please try again or paste a video link.`);
        }

        finalVideoUrl = slotData.publicUrl;
      } else {
        // Fallback for local development if Supabase not configured
        setDroneUploadStatus(`Uploading ${file.name} to server (${fileSizeMb.toFixed(1)} MB)...`);
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(file);

        const base64 = await base64Promise;
        const res = await fetch('/api/admin/upload-video', {
          method: 'POST',
          headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ name: file.name, base64 })
        });

        const contentType = res.headers.get('content-type') || '';
        let data: any = null;
        if (contentType.includes('application/json')) {
          try {
            data = await res.json();
          } catch {
            data = null;
          }
        }

        if (!res.ok || !data?.success) {
          if (res.status === 413) {
            throw new Error(`Video file is too large (${fileSizeMb.toFixed(1)} MB). Please compress to under 50MB or paste a video link.`);
          }
          throw new Error(data?.error || `Upload failed (HTTP ${res.status}). Please try again or paste a link.`);
        }

        finalVideoUrl = data.videoUrl;
      }

      setDroneTourForm(prev => ({
        ...prev,
        videoUrl: finalVideoUrl
      }));
      setDroneUploadStatus(`Video uploaded successfully! (${fileSizeMb.toFixed(1)} MB)`);
      setTimeout(() => setDroneUploadStatus(''), 4000);
    } catch (err: any) {
      console.error(err);
      if (fileSizeMb > 50 || err.message?.toLowerCase().includes('50mb') || err.message?.toLowerCase().includes('too large') || err.message?.toLowerCase().includes('exceeds')) {
        setSizeExceededModal({
          isOpen: true,
          sizeMb: fileSizeMb,
          fileName: file.name
        });
      }
      setDroneUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setIsUploadingDroneVideo(false);
      if (droneFileInputRef.current) droneFileInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
    } catch {
      // Ignore network errors on logout
    }
    clearAdminAuth();
    onClose();
  };

  // Fetch brochure leads when inquiries tab opened or refresh button clicked
  const fetchBrochureLeads = async () => {
    setLoadingLeads(true);
    try {
      const minSpinPromise = new Promise(resolve => setTimeout(resolve, 850));
      const fetchPromise = fetch('/api/admin/brochure-requests', {
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
      const [res] = await Promise.all([fetchPromise, minSpinPromise]);
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBrochureLeads(data);
          const now = new Date();
          setLastRefreshedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead inquiry?')) return;
    try {
      const res = await fetch(`/api/admin/brochure-requests/${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setBrochureLeads(prev => prev.filter(l => l.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllLeads = async () => {
    if (!window.confirm('Are you sure you want to clear all lead inquiries? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/brochure-requests', {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setBrochureLeads([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'inquiries') {
      fetchBrochureLeads();
    }
  }, [activeTab]);

  // Handle Save Website Content (Hero & Stats)
  const handleSaveWebsiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus({ tab: 'website_content', message: 'Saving website content...' });
    const result = await updateSettings({ hero: heroForm, stats: statsForm });
    if (result.success) {
      setSaveStatus({ tab: 'website_content', message: 'Hero & stats updated successfully!' });
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus({ tab: 'website_content', message: result.error || 'Failed to save', isError: true });
    }
  };

  // Handle Save Agency Settings
  const handleSaveAgencySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus({ tab: 'agency_contact', message: 'Saving agency & contact info...' });
    const result = await updateSettings({ agency: agencyForm });
    if (result.success) {
      setSaveStatus({ tab: 'agency_contact', message: 'Agency details & phone updated live!' });
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus({ tab: 'agency_contact', message: result.error || 'Failed to save', isError: true });
    }
  };

  // Handle Save SEO & Global Portal Settings
  const handleSaveSeoSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus({ tab: 'settings', message: 'Saving SEO & branding...' });
    const result = await updateSettings({ seo: seoForm });
    if (result.success) {
      setSaveStatus({ tab: 'settings', message: 'SEO metadata updated successfully!' });
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus({ tab: 'settings', message: result.error || 'Failed to save', isError: true });
    }
  };

  // Handle Save Locality Guide
  const handleSaveLocality = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLocalities(true);
    setSaveStatus({ tab: 'locality_guides', message: 'Saving locality guides...' });
    try {
      const res = await fetch('/api/admin/localities', {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(localitiesList)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus({ tab: 'locality_guides', message: 'Noida locality guide updated live!' });
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus({ tab: 'locality_guides', message: data.error || 'Failed to save guide', isError: true });
      }
    } catch (err: any) {
      setSaveStatus({ tab: 'locality_guides', message: err.message || 'Network error', isError: true });
    } finally {
      setLoadingLocalities(false);
    }
  };

  const handleUpdateCurrentLocality = (field: keyof LocalityInfo, val: any) => {
    setLocalitiesList(prev => {
      const copy = [...prev];
      const targetIdx = (selectedLocalityIdx >= 0 && selectedLocalityIdx < copy.length) ? selectedLocalityIdx : 0;
      if (!copy[targetIdx]) return prev;
      const current = { ...copy[targetIdx], [field]: val };
      if (field === 'name') {
        const slugVal = String(val).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (current.id.startsWith('corridor-') || !current.slug) {
          current.slug = slugVal || current.id;
        }
      }
      copy[targetIdx] = current;
      return copy;
    });
  };

  const handleCreateNewLocality = () => {
    const newId = `corridor-${Date.now()}`;
    const newLocality: LocalityInfo = {
      id: newId,
      name: 'New Noida Micro-Market',
      slug: `corridor-${Date.now()}`,
      subtitle: 'Emerging Growth & High-Yield Corridor',
      description: 'Strategic appraisal of Noida growth catalysts, infrastructure connectivity, and regional advantages.',
      avgPricePerSqFt: '₹12,000 – ₹18,000 / sq.ft',
      projectedGrowth3Yr: '+30% Capital Appreciation',
      highlights: [
        'Direct multi-lane expressway & transit connectivity',
        'Upcoming metro linkage & key infrastructural hub',
        'High rental yields driven by commercial grade-A absorption'
      ],
      metroConnectivity: 'Aqua Line / Dedicated Transit Corridor link',
      landmarkAttractions: ['Major Expressway Belt', 'Commercial Tech Zone'],
      topProjects: ['Signature Living Developments']
    };
    setLocalitiesList(prev => {
      const nextList = [...prev, newLocality];
      setSelectedLocalityIdx(nextList.length - 1);
      return nextList;
    });
  };

  const handleDeleteLocality = (idxToDelete: number) => {
    if (localitiesList.length <= 1) {
      alert('You must have at least one corridor listed.');
      return;
    }
    const target = localitiesList[idxToDelete];
    if (window.confirm(`Are you sure you want to remove the "${target?.name || 'selected'}" corridor? Click "Save All Locality Guides" afterward to persist changes.`)) {
      setLocalitiesList(prev => {
        const nextList = prev.filter((_, idx) => idx !== idxToDelete);
        setSelectedLocalityIdx(Math.max(0, Math.min(idxToDelete, nextList.length - 1)));
        return nextList;
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus('loading');

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ newPassword, token: passwordTotp })
      });
      const data = await res.json();

      if (data.success) {
        setPasswordStatus('success');
        setNewPassword('');
        setTimeout(() => setPasswordStatus('idle'), 3000);
      } else {
        setPasswordStatus('error');
        setPasswordError(data.error);
      }
    } catch (err: any) {
      setPasswordStatus('error');
      setPasswordError(err.message);
    }
  };

  const handleBeginTotpSetup = async () => {
    try {
      const res = await fetch('/api/admin/totp-generate', {
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.secret && data.qrCodeUrl) {
        setSetupTotpData(data);
        setSetupStatus('idle');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmTotpSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupStatus('loading');
    setSetupError('');
    try {
      const res = await fetch('/api/admin/totp-setup', {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ secret: setupTotpData?.secret, token: setupToken })
      });
      const data = await res.json();
      if (data.success) {
        setSetupStatus('success');
        setTimeout(() => setSetupTotpData(null), 2000);
      } else {
        setSetupStatus('error');
        setSetupError(data.error || 'Invalid code');
      }
    } catch (err) {
      setSetupStatus('error');
      setSetupError('Network error');
    }
  };

  const handleDeleteProperty = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove the listing from the codebase.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error || 'Failed to delete property');
      }
    } catch (err: any) {
      alert(err.message || 'Network error deleting property');
    } finally {
      setDeletingId(null);
    }
  };

  const activeLocality = localitiesList[selectedLocalityIdx] || localitiesList[0];

  return (
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full z-50 flex bg-[#F4F6F9] text-slate-900 admin-panel animate-in fade-in duration-300 overflow-hidden font-sans">

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-[100dvh] max-h-[100dvh] bg-[#0B132B] text-slate-300 flex flex-col border-r border-[#152142] transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:h-full lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-5 border-b border-[#152142] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight block text-base leading-tight">
                KR Estate
              </span>
              <span className="text-[11px] text-slate-400 font-medium block">
                Admin Panel
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overscroll-contain">
          {/* Dashboard */}
          <button
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          {/* Properties */}
          <button
            onClick={() => {
              setEditingProperty(null);
              setActiveTab('properties');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'properties' || activeTab === 'add_property'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 shrink-0" />
              <span>Properties</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
              {propertiesList.length}
            </span>
          </button>

          {/* 4K Drone Tours */}
          <button
            onClick={() => { setActiveTab('drone_tours'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'drone_tours'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 shrink-0" />
              <span>4K Drone Tours</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
              {droneToursList.length}
            </span>
          </button>

          {/* Hero & Web Content */}
          <button
            onClick={() => { setActiveTab('website_content'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'website_content'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Hero &amp; Web Content</span>
          </button>

          {/* Agency & Contact Info */}
          <button
            onClick={() => { setActiveTab('agency_contact'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'agency_contact'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Agency &amp; Contact Info</span>
          </button>

          {/* Noida Locality Guides */}
          <button
            onClick={() => { setActiveTab('locality_guides'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'locality_guides'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>Noida Locality Guides</span>
          </button>

          {/* Brochure & Site Leads */}
          <button
            onClick={() => { setActiveTab('inquiries'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Brochure &amp; Site Leads</span>
            </div>
            {brochureLeads.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                {brochureLeads.length}
              </span>
            )}
          </button>

          {/* Security & SEO Portal */}
          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#059669] text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Security &amp; SEO Portal</span>
          </button>
        </nav>

        {/* User Profile Bar in Sidebar Bottom */}
        <div className="p-3 border-t border-[#152142] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              KA
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white leading-tight truncate">KR Admin</div>
              <div className="text-[10px] text-slate-400 truncate">Super Admin</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out / Exit"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full max-h-[100dvh] overflow-hidden min-w-0">

        {/* Top Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full max-w-sm sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search properties, tours, leads, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-medium rounded-xl border border-slate-200/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Live Synced Status */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Synced</span>
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-in zoom-in-50 duration-200">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="fixed left-3 right-3 top-[68px] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-w-sm mx-auto sm:max-w-none bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-3.5 z-50 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>Notifications</span>
                        {unreadNotifsCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold transition-all">
                            {unreadNotifsCount} new
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold flex items-center gap-1 transition-all">
                            <Check className="w-2.5 h-2.5" />
                            All caught up
                          </span>
                        )}
                      </div>
                      {unreadNotifsCount > 0 ? (
                        <button
                          type="button"
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer hover:underline transition-colors"
                          onClick={handleMarkAllNotificationsRead}
                        >
                          Mark read
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">All read</span>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 pt-1">
                      {adminNotifications.map((notif) => {
                        const isUnread = !readNotifIds.includes(notif.id);
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`py-2.5 px-2 rounded-xl transition-all cursor-pointer group ${
                              isUnread ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                {notif.title}
                              </span>
                              {isUnread ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              ) : (
                                <Check className="w-3 h-3 text-emerald-600" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{notif.subtitle}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  KA
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">KR Admin</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50 text-xs animate-in fade-in duration-150">
                    <button
                      onClick={() => { setActiveTab('settings'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Portal Settings
                    </button>
                    <button
                      onClick={() => { window.open('/', '_blank'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Live Site
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => { handleLogout(); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Exit Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 overscroll-contain">

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Row 1: Greeting & Decorative Hero Card Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">{timeGreeting}, KR Admin 👋</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    Dashboard Overview
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Here's what's happening with your real estate platform today.
                  </p>
                </div>

                <div className="flex items-center gap-4 self-start md:self-auto">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-slate-600">{currentDateFormatted}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{currentTimeFormatted}</div>
                  </div>

                  {/* Curated Real Estate Simplified Banner */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-50/80 via-teal-50 to-sky-50 border border-emerald-200/70 p-2 sm:px-3 sm:py-2 flex items-center gap-3 shadow-xs">
                    <img
                      src="/images/properties/prop-1791396945692/prop-1791396945692-01.jpg"
                      alt="Modern Towers"
                      className="w-16 h-12 rounded-xl object-cover shadow-xs shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/properties/godrej-woods-sec43/godrej-woods-sec43-1.jpg';
                      }}
                    />
                    <div>
                      <span className="font-serif italic text-emerald-800 font-bold text-xs sm:text-sm block leading-tight">
                        Real Estate Simplified ✨
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                        Noida Growth Hub &bull; Sector 140A - 150
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: The 4 Top KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                
                {/* 1. Total Properties */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">Total Properties</span>
                    <div className="flex items-end justify-between mt-1">
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {propertiesList.length}
                      </div>
                      {/* Sparkline Blue */}
                      <svg className="w-16 h-7 overflow-visible hidden sm:block" viewBox="0 0 64 28" fill="none">
                        <path
                          d="M2 24 C 18 24, 24 14, 38 16 C 48 18, 52 6, 62 4"
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('properties')}
                    className="text-[11px] sm:text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 mt-2.5 sm:mt-4 text-left cursor-pointer"
                  >
                    <span>View all</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* 2. 4K Drone Tours */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">4K Drone Tours</span>
                    <div className="flex items-end justify-between mt-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          {droneToursList.length}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                          Active
                        </span>
                      </div>
                      {/* Sparkline Purple */}
                      <svg className="w-16 h-7 overflow-visible hidden sm:block" viewBox="0 0 64 28" fill="none">
                        <path
                          d="M2 20 C 16 24, 26 10, 38 18 C 46 24, 52 12, 62 8"
                          stroke="#A855F7"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('drone_tours')}
                    className="text-[11px] sm:text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-2.5 sm:mt-4 text-left cursor-pointer"
                  >
                    <span>Manage</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* 3. Brochure & Site Inquiries */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">Inquiries</span>
                    <div className="flex items-end justify-between mt-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          {brochureLeads.length > 0 ? brochureLeads.length : 16}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 hidden xs:inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Live</span>
                        </span>
                      </div>
                      {/* Sparkline Amber */}
                      <svg className="w-16 h-7 overflow-visible hidden sm:block" viewBox="0 0 64 28" fill="none">
                        <path
                          d="M2 24 C 16 24, 28 22, 38 16 C 48 8, 54 12, 62 4"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('inquiries')}
                    className="text-[11px] sm:text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-2.5 sm:mt-4 text-left cursor-pointer"
                  >
                    <span>View all</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {/* 4. Website Live Modules */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">Live Status</span>
                    <div className="flex items-end justify-between mt-1">
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">100%</div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">All active</div>
                      </div>
                      {/* Sparkline Emerald */}
                      <svg className="w-16 h-7 overflow-visible hidden sm:block" viewBox="0 0 64 28" fill="none">
                        <path
                          d="M2 22 C 18 22, 28 18, 38 12 C 48 6, 56 10, 62 4"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('website_content')}
                    className="text-[11px] sm:text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2.5 sm:mt-4 text-left cursor-pointer"
                  >
                    <span>Manage</span>
                    <span>&rarr;</span>
                  </button>
                </div>

              </div>

              {/* Row 3: Main Dashboard Content (Left 8 cols, Right 4 cols) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Center / Left Column (8 Columns) */}
                <div className="xl:col-span-8 space-y-6">
                  
                  {/* Row: Quick Content Updates + Recent Properties in Portfolio */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* CARD: Quick Content Updates */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md text-amber-500">
                              <Zap className="w-4 h-4 fill-amber-500" />
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">Quick Content Updates</h3>
                          </div>
                          <button
                            onClick={() => setActiveTab('website_content')}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
                          >
                            View all &rarr;
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          Manage your website content, listings and communication tools.
                        </p>

                        {/* 2x3 Grid of Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          
                          {/* 1. Add New Property Listing */}
                          <div
                            onClick={() => { setEditingProperty(null); setActiveTab('add_property'); }}
                            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                                <Home className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-700">Add New Property Listing</div>
                                <div className="text-[10px] text-slate-400 truncate">With video &amp; amenities</div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                          </div>

                          {/* 2. Manage 4K Drone Tours */}
                          <div
                            onClick={() => setActiveTab('drone_tours')}
                            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <Video className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-700">Manage 4K Drone Tours</div>
                                <div className="text-[10px] text-slate-400 truncate">Add, upload or delete</div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                          </div>

                          {/* 3. Edit Hero Headline & Banner */}
                          <div
                            onClick={() => setActiveTab('website_content')}
                            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-700">Edit Hero Headline &amp; Banner</div>
                                <div className="text-[10px] text-slate-400 truncate">Update homepage content</div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                          </div>

                          {/* 4. Update WhatsApp Number & Phone */}
                          <div
                            onClick={() => setActiveTab('agency_contact')}
                            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-700">Update WhatsApp Number</div>
                                <div className="text-[10px] text-slate-400 truncate">&amp; Agency Phone Hotline</div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                          </div>

                          {/* 5. Edit Noida Locality Guides */}
                          <div
                            onClick={() => setActiveTab('locality_guides')}
                            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                <Compass className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-700">Edit Noida Locality Guides</div>
                                <div className="text-[10px] text-slate-400 truncate">Manage locality information</div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                          </div>

                          {/* 6. Edit Brochure & Corridor Guides */}
                          <div
                            onClick={() => setActiveTab('website_content')}
                            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-800 truncate group-hover:text-emerald-700">Edit Brochure &amp; Corridor Guides</div>
                                <div className="text-[10px] text-slate-400 truncate">Update PDFs and guides</div>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* CARD: Recent Properties in Portfolio */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md text-emerald-600">
                              <Building className="w-4 h-4" />
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">Recent Properties in Portfolio</h3>
                          </div>
                          <button
                            onClick={() => setActiveTab('properties')}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
                          >
                            View all &rarr;
                          </button>
                        </div>

                        {/* Property List matching screenshot */}
                        <div className="space-y-3">
                          
                          {/* Property 1: EON Fairfox */}
                          <div className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src="/images/properties/prop-1791396945692/prop-1791396945692-01.jpg"
                                alt="EON Fairfox"
                                className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/properties/godrej-woods-sec43/godrej-woods-sec43-1.jpg';
                                }}
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">EON Fairfox</h4>
                                <p className="text-[11px] text-slate-400 truncate">
                                  Sector 140A, Noida-Greater Noida Expressway Infra Private Limited
                                </p>
                                <span className="font-semibold text-xs text-slate-700 block mt-0.5">₹65 Lakhs - ₹4.80 Cr</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const prop = propertiesList.find(p => p.id === 'prop-1791396945692' || p.title.toLowerCase().includes('fairfox')) || propertiesList[0];
                                setEditingProperty(prop);
                                setActiveTab('add_property');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer shrink-0"
                            >
                              Edit
                            </button>
                          </div>

                          {/* Property 2: GYGY MENTIS */}
                          <div className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src="/images/properties/bhutani-cyberthum-sec140a/bhutani-cyberthum-sec140a-1.jpg"
                                alt="GYGY MENTIS"
                                className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/properties/godrej-woods-sec43/godrej-woods-sec43-1.jpg';
                                }}
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">GYGY MENTIS</h4>
                                <p className="text-[11px] text-slate-400 truncate">
                                  Noida Sector 140 &bull; GYGY GROUPS
                                </p>
                                <span className="font-semibold text-xs text-slate-700 block mt-0.5">₹45 Lakhs - ₹3.50 Cr</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const prop = propertiesList.find(p => p.title.toLowerCase().includes('gygy') || p.title.toLowerCase().includes('mentis')) || propertiesList[1];
                                setEditingProperty(prop);
                                setActiveTab('add_property');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer shrink-0"
                            >
                              Edit
                            </button>
                          </div>

                          {/* Property 3: Cleo County */}
                          <div className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src="/images/properties/cleo-county-sec121/cleo-county-sec121-1.jpg"
                                alt="Cleo County"
                                className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/properties/godrej-woods-sec43/godrej-woods-sec43-1.jpg';
                                }}
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">Cleo County</h4>
                                <p className="text-[11px] text-slate-400 truncate">
                                  Sector 121 &bull; County Group
                                </p>
                                <span className="font-semibold text-xs text-slate-700 block mt-0.5">₹1.95 Cr - ₹3.60 Cr</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const prop = propertiesList.find(p => p.id === 'cleo-county-sec121' || p.title.toLowerCase().includes('cleo')) || propertiesList[2];
                                setEditingProperty(prop);
                                setActiveTab('add_property');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer shrink-0"
                            >
                              Edit
                            </button>
                          </div>

                          {/* Property 4: Jewar Aerocity Freehold Plots */}
                          <div className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src="/images/properties/yeida-jewar-aerocity-plots/yeida-jewar-aerocity-plots-1.jpg"
                                alt="Jewar Aerocity Freehold Plots"
                                className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/properties/godrej-woods-sec43/godrej-woods-sec43-1.jpg';
                                }}
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 truncate">Jewar Aerocity Freehold Plots</h4>
                                <p className="text-[11px] text-slate-400 truncate">
                                  Sector 22D &amp; Sector 18 &bull; YEIDA &amp; Certified KR Estate Partners
                                </p>
                                <span className="font-semibold text-xs text-slate-700 block mt-0.5">₹65 Lakhs - ₹2.40 Cr</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const prop = propertiesList.find(p => p.id === 'yeida-jewar-aerocity-plots' || p.title.toLowerCase().includes('jewar')) || propertiesList[3];
                                setEditingProperty(prop);
                                setActiveTab('add_property');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer shrink-0"
                            >
                              Edit
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Row: Property Performance + Top Localities */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* CARD: Property Performance Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                      <div>
                        {/* Header with Dropdown */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-slate-700" />
                            <h3 className="font-bold text-sm text-slate-900">Property Performance</h3>
                          </div>
                          
                          <div className="relative">
                            <button
                              onClick={() => setPerformanceDropdownOpen(!performanceDropdownOpen)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>{performanceRange === '7d' ? 'Last 7 Days' : performanceRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}</span>
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            </button>

                            {performanceDropdownOpen && (
                              <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl border border-slate-200 shadow-lg p-1 z-30 text-xs">
                                <button
                                  onClick={() => { setPerformanceRange('7d'); setPerformanceDropdownOpen(false); }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg ${performanceRange === '7d' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
                                >
                                  Last 7 Days
                                </button>
                                <button
                                  onClick={() => { setPerformanceRange('30d'); setPerformanceDropdownOpen(false); }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg ${performanceRange === '30d' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
                                >
                                  Last 30 Days
                                </button>
                                <button
                                  onClick={() => { setPerformanceRange('90d'); setPerformanceDropdownOpen(false); }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg ${performanceRange === '90d' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-100 text-slate-700'}`}
                                >
                                  Last 90 Days
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Performance Metric Counters */}
                        <div className="grid grid-cols-4 gap-2 py-2 border-y border-slate-100 mb-3 text-center sm:text-left">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Views</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900">8,540</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">&uarr; 12%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Inquiries</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900">428</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">&uarr; 18%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Site Visits</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900">162</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">&uarr; 24%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Conversions</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900">48</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">&uarr; 16%</span>
                            </div>
                          </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center justify-end gap-3 text-[11px] text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                            <span>Views</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                            <span>Inquiries</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            <span>Conversions</span>
                          </span>
                        </div>

                        {/* Multi-Bar Grouped Chart */}
                        <div className="relative pt-2">
                          <div className="flex items-end gap-2 sm:gap-4 h-36 border-b border-slate-200 pb-1">
                            {/* Y Axis Guide */}
                            <div className="flex flex-col justify-between h-full text-[9px] font-mono text-slate-400 pr-1 select-none">
                              <span>1,000</span>
                              <span>750</span>
                              <span>500</span>
                              <span>250</span>
                              <span>0</span>
                            </div>

                            {/* Daily Bar Groups */}
                            <div className="flex-1 flex justify-between items-end h-full relative">
                              {/* Horizontal Dotted Lines */}
                              <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-100 pointer-events-none" />
                              <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 pointer-events-none" />
                              <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 pointer-events-none" />
                              <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 pointer-events-none" />

                              {[
                                { label: 'Sep 26', views: 380, inquiries: 220, conversions: 110, vH: '48%', iH: '28%', cH: '14%' },
                                { label: 'Sep 27', views: 620, inquiries: 360, conversions: 170, vH: '68%', iH: '42%', cH: '20%' },
                                { label: 'Sep 28', views: 760, inquiries: 440, conversions: 220, vH: '80%', iH: '50%', cH: '26%' },
                                { label: 'Sep 29', views: 680, inquiries: 390, conversions: 190, vH: '74%', iH: '46%', cH: '22%' },
                                { label: 'Sep 30', views: 820, inquiries: 510, conversions: 240, vH: '88%', iH: '58%', cH: '28%' },
                                { label: 'Oct 01', views: 960, inquiries: 590, conversions: 310, vH: '98%', iH: '68%', cH: '35%' },
                                { label: 'Oct 02', views: 900, inquiries: 550, conversions: 280, vH: '92%', iH: '62%', cH: '32%' },
                              ].map((item, idx) => (
                                <div
                                  key={item.label}
                                  onMouseEnter={() => setHoveredBarIndex(idx)}
                                  onMouseLeave={() => setHoveredBarIndex(null)}
                                  className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer relative"
                                >
                                  {/* Hover Tooltip */}
                                  {hoveredBarIndex === idx && (
                                    <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none shadow-lg whitespace-nowrap">
                                      <div className="font-bold">{item.label}</div>
                                      <div>Views: {item.views} &bull; Inq: {item.inquiries}</div>
                                    </div>
                                  )}

                                  {/* 3 Bars */}
                                  <div className="flex items-end gap-1 w-full justify-center h-full">
                                    <div
                                      style={{ height: item.vH }}
                                      className="w-2 sm:w-2.5 rounded-t-sm bg-sky-400 group-hover:bg-sky-500 transition-colors"
                                    />
                                    <div
                                      style={{ height: item.iH }}
                                      className="w-2 sm:w-2.5 rounded-t-sm bg-teal-400 group-hover:bg-teal-500 transition-colors"
                                    />
                                    <div
                                      style={{ height: item.cH }}
                                      className="w-2 sm:w-2.5 rounded-t-sm bg-purple-400 group-hover:bg-purple-500 transition-colors"
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-2 block font-medium truncate">
                                    {item.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* CARD: Top Localities */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-700" />
                            <h3 className="font-bold text-sm text-slate-900">Top Localities</h3>
                          </div>
                          <button
                            onClick={() => setActiveTab('locality_guides')}
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
                          >
                            View all &rarr;
                          </button>
                        </div>

                        {/* Top Localities List matching screenshot */}
                        <div className="divide-y divide-slate-100">
                          {[
                            { rank: 1, name: 'Noida Sector 140', leads: '24 Leads', growth: '↑ 22%' },
                            { rank: 2, name: 'Noida Sector 150', leads: '18 Leads', growth: '↑ 16%' },
                            { rank: 3, name: 'Greater Noida West', leads: '12 Leads', growth: '↑ 11%' },
                            { rank: 4, name: 'Noida Sector 62', leads: '10 Leads', growth: '↑ 9%' },
                            { rank: 5, name: 'Jewar', leads: '7 Leads', growth: '↑ 8%' },
                          ].map(loc => (
                            <div key={loc.rank} className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                                  {loc.rank}
                                </span>
                                <span className="font-bold text-xs text-slate-800">{loc.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 font-medium">{loc.leads}</span>
                                <span className="text-xs font-bold text-emerald-600">{loc.growth}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right Column (4 Columns) */}
                <div className="xl:col-span-4 space-y-6">
                  
                  {/* WIDGET 1: + Quick Actions */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-sm">
                        +
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">Quick Actions</h3>
                    </div>

                    <div className="space-y-2">
                      {/* Action 1: Add New Property */}
                      <button
                        onClick={() => { setEditingProperty(null); setActiveTab('add_property'); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Home className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-slate-950">Add New Property</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </button>

                      {/* Action 2: Upload 4K Drone Tour */}
                      <button
                        onClick={() => handleOpenAddDroneTour()}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <UploadCloud className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-slate-950">Upload 4K Drone Tour</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </button>

                      {/* Action 3: Add Brochure / Document */}
                      <button
                        onClick={() => setActiveTab('website_content')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <FilePlus className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-slate-950">Add Brochure / Document</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </button>

                      {/* Action 4: Update Website Content */}
                      <button
                        onClick={() => setActiveTab('website_content')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-slate-950">Update Website Content</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </button>

                      {/* Action 5: View All Leads */}
                      <button
                        onClick={() => setActiveTab('inquiries')}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-slate-50 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-slate-500 group-hover:text-emerald-600" />
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-slate-950">View All Leads</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                      </button>
                    </div>
                  </div>

                  {/* WIDGET 2: Activity Feed */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-700" />
                        <h3 className="font-bold text-sm text-slate-900">Activity Feed</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('inquiries')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        View all &rarr;
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {/* Activity 1 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">New lead from WhatsApp</div>
                          <div className="text-[10px] text-slate-400">2 minutes ago</div>
                        </div>
                      </div>

                      {/* Activity 2 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Edit3 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">Property updated - EON Fairfox</div>
                          <div className="text-[10px] text-slate-400">12 minutes ago</div>
                        </div>
                      </div>

                      {/* Activity 3 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">4K Drone tour uploaded</div>
                          <div className="text-[10px] text-slate-400">25 minutes ago</div>
                        </div>
                      </div>

                      {/* Activity 4 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">New inquiry received</div>
                          <div className="text-[10px] text-slate-400">42 minutes ago</div>
                        </div>
                      </div>

                      {/* Activity 5 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">Website content updated</div>
                          <div className="text-[10px] text-slate-400">1 hour ago</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WIDGET 3: Upcoming Tasks */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-700" />
                        <h3 className="font-bold text-sm text-slate-900">Upcoming Tasks</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('website_content')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        View all &rarr;
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {/* Task 1 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">Update brochure for Cleo County</div>
                          <div className="text-[10px] text-slate-400">Today &bull; 2:00 PM</div>
                        </div>
                      </div>

                      {/* Task 2 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">Review new leads</div>
                          <div className="text-[10px] text-slate-400">1 hour ago</div>
                        </div>
                      </div>

                      {/* Task 3 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">Review new leads</div>
                          <div className="text-[10px] text-slate-400">Today &bull; 4:00 PM</div>
                        </div>
                      </div>

                      {/* Task 4 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-800">SEO report check</div>
                          <div className="text-[10px] text-slate-400">Tomorrow &bull; 11:00 AM</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB: PROPERTIES TABLE */}
          {activeTab === 'properties' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">All Live Properties</h2>
                  <p className="text-xs text-slate-500">Click Edit to modify details, upload property videos, add lifestyle amenities, or configure floor plans.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setActiveTab('add_property');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add New Listing
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="sm:hidden px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 flex items-center justify-between font-medium">
                  <span>Swipe horizontally to view all columns</span>
                  <span>&rarr;</span>
                </div>
                <div className="overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[650px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="p-4 font-semibold">Property</th>
                        <th className="p-4 font-semibold">Sector</th>
                        <th className="p-4 font-semibold">Base Price</th>
                        <th className="p-4 font-semibold">Property Video</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {propertiesList.map(prop => (
                        <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-sm text-slate-900">{prop.title}</div>
                            <div className="text-xs text-slate-500">{prop.developer}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{prop.sector}</td>
                          <td className="p-4 text-sm font-semibold text-slate-700">{prop.priceDisplay}</td>
                          <td className="p-4">
                            {prop.videoTour?.videoUrl ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-900 border border-sky-200">
                                  <Video className="w-3 h-3 text-sky-600" />
                                  Walkthrough ({prop.videoTour.duration || 'Video'})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDroneVideo(prop.videoTour!)}
                                  title="Watch Property Walkthrough Video"
                                  className="p-1 rounded-md text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-sky-700" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">None attached</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Live
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingProperty(prop);
                                  setActiveTab('add_property');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProperty(prop.id, prop.title)}
                                disabled={deletingId === prop.id}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {deletingId === prop.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: 4K DRONE TOURS MANAGEMENT (Completely standalone & separate from properties) */}
          {activeTab === 'drone_tours' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      <Film className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">4K Drone Tours &amp; Aerial Showcase</h2>
                      <p className="text-xs text-slate-500">
                        Manage master corridor flythroughs, Yamuna Expressway aerial surveys, and regional drone showcases completely separate from individual property listings.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddDroneTour()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  + Add New Drone Tour
                </button>
              </div>

              {/* Status Message */}
              {saveStatus?.tab === 'drone_tours' && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${saveStatus.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveStatus.message}</span>
                </div>
              )}

              {/* Drone Tour Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Drone Tours</div>
                  <div className="mt-2 text-2xl font-black text-amber-600 flex items-center gap-2">
                    <span>{droneToursList.length}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Live Showcase
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Corridor flythroughs visible in 4K aerial viewer</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Primary Corridor</div>
                  <div className="mt-2 text-lg font-black text-slate-800 truncate">
                    Noida Expressway &amp; Sec 150
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Featured 02:45 master corridor drone inspection</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aerial Quality &amp; Storage</div>
                  <div className="mt-2 text-2xl font-black text-emerald-600 flex items-center gap-1.5">
                    <span>4K Ultra-HD 60FPS</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Direct MP4 upload &amp; streaming video delivery</p>
                </div>
              </div>

              {/* Active Drone Tours Grid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Corridor Drone Aerial Tours</h3>
                    <p className="text-xs text-slate-500">Preview, edit or delete master aerial tours from the Drone Tours &amp; Aerial Showcase.</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700">
                    {droneToursList.length} Active
                  </span>
                </div>

                {droneToursList.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    <Video className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No active drone tours yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Upload your first drone footage or paste a video link to activate the 4K aerial tour showcase.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddDroneTour()}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      + Add First Drone Tour
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {droneToursList.map((tour) => (
                      <div key={tour.id} className="group relative rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs hover:shadow-md transition-all flex flex-col">
                        {/* Thumbnail / Video Preview Header */}
                        <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                          <img
                            src={tour.thumbnailUrl || '/corridor-expressway.jpg'}
                            alt={tour.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/corridor-expressway.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPreviewDroneVideo({
                                title: tour.title,
                                videoUrl: tour.videoUrl,
                                duration: tour.duration,
                                description: tour.description
                              })}
                              className="w-12 h-12 rounded-full bg-amber-400/90 hover:bg-amber-300 text-neutral-950 flex items-center justify-center transition-all hover:scale-110 shadow-lg cursor-pointer"
                              title="Play Video"
                            >
                              <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-amber-300 border border-amber-400/30">
                            4K UHD
                          </div>
                          {tour.isFeatured && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur-xs text-[10px] font-bold text-white">
                              Featured
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white font-mono">
                            {tour.duration || '02:45'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                              {tour.sector}
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mt-0.5">
                              {tour.title}
                            </h4>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                              {tour.description}
                            </p>
                            <div className="mt-2 text-[11px] text-slate-400 font-mono truncate">
                              Telemetry: {tour.altitude || '180M • 4K 60FPS'}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewDroneVideo({
                                title: tour.title,
                                videoUrl: tour.videoUrl,
                                duration: tour.duration,
                                description: tour.description
                              })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-amber-700" />
                              Watch
                            </button>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenAddDroneTour(tour)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Edit Drone Tour"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDroneTour(tour.id, tour.title)}
                                disabled={deletingDroneTourId === tour.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                title="Delete Drone Tour"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deletingDroneTourId === tour.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ADD / EDIT PROPERTY (FORM WITH UNLIMITED VIDEO UPLOAD & CUSTOM AMENITIES) */}
          {activeTab === 'add_property' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => {
                  setEditingProperty(null);
                  setActiveTab('properties');
                }}
                className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
              >
                &larr; Back to Properties Portfolio
              </button>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[600px]">
                <AdminPropertyForm
                  propertyToEdit={editingProperty}
                  onClose={() => {
                    setEditingProperty(null);
                    setActiveTab('properties');
                  }}
                  inlineMode={true}
                />
              </div>
            </div>
          )}

          {/* TAB: EDIT WEBSITE HERO & PUBLIC CONTENT */}
          {activeTab === 'website_content' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Hero Section & Website Public Content</h2>
                  <p className="text-xs text-slate-500">Edit headlines, announcement bar, hero badge, and primary stats counters. Changes appear instantly across the website.</p>
                </div>
                {saveStatus?.tab === 'website_content' && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${saveStatus.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{saveStatus.message}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveWebsiteContent} noValidate className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">

                  {/* Hero Headline & Subtitle */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Hero Main Typography & Messaging
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Top Badge Text
                        </label>
                        <input
                          type="text"
                          value={heroForm.badge}
                          onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="e.g. OFFICIAL RERA ADVISORY & CHANNEL PARTNER"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Main Hero Headline
                        </label>
                        <input
                          type="text"
                          value={heroForm.title}
                          onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                          placeholder="e.g. Exceptional Residences & High-Yield Commercials Across Noida"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Hero Subtitle / Description
                        </label>
                        <textarea
                          rows={3}
                          value={heroForm.subtitle}
                          onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="Describe the agency's primary advisory focus..."
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Top Live Announcement Ticker (Optional - leave blank to hide)
                        </label>
                        <input
                          type="text"
                          value={heroForm.announcementText}
                          onChange={(e) => setHeroForm({ ...heroForm, announcementText: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                          placeholder="e.g. ⚡ Jewar International Airport Commercial & Residential Boom..."
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Buttons */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                      Call-to-Action Buttons
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Button Label</label>
                        <input
                          type="text"
                          value={heroForm.siteVisitButtonText}
                          onChange={(e) => setHeroForm({ ...heroForm, siteVisitButtonText: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="Schedule Free Site Visit"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Secondary Button Label</label>
                        <input
                          type="text"
                          value={heroForm.droneTourButtonText}
                          onChange={(e) => setHeroForm({ ...heroForm, droneTourButtonText: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="Watch 4K Drone Tour"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Stats Counters */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                      4 Key Performance Counters (Hero Bar)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {statsForm.map((stat, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Stat #{idx + 1}</span>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block">Value</label>
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => {
                                const copy = [...statsForm];
                                copy[idx] = { ...copy[idx], value: e.target.value };
                                setStatsForm(copy);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                              placeholder="e.g. 150+"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block">Label</label>
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => {
                                const copy = [...statsForm];
                                copy[idx] = { ...copy[idx], label: e.target.value };
                                setStatsForm(copy);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-700"
                              placeholder="e.g. Hectares Curated"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#059669] hover:bg-emerald-500 text-white transition-colors shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Save Website Content
                    </button>
                  </div>

                </div>
              </form>
            </div>
          )}

          {/* TAB: EDIT AGENCY & CONTACT INFORMATION */}
          {activeTab === 'agency_contact' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Agency Information & Contact Routing</h2>
                  <p className="text-xs text-slate-500">All customer inquiries, WhatsApp brochure redirects, and footer/header contact links use these numbers.</p>
                </div>
                {saveStatus?.tab === 'agency_contact' && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${saveStatus.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{saveStatus.message}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveAgencySettings} noValidate className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">

                  {/* Agency Identification */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Agency Identity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Agency Name</label>
                        <input
                          type="text"
                          value={agencyForm.name}
                          onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="KR Estate Noida"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Tagline</label>
                        <input
                          type="text"
                          value={agencyForm.tagline}
                          onChange={(e) => setAgencyForm({ ...agencyForm, tagline: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="Premier Real Estate Advisory & Channel Partner"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Contact Routing */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Direct Contact Numbers & Leads</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Hotline Phone</label>
                        <input
                          type="text"
                          value={agencyForm.phone}
                          onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="+91 78704 33580"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">WhatsApp Lead Number (Numeric with country code, no +)</label>
                        <input
                          type="text"
                          value={agencyForm.whatsapp}
                          onChange={(e) => setAgencyForm({ ...agencyForm, whatsapp: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="917870433580"
                        />
                        <span className="text-[11px] text-slate-400">All PDF brochure and pricing inquiries are dispatched to this WhatsApp.</span>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Lead Receiving Email</label>
                        <input
                          type="email"
                          value={agencyForm.email}
                          onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="avinashmehra5292@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">UP RERA Agent Registration</label>
                        <input
                          type="text"
                          value={agencyForm.reraNumber}
                          onChange={(e) => setAgencyForm({ ...agencyForm, reraNumber: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="UPRERAAGT12894"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Address & Meta */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Office Location & Experience</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Physical Office Address</label>
                        <input
                          type="text"
                          value={agencyForm.address}
                          onChange={(e) => setAgencyForm({ ...agencyForm, address: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="Expressway Business Corridor, Sector 142..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Advisory Experience (Years)</label>
                          <input
                            type="text"
                            value={agencyForm.experienceYears}
                            onChange={(e) => setAgencyForm({ ...agencyForm, experienceYears: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                            placeholder="12+"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">Official Domain</label>
                          <input
                            type="text"
                            value={agencyForm.domain}
                            onChange={(e) => setAgencyForm({ ...agencyForm, domain: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                            placeholder="krestatenoida.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#059669] hover:bg-emerald-500 text-white transition-colors shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Save Agency & Contact Info
                    </button>
                  </div>

                </div>
              </form>
            </div>
          )}

          {/* TAB: EDIT NOIDA LOCALITY GUIDES */}
          {activeTab === 'locality_guides' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Edit Noida Micro-Market & Locality Intelligence</h2>
                  <p className="text-xs text-slate-500">Edit average price per sq.ft, 3-year projected growth, metro connectivity, highlights and description for each Noida corridor.</p>
                </div>
                <div className="flex items-center gap-3">
                  {saveStatus?.tab === 'locality_guides' && (
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${saveStatus.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{saveStatus.message}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateNewLocality}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#059669] hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Corridor</span>
                  </button>
                </div>
              </div>

              {/* Corridor Sub-Selector */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                {localitiesList.map((loc, idx) => (
                  <button
                    key={loc.id || idx}
                    type="button"
                    onClick={() => setSelectedLocalityIdx(idx)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${selectedLocalityIdx === idx ? 'bg-amber-400 text-slate-950 shadow-sm font-bold' : 'text-slate-700 hover:text-slate-900 bg-white/50 hover:bg-white'
                      }`}
                  >
                    {loc.name || `Corridor ${idx + 1}`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCreateNewLocality}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-dashed border-amber-500 text-amber-900 bg-amber-50 hover:bg-amber-100 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>+ Create New</span>
                </button>
              </div>

              {activeLocality && (
                <form onSubmit={handleSaveLocality} noValidate className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">

                    {/* Header with active corridor status and delete option */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          Corridor #{selectedLocalityIdx + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {activeLocality.name || 'Untitled Corridor'}
                        </span>
                      </div>
                      {localitiesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLocality(selectedLocalityIdx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                          title="Delete this corridor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Corridor</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Corridor Name</label>
                        <input
                          type="text"
                          value={activeLocality.name || ''}
                          onChange={(e) => handleUpdateCurrentLocality('name', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="e.g. Sector 150 (Sports City)"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Subtitle / Badge</label>
                        <input
                          type="text"
                          value={activeLocality.subtitle || ''}
                          onChange={(e) => handleUpdateCurrentLocality('subtitle', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                          placeholder="e.g. Noida’s Green Lung & Luxury Sports Hub"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Average Price / Sq.Ft</label>
                        <input
                          type="text"
                          value={activeLocality.avgPricePerSqFt || ''}
                          onChange={(e) => handleUpdateCurrentLocality('avgPricePerSqFt', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-semibold text-amber-700"
                          placeholder="₹12,000 – ₹16,500 / sq.ft"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">3-Year Projected Capital Appreciation</label>
                        <input
                          type="text"
                          value={activeLocality.projectedGrowth3Yr || ''}
                          onChange={(e) => handleUpdateCurrentLocality('projectedGrowth3Yr', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-semibold text-emerald-700"
                          placeholder="+32% Capital Appreciation"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Corridor Narrative & Strategic Appraisal</label>
                      <textarea
                        rows={4}
                        value={activeLocality.description || ''}
                        onChange={(e) => handleUpdateCurrentLocality('description', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white leading-relaxed"
                        placeholder="Detailed market overview, low-density zoning, investor appeal..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Metro & Transit Connectivity</label>
                      <input
                        type="text"
                        value={activeLocality.metroConnectivity || ''}
                        onChange={(e) => handleUpdateCurrentLocality('metroConnectivity', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                        placeholder="Sector 148 Aqua Line Metro Station (1 km away)"
                      />
                    </div>

                    {/* Highlights */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Corridor Key Highlights (One per line)
                      </label>
                      <textarea
                        rows={4}
                        value={activeLocality.highlights?.join('\n') || ''}
                        onChange={(e) => handleUpdateCurrentLocality('highlights', e.target.value.split('\n').filter(Boolean))}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                        placeholder="80% Open Green Space & Zero Overhead Electric Cables&#10;Signal-Free Transit to Jewar International Airport (25 Mins)&#10;Luxury projects by ACE, Godrej, ATS"
                      />
                    </div>

                    {/* Top Projects */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Benchmark Projects (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={activeLocality.topProjects?.join(', ') || ''}
                        onChange={(e) => handleUpdateCurrentLocality('topProjects', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                        placeholder="ACE Starlit, Godrej Palm Retreat, ATS Pristine"
                      />
                    </div>

                    {/* Regional Landmarks */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Key Regional Landmarks (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={activeLocality.landmarkAttractions?.join(', ') || ''}
                        onChange={(e) => handleUpdateCurrentLocality('landmarkAttractions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                        placeholder="Shaheed Bhagat Singh Park, International Cricket Stadium Project"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCreateNewLocality}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Another Corridor</span>
                      </button>

                      <button
                        type="submit"
                        disabled={loadingLocalities}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#059669] hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors shadow-md cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        {loadingLocalities ? 'Saving Guide...' : 'Save All Locality Guides'}
                      </button>
                    </div>

                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB: INQUIRIES & BROCHURE REQUESTS */}
          {activeTab === 'inquiries' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Lead Inbox: PDF Brochure & Site Visit Requests</h2>
                    {brochureLeads.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                        {brochureLeads.length} Total
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Live inquiries sent directly to owner WhatsApp with immediate client name, contact & comments.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                  {lastRefreshedAt && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Updated {lastRefreshedAt}
                    </span>
                  )}
                  {brochureLeads.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllLeads}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 text-red-600 rounded-lg shadow-xs hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
                      title="Clear all leads from database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={fetchBrochureLeads}
                    disabled={loadingLeads}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg shadow-xs hover:bg-slate-50 hover:border-amber-400 hover:text-amber-900 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Refresh latest leads"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-500 transition-transform ${loadingLeads ? 'animate-spin' : ''}`} />
                    <span>{loadingLeads ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="sm:hidden px-3.5 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 flex items-center justify-between font-medium">
                  <span>Swipe horizontally to view all columns</span>
                  <span>&rarr;</span>
                </div>
                <div className="overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[720px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="p-4 font-semibold">Client Details</th>
                        <th className="p-4 font-semibold">Contact Info</th>
                        <th className="p-4 font-semibold">Property / Interest</th>
                        <th className="p-4 font-semibold">Client Comment / Schedule</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {brochureLeads.length > 0 ? (
                        brochureLeads.map((lead, i) => (
                          <tr key={lead.id || i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900">{lead.name}</span>
                                {lead.leadType === 'Site Visit' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                    Site Visit
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                    Brochure
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Today'}
                              </div>
                            </td>
                            <td className="p-4 text-xs text-slate-700">
                              <div className="font-semibold text-slate-900">{lead.phone}</div>
                              <div className="text-slate-500">{lead.email}</div>
                            </td>
                            <td className="p-4 text-xs text-slate-700">
                              <div className="font-semibold text-amber-900">{lead.propertyTitle}</div>
                              <div className="text-[11px] text-slate-500">{lead.sector} • {lead.priceDisplay}</div>
                            </td>
                            <td className="p-4 text-xs text-slate-600 max-w-xs">
                              <p className="line-clamp-2">{lead.comment || 'Complete digital brochure requested.'}</p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${lead.leadType === 'Site Visit' || lead.status === 'Visit Booked'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                }`}>
                                {lead.status || (lead.leadType === 'Site Visit' ? 'Visit Booked' : 'New')}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-2 justify-end">
                                <a
                                  href={`https://wa.me/${(lead.phone || '').replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  WhatsApp
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                            No inquiries yet. When clients request a brochure or book a site visit on any property, their contact information will automatically show here!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS & SEO PORTAL */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Portal Security & SEO Settings</h2>
                {saveStatus?.tab === 'settings' && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${saveStatus.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{saveStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8">

                {/* SEO Metadata */}
                <form onSubmit={handleSaveSeoSettings} noValidate className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Search Engine Optimization (SEO)</h3>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Global Site Title</label>
                    <input
                      type="text"
                      value={seoForm.title}
                      onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                      placeholder="KR Estate Noida | Premier Real Estate Advisory"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Site Meta Description</label>
                    <textarea
                      rows={3}
                      value={seoForm.metaDescription}
                      onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                      placeholder="Leading real estate consultancy in Noida & Greater Noida..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Footer Copyright Line</label>
                    <input
                      type="text"
                      value={seoForm.footerCopyright}
                      onChange={(e) => setSeoForm({ ...seoForm, footerCopyright: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                      placeholder="© 2026 KR Estate Noida. All rights reserved."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save SEO Settings
                    </button>
                  </div>
                </form>

                <hr className="border-slate-100" />

                {/* Security Section */}
                <section>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Security & Authentication</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Change Password */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Update Admin Password</label>
                          <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={4}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Authenticator Code (if enabled)</label>
                          <input
                            type="text"
                            placeholder="123 456"
                            value={passwordTotp}
                            onChange={(e) => setPasswordTotp(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                            maxLength={6}
                          />
                        </div>

                        {passwordStatus === 'error' && (
                          <p className="text-xs font-semibold text-red-500">{passwordError}</p>
                        )}

                        {passwordStatus === 'success' && (
                          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Password updated!
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={passwordStatus === 'loading'}
                          className="w-full px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {passwordStatus === 'loading' ? 'Saving...' : 'Change Password'}
                        </button>
                      </form>
                    </div>

                    {/* TOTP Setup */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-start">
                      <h4 className="font-bold text-slate-800 mb-1 text-sm">Two-Factor Authentication</h4>
                      <p className="text-xs text-slate-500 mb-4">
                        Secure your admin dashboard by linking Google Authenticator or Microsoft Authenticator.
                      </p>

                      {!setupTotpData ? (
                        <button
                          type="button"
                          onClick={handleBeginTotpSetup}
                          className="px-5 py-2 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs mt-auto cursor-pointer"
                        >
                          Configure Authenticator
                        </button>
                      ) : (
                        <div className="w-full">
                          {setupStatus === 'success' ? (
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-200">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              2FA configured successfully!
                            </div>
                          ) : (
                            <form onSubmit={handleConfirmTotpSetup} className="space-y-4">
                              <div className="bg-white p-2 rounded-xl border border-slate-200 flex justify-center">
                                <img src={setupTotpData.qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Verify 6-digit code</label>
                                <input
                                  required
                                  type="text"
                                  value={setupToken}
                                  onChange={(e) => setSetupToken(e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white tracking-widest text-center"
                                  placeholder="123456"
                                  maxLength={6}
                                />
                              </div>

                              {setupError && <p className="text-xs font-semibold text-red-500 text-center">{setupError}</p>}

                              <button
                                type="submit"
                                disabled={setupStatus === 'loading'}
                                className="w-full px-5 py-2 text-xs font-bold text-white bg-[#059669] hover:bg-emerald-500 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {setupStatus === 'loading' ? 'Verifying...' : 'Verify & Enable'}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* Expanded Modal for KPI Cards */}
      {expandedCard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden shadow-2xl flex flex-col relative">

            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                {expandedCard === 'properties' && <><Building className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> Total Properties List</>}
                {expandedCard === 'visits' && <><Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> Site Visit Requests</>}
                {expandedCard === 'valuations' && <><Activity className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" /> Active Valuations</>}
              </h3>
              <button onClick={() => setExpandedCard(null)} className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto overflow-x-auto p-0 flex-1">
              <table className="w-full min-w-[480px] text-left border-collapse">
                <thead className="bg-white sticky top-0 border-b border-slate-200">
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    {expandedCard === 'properties' && (
                      <>
                        <th className="p-4 font-semibold">Title</th>
                        <th className="p-4 font-semibold">Sector</th>
                        <th className="p-4 font-semibold">Price</th>
                      </>
                    )}
                    {expandedCard === 'visits' && (
                      <>
                        <th className="p-4 font-semibold">Client Name</th>
                        <th className="p-4 font-semibold">Contact</th>
                        <th className="p-4 font-semibold">Interested In</th>
                        <th className="p-4 font-semibold">Date</th>
                      </>
                    )}
                    {expandedCard === 'valuations' && (
                      <>
                        <th className="p-4 font-semibold">Property Details</th>
                        <th className="p-4 font-semibold">Location</th>
                        <th className="p-4 font-semibold">Client Name</th>
                        <th className="p-4 font-semibold">Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">

                  {expandedCard === 'properties' && NOIDA_PROPERTIES.map(prop => (
                    <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-sm text-slate-900">{prop.title}</td>
                      <td className="p-4 text-sm text-slate-600">{prop.sector}</td>
                      <td className="p-4 text-sm text-slate-600">{prop.priceDisplay}</td>
                    </tr>
                  ))}

                  {expandedCard === 'visits' && [
                    { id: 1, name: 'Mr. A. Sharma', phone: '+91 98710 44XXX', interest: 'Godrej Woods', date: 'Oct 7, 2026' },
                    { id: 2, name: 'Mrs. N. Gupta', phone: '+91 99100 22XXX', interest: 'Cleo County', date: 'Oct 7, 2026' },
                    { id: 3, name: 'Dr. V. Singh', phone: '+91 98111 88XXX', interest: 'Jewar Plots', date: 'Oct 6, 2026' },
                    { id: 4, name: 'R. Kapoor', phone: '+91 99999 55XXX', interest: 'ATS Knightsbridge', date: 'Oct 5, 2026' },
                  ].map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-sm text-slate-900">{v.name}</td>
                      <td className="p-4 text-sm text-slate-600">{v.phone}</td>
                      <td className="p-4 text-sm text-slate-600">{v.interest}</td>
                      <td className="p-4 text-sm text-slate-500">{v.date}</td>
                    </tr>
                  ))}

                  {expandedCard === 'valuations' && [
                    { id: 1, details: '3 BHK, 1850 sq.ft.', location: 'Sector 137', client: 'P. Verma', date: 'Oct 7, 2026' },
                    { id: 2, details: 'Commercial Shop, 500 sq.ft.', location: 'Bhutani Cyberthum', client: 'K. Agarwal', date: 'Oct 6, 2026' },
                    { id: 3, details: '4 BHK Penthouse', location: 'Sector 150', client: 'S. Mehta', date: 'Oct 4, 2026' },
                  ].map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-sm text-slate-900">{v.details}</td>
                      <td className="p-4 text-sm text-slate-600">{v.location}</td>
                      <td className="p-4 text-sm text-slate-600">{v.client}</td>
                      <td className="p-4 text-sm text-slate-500">{v.date}</td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: ADD / EDIT 4K DRONE TOUR */}
      {droneTourModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Film className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingDroneTourId ? 'Edit 4K Drone Tour' : 'Add New 4K Drone Tour'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure aerial survey footage, flight corridor telemetry, and showcase overview.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDroneTourModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDroneTour} className="p-6 space-y-4">
              {/* Tour Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Drone Tour Title *
                </label>
                <input
                  type="text"
                  required
                  value={droneTourForm.title}
                  onChange={(e) => setDroneTourForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Noida Expressway & Sector 150 Drone Flythrough"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              {/* Corridor & Micro-Market Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Corridor / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    value={droneTourForm.sector}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, sector: e.target.value }))}
                    placeholder="e.g. Noida Expressway & Sector 150 Corridor"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Growth Hub / Locality
                  </label>
                  <input
                    type="text"
                    value={droneTourForm.locality || ''}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, locality: e.target.value }))}
                    placeholder="e.g. Expressway Growth Hub"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Duration, Altitude & Badge Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Flight Duration *
                  </label>
                  <input
                    type="text"
                    required
                    value={droneTourForm.duration}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g. 02:45"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Telemetry / Altitude
                  </label>
                  <input
                    type="text"
                    value={droneTourForm.altitude || ''}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, altitude: e.target.value }))}
                    placeholder="e.g. 180M • 4K 60FPS"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={droneTourForm.badge || ''}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g. Master Corridor · 4K 60FPS"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="droneFeaturedToggle"
                  checked={droneTourForm.isFeatured}
                  onChange={(e) => setDroneTourForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="droneFeaturedToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Featured in Homepage Hero "Drone Tours &amp; Aerial Showcase"
                </label>
              </div>

              {/* Upload or Video URL */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Video Source (MP4 / WebM / Link) *
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium">Direct MP4 or link</span>
                </div>

                {/* Direct Video File Upload */}
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    ref={droneFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleUploadDroneFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingDroneVideo}
                    onClick={() => droneFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingDroneVideo ? 'Uploading Video...' : 'Upload Video File (.mp4)'}
                  </button>
                  <span className="text-xs text-slate-500">or paste a direct video link below:</span>
                </div>

                {droneUploadStatus && (
                  <p className="text-xs font-medium text-amber-700 animate-pulse">{droneUploadStatus}</p>
                )}

                <input
                  ref={droneUrlInputRef}
                  type="text"
                  required
                  value={droneTourForm.videoUrl}
                  onChange={(e) => setDroneTourForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="e.g. /uploads/videos/noida-expressway-sec150-drone.mp4 or https://..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-mono"
                />
              </div>

              {/* Thumbnail Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Video Thumbnail / Poster Image URL
                </label>
                <input
                  type="text"
                  value={droneTourForm.thumbnailUrl || ''}
                  onChange={(e) => setDroneTourForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="e.g. /corridor-expressway.jpg"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              {/* Description / Highlights */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Drone Flight Highlights &amp; Corridor Overview
                </label>
                <textarea
                  rows={2}
                  value={droneTourForm.description || ''}
                  onChange={(e) => setDroneTourForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Comprehensive 4K aerial drone survey capturing the Noida-Greater Noida Expressway, 45m arterial sector roads..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              {/* Live Preview if URL Present */}
              {droneTourForm.videoUrl && (
                <div className="p-3 bg-slate-900 rounded-xl space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    Live Video Player Preview
                  </div>
                  <video
                    src={droneTourForm.videoUrl}
                    controls
                    onLoadedMetadata={(e) => {
                      const sec = Math.round(e.currentTarget.duration);
                      if (sec && !isNaN(sec)) {
                        const mins = Math.floor(sec / 60);
                        const remainingSec = sec % 60;
                        const formatted = `${String(mins).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`;
                        setDroneTourForm(prev => ({ ...prev, duration: formatted }));
                      }
                    }}
                    className="w-full max-h-48 rounded-lg bg-black object-contain"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                {editingDroneTourId && (
                  <button
                    type="button"
                    disabled={droneActionLoading}
                    onClick={() => {
                      setDroneTourModalOpen(false);
                      handleDeleteDroneTour(editingDroneTourId, droneTourForm.title);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer mr-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Tour
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDroneTourModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={droneActionLoading || isUploadingDroneVideo}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {droneActionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving Tour...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {editingDroneTourId ? 'Update Drone Tour' : 'Publish Drone Tour'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIDEO LIGHTBOX PREVIEW */}
      {previewDroneVideo && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`relative ${isPreviewPortrait ? 'max-w-md sm:max-w-lg' : 'max-w-4xl'} w-full bg-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden transition-all duration-300`}>
            {/* Header */}
            <div className="p-4 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400">
                  <Film className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{previewDroneVideo.title}</h3>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {isPreviewPortrait ? 'Vertical Portrait Tour' : (previewDroneVideo.duration || '4K UHD Aerial Experience')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDroneVideo(null);
                  setIsPreviewPortrait(false);
                }}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className={`relative ${isPreviewPortrait ? 'aspect-[9/16] max-h-[72vh]' : 'aspect-video'} bg-black flex items-center justify-center overflow-hidden`}>
              {isPreviewPortrait && !previewDroneVideo.videoUrl?.includes('youtube.com') && !previewDroneVideo.videoUrl?.includes('youtu.be') && !previewDroneVideo.videoUrl?.includes('drive.google.com') && (
                <video
                  src={previewDroneVideo.videoUrl}
                  muted
                  playsInline
                  autoPlay
                  loop
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                />
              )}

              {previewDroneVideo.videoUrl?.includes('youtube.com') || previewDroneVideo.videoUrl?.includes('youtu.be') ? (
                <iframe
                  src={previewDroneVideo.videoUrl.includes('/shorts/') ? previewDroneVideo.videoUrl.replace('/shorts/', '/embed/') : previewDroneVideo.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full relative z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : previewDroneVideo.videoUrl?.includes('drive.google.com') ? (
                <iframe
                  src={previewDroneVideo.videoUrl.includes('/file/d/') ? `https://drive.google.com/file/d/${previewDroneVideo.videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || ''}/preview` : previewDroneVideo.videoUrl.replace(/\/view(\?.*)?$/, '/preview')}
                  className="w-full h-full relative z-10 border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  key={previewDroneVideo.videoUrl}
                  src={previewDroneVideo.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  onLoadedMetadata={(e) => {
                    const { videoWidth, videoHeight } = e.currentTarget;
                    if (videoWidth && videoHeight) {
                      setIsPreviewPortrait(videoHeight > videoWidth);
                    }
                  }}
                  className="w-full h-full object-contain relative z-10"
                />
              )}
            </div>

            {/* Description Footer */}
            {previewDroneVideo.description && (
              <div className="p-4 bg-neutral-900/60 border-t border-neutral-800 text-xs text-neutral-300">
                {previewDroneVideo.description}
              </div>
            )}
          </div>
        </div> 
      )}

      {/* Video Size Exceeded Modal Suggesting YouTube / Google Drive */}
      <VideoSizeExceededModal
        isOpen={sizeExceededModal.isOpen}
        onClose={() => setSizeExceededModal(prev => ({ ...prev, isOpen: false }))}
        fileSizeMb={sizeExceededModal.sizeMb}
        fileName={sizeExceededModal.fileName}
        onPasteLinkClick={() => {
          setTimeout(() => {
            if (droneUrlInputRef.current) {
              droneUrlInputRef.current.focus();
              droneUrlInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        }}
      />
    </div>
  );
};
