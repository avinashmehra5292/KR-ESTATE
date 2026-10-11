import React, { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle, Database, LayoutDashboard, Building, Users, Settings,
  LogOut, Plus, ChevronRight, Activity, Globe, Phone, MapPin, Sparkles,
  Save, Compass, FileText, Check, AlertCircle, Edit, Trash2, ExternalLink,
  MessageCircle, RefreshCw, Menu, Video, Play, Film, Upload
} from 'lucide-react';
import { Property, LocalityInfo } from '../types';
import { NOIDA_PROPERTIES } from '../data/properties';
import { AdminPropertyForm } from './AdminPropertyForm';
import { useSiteSettings } from '../context/SiteSettingsContext';
import defaultLocalities from '../data/localities.json';
import { getAdminAuthHeaders, clearAdminAuth } from '../utils/adminAuth';

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

  // Status message for saves
  const [saveStatus, setSaveStatus] = useState<{ tab: string; message: string; isError?: boolean } | null>(null);

  // Property list & Drone Tours state
  const [propertiesList, setPropertiesList] = useState<Property[]>(NOIDA_PROPERTIES);
  const [droneTourModalOpen, setDroneTourModalOpen] = useState(false);
  const [droneTourTargetPropId, setDroneTourTargetPropId] = useState<string>('');
  const [droneTourForm, setDroneTourForm] = useState({
    title: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: '02:45',
    description: ''
  });
  const [isUploadingDroneVideo, setIsUploadingDroneVideo] = useState(false);
  const [droneUploadStatus, setDroneUploadStatus] = useState('');
  const [droneActionLoading, setDroneActionLoading] = useState(false);
  const [previewDroneVideo, setPreviewDroneVideo] = useState<{ title: string; videoUrl: string; duration?: string; description?: string } | null>(null);
  const [deletingDroneTourId, setDeletingDroneTourId] = useState<string | null>(null);
  const droneFileInputRef = useRef<HTMLInputElement>(null);

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

  // Drone Tours Action Handlers
  const handleOpenAddDroneTour = (propId?: string) => {
    const target = propId
      ? propertiesList.find(p => p.id === propId)
      : (propertiesList.find(p => !p.videoTour?.videoUrl) || propertiesList[0]);

    if (!target) return;
    setDroneTourTargetPropId(target.id);
    if (target.videoTour && target.videoTour.videoUrl) {
      setDroneTourForm({
        title: target.videoTour.title || `${target.title} 4K Drone Tour`,
        videoUrl: target.videoTour.videoUrl || '',
        thumbnailUrl: target.videoTour.thumbnailUrl || target.coverImage || '',
        duration: target.videoTour.duration || '02:45',
        description: target.videoTour.description || `4K aerial inspection and architectural walkthrough of ${target.title} in ${target.sector}.`
      });
    } else {
      setDroneTourForm({
        title: `${target.title} 4K Drone Tour & Aerial Walkthrough`,
        videoUrl: '',
        thumbnailUrl: target.coverImage || '',
        duration: '02:45',
        description: `4K aerial inspection and architectural walkthrough of ${target.title} in ${target.sector}.`
      });
    }
    setDroneUploadStatus('');
    setDroneTourModalOpen(true);
  };

  const handleSaveDroneTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!droneTourTargetPropId) {
      alert('Please select a target property.');
      return;
    }
    if (!droneTourForm.videoUrl.trim()) {
      alert('Please provide a video URL or upload an MP4/WebM video file.');
      return;
    }

    setDroneActionLoading(true);
    try {
      const res = await fetch(`/api/admin/properties/${droneTourTargetPropId}/drone-tour`, {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(droneTourForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPropertiesList(prev => prev.map(p => {
          if (p.id === droneTourTargetPropId) {
            return { ...p, videoTour: data.videoTour };
          }
          return p;
        }));
        const idx = NOIDA_PROPERTIES.findIndex(p => p.id === droneTourTargetPropId);
        if (idx !== -1) {
          NOIDA_PROPERTIES[idx].videoTour = data.videoTour;
        }

        setDroneTourModalOpen(false);
        setSaveStatus({ tab: 'drone_tours', message: `4K Drone Tour successfully published for ${data.property?.title || 'property'}!` });
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

  const handleDeleteDroneTour = async (propertyId: string, propertyTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the 4K Drone Tour for "${propertyTitle}"?\n\nThe property listing will remain active, but the drone video tour will be removed.`)) {
      return;
    }

    setDeletingDroneTourId(propertyId);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/drone-tour`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPropertiesList(prev => prev.map(p => {
          if (p.id === propertyId) {
            const copy = { ...p };
            delete copy.videoTour;
            return copy;
          }
          return p;
        }));
        const idx = NOIDA_PROPERTIES.findIndex(p => p.id === propertyId);
        if (idx !== -1) {
          delete NOIDA_PROPERTIES[idx].videoTour;
        }

        setSaveStatus({ tab: 'drone_tours', message: `4K Drone Tour deleted from "${propertyTitle}"!` });
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

    setIsUploadingDroneVideo(true);
    setDroneUploadStatus(`Uploading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
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

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload video');
      }

      setDroneTourForm(prev => ({
        ...prev,
        videoUrl: data.videoUrl
      }));
      setDroneUploadStatus(`Video uploaded successfully! (${data.sizeMb} MB)`);
      setTimeout(() => setDroneUploadStatus(''), 4000);
    } catch (err: any) {
      console.error(err);
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
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full z-50 flex bg-slate-50 text-slate-900 admin-panel animate-in fade-in duration-300 overflow-hidden">

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-[100dvh] max-h-[100dvh] bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:h-full lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
      >
        <div className="h-14 sm:h-16 lg:h-20 flex items-center justify-between px-4 sm:px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm">
              KR
            </div>
            <div>
              <span className="font-bold text-white tracking-wide block text-sm">KR Estate Admin</span>
              <span className="text-[10px] text-amber-400 font-medium block">Control Panel</span>
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

        <nav className="flex-1 py-3 px-2.5 sm:px-3 space-y-1 overflow-y-auto overscroll-contain">
          <button
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'overview' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => {
              setEditingProperty(null);
              setActiveTab('properties');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'properties' || activeTab === 'add_property' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Building className="w-4 h-4 shrink-0" />
            <span>Manage Properties ({propertiesList.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('drone_tours');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'drone_tours' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-3">
              <Video className="w-4 h-4 shrink-0 text-amber-400" />
              <span>4K Drone Tours</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'drone_tours' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300 border border-slate-700'}`}>
              {propertiesList.filter(p => p.videoTour?.videoUrl).length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('website_content'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'website_content' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Hero & Web Content</span>
          </button>

          <button
            onClick={() => { setActiveTab('agency_contact'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'agency_contact' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>Agency & Contact Info</span>
          </button>

          <button
            onClick={() => { setActiveTab('locality_guides'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'locality_guides' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Noida Locality Guides</span>
          </button>

          <button
            onClick={() => { setActiveTab('inquiries'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'inquiries' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 shrink-0" />
              <span>Brochure & Site Leads</span>
            </div>
            {brochureLeads.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'inquiries' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300 border border-slate-700'}`}>
                {brochureLeads.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Security & SEO Portal</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Exit Admin Panel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full max-h-[100dvh] overflow-hidden min-w-0">

        {/* Top Header */}
        <header className="h-14 sm:h-16 lg:h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base lg:text-xl font-bold text-slate-900 truncate">
                {activeTab === 'overview' && 'Dashboard Overview & Metrics'}
                {activeTab === 'properties' && 'Property Portfolio Manager'}
                {activeTab === 'drone_tours' && '4K Drone Aerial Tours & Walkthroughs'}
                {activeTab === 'add_property' && (editingProperty ? `Edit: ${editingProperty.title}` : 'Add New Property Listing')}
                {activeTab === 'website_content' && 'Hero & Web Content'}
                {activeTab === 'agency_contact' && 'Agency & Contact Numbers'}
                {activeTab === 'locality_guides' && 'Noida Locality Intelligence'}
                {activeTab === 'inquiries' && 'Brochure Leads & Inquiries'}
                {activeTab === 'settings' && 'Portal Security & SEO'}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">Live synchronization with krestatenoida.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Exit Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 overscroll-contain">

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <button
                  onClick={() => setExpandedCard('properties')}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4 text-left hover:border-amber-400 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">Total Properties</span>
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors"><Building className="w-4 h-4" /></div>
                  </div>
                  <div className="text-4xl font-bold text-slate-900">{propertiesList.length}</div>
                  <span className="text-xs text-slate-500">Click to view complete property list</span>
                </button>

                <button
                  onClick={() => setActiveTab('drone_tours')}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4 text-left hover:border-amber-500 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-amber-600 transition-colors">4K Drone Tours</span>
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors"><Video className="w-4 h-4" /></div>
                  </div>
                  <div className="text-4xl font-bold text-slate-900">
                    {propertiesList.filter(p => p.videoTour?.videoUrl).length}
                    <span className="text-xs font-semibold text-amber-600 ml-2">Active</span>
                  </div>
                  <span className="text-xs text-slate-500">Click to add, edit or delete drone tours</span>
                </button>

                <button
                  onClick={() => setActiveTab('inquiries')}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4 text-left hover:border-blue-400 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-blue-600 transition-colors">Brochure & Site Inquiries</span>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors"><Users className="w-4 h-4" /></div>
                  </div>
                  <div className="text-4xl font-bold text-slate-900">
                    {brochureLeads.length > 0 ? brochureLeads.length : '16'}
                    <span className="text-xs font-semibold text-emerald-600 ml-2">Live WhatsApp alerts</span>
                  </div>
                  <span className="text-xs text-slate-500">Click to view client contact details</span>
                </button>

                <button
                  onClick={() => setActiveTab('website_content')}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4 text-left hover:border-purple-400 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-purple-600 transition-colors">Website Live Modules</span>
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors"><Sparkles className="w-4 h-4" /></div>
                  </div>
                  <div className="text-4xl font-bold text-slate-900">100%</div>
                  <span className="text-xs text-slate-500">All text, hero, stats & locality guides fully editable</span>
                </button>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">Quick Content Updates</h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <button
                      onClick={() => {
                        setEditingProperty(null);
                        setActiveTab('add_property');
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Plus className="w-4 h-4" /></div>
                        <span className="font-semibold text-sm text-slate-700 group-hover:text-amber-900">Add New Property Listing (With Video & Amenities)</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                    </button>

                    <button
                      onClick={() => setActiveTab('drone_tours')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Video className="w-4 h-4" /></div>
                        <span className="font-semibold text-sm text-slate-700 group-hover:text-amber-900">Manage 4K Drone Tours (Add, Upload or Delete)</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                    </button>

                    <button
                      onClick={() => setActiveTab('website_content')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Sparkles className="w-4 h-4" /></div>
                        <span className="font-semibold text-sm text-slate-700 group-hover:text-amber-900">Edit Hero Headline, Badge & Announcement Ticker</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                    </button>

                    <button
                      onClick={() => setActiveTab('agency_contact')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Phone className="w-4 h-4" /></div>
                        <span className="font-semibold text-sm text-slate-700 group-hover:text-amber-900">Update WhatsApp Number & Agency Phone Hotline</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                    </button>

                    <button
                      onClick={() => setActiveTab('locality_guides')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Compass className="w-4 h-4" /></div>
                        <span className="font-semibold text-sm text-slate-700 group-hover:text-amber-900">Edit Noida Locality & Corridor Guides</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">Recent Properties in Portfolio</h2>
                    <button
                      onClick={() => setActiveTab('properties')}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      View All &rarr;
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {NOIDA_PROPERTIES.slice(-4).reverse().map(prop => (
                      <div key={prop.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{prop.title}</div>
                          <div className="text-xs text-slate-500">{prop.sector} • {prop.developer}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-800">{prop.priceDisplay}</span>
                          <button
                            onClick={() => {
                              setEditingProperty(prop);
                              setActiveTab('add_property');
                            }}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add New Listing
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="p-4 font-semibold">Property</th>
                        <th className="p-4 font-semibold">Sector</th>
                        <th className="p-4 font-semibold">Base Price</th>
                        <th className="p-4 font-semibold">Video Tour</th>
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
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  <Film className="w-3 h-3 text-amber-600" />
                                  Active ({prop.videoTour.duration || '4K'})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDroneVideo(prop.videoTour!)}
                                  title="Watch Drone Tour"
                                  className="p-1 rounded-md text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-amber-700" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddDroneTour(prop.id)}
                                  title="Edit Drone Tour"
                                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDroneTour(prop.id, prop.title)}
                                  disabled={deletingDroneTourId === prop.id}
                                  title="Delete Drone Tour"
                                  className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAddDroneTour(prop.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                Add Drone Tour
                              </button>
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

          {/* TAB: 4K DRONE TOURS MANAGEMENT */}
          {activeTab === 'drone_tours' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      <Film className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">4K Drone Tours & Aerial Showcase</h2>
                      <p className="text-xs text-slate-500">
                        Add high-definition aerial footage, upload MP4 video tours, or delete drone walk-throughs for any property.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddDroneTour()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer self-start sm:self-auto"
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
                    <span>{propertiesList.filter(p => p.videoTour?.videoUrl).length}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {Math.round((propertiesList.filter(p => p.videoTour?.videoUrl).length / (propertiesList.length || 1)) * 100)}% Coverage
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Live 4K aerial tours visible to VIP buyers</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Drone Coverage</div>
                  <div className="mt-2 text-2xl font-black text-slate-800">
                    {propertiesList.filter(p => !p.videoTour?.videoUrl).length}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Properties ready for new drone tour upload</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Storage & Video Delivery</div>
                  <div className="mt-2 text-2xl font-black text-emerald-600 flex items-center gap-1.5">
                    <span>Direct MP4 / Stream</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Unlimited size video upload & external embeds supported</p>
                </div>
              </div>

              {/* Active Drone Tours Grid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Property Drone Tours</h3>
                    <p className="text-xs text-slate-500">Preview, modify or permanently delete drone videos from the property showcase.</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700">
                    {propertiesList.filter(p => p.videoTour?.videoUrl).length} Published
                  </span>
                </div>

                {propertiesList.filter(p => p.videoTour?.videoUrl).length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                    <Video className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No active drone tours yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Upload your first drone footage or paste a video link to activate the 4K aerial tour experience for buyers.
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
                    {propertiesList.filter(p => p.videoTour?.videoUrl).map(prop => {
                      const tour = prop.videoTour!;
                      return (
                        <div key={prop.id} className="group relative rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs hover:shadow-md transition-all flex flex-col">
                          {/* Thumbnail / Video Preview Header */}
                          <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                            <img
                              src={tour.thumbnailUrl || prop.coverImage || ''}
                              alt={tour.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = prop.coverImage || '';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setPreviewDroneVideo(tour)}
                                className="w-12 h-12 rounded-full bg-amber-400/90 hover:bg-amber-300 text-neutral-950 flex items-center justify-center transition-all hover:scale-110 shadow-lg cursor-pointer"
                                title="Play Video"
                              >
                                <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
                              </button>
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-amber-300 border border-amber-400/30">
                              4K UHD
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white">
                              {tour.duration || 'Custom'}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                                {prop.sector} &bull; {prop.developer}
                              </div>
                              <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mt-0.5">
                                {prop.title}
                              </h4>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                                {tour.title || tour.description || '4K Aerial Drone Tour'}
                              </p>
                              <div className="mt-2 text-[11px] text-slate-400 truncate">
                                Source: {tour.videoUrl}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDroneVideo(tour)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-amber-700" />
                                Watch
                              </button>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddDroneTour(prop.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                  title="Edit Video URL or Details"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDroneTour(prop.id, prop.title)}
                                  disabled={deletingDroneTourId === prop.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Delete Drone Tour"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {deletingDroneTourId === prop.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Properties Awaiting Drone Tours */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Properties Awaiting 4K Drone Tour</h3>
                    <p className="text-xs text-slate-500">Quickly upload or assign a drone video tour to any of these listings.</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    {propertiesList.filter(p => !p.videoTour?.videoUrl).length} Listings Pending
                  </span>
                </div>

                {propertiesList.filter(p => !p.videoTour?.videoUrl).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-emerald-50 rounded-xl border border-emerald-200">
                    🎉 All active properties currently have 4K Drone Tours assigned!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {propertiesList.filter(p => !p.videoTour?.videoUrl).map(prop => (
                      <div key={prop.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-300 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prop.coverImage}
                            alt={prop.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-slate-900 truncate">{prop.title}</h4>
                            <p className="text-[11px] text-slate-500 truncate">{prop.sector} &bull; {prop.priceDisplay}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenAddDroneTour(prop.id)}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Tour
                        </button>
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
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-md cursor-pointer"
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
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-md cursor-pointer"
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
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
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 transition-colors shadow-md cursor-pointer"
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
                <div className="overflow-x-auto">
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
                                className="w-full px-5 py-2 text-xs font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
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
                    {droneTourForm.videoUrl ? 'Edit / Configure 4K Drone Tour' : 'Add 4K Drone Tour'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure aerial footage and walkthrough details for the property listing.</p>
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
              {/* Select Property */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Property *
                </label>
                <select
                  value={droneTourTargetPropId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setDroneTourTargetPropId(chosenId);
                    const chosen = propertiesList.find(p => p.id === chosenId);
                    if (chosen) {
                      if (chosen.videoTour?.videoUrl) {
                        setDroneTourForm({
                          title: chosen.videoTour.title || `${chosen.title} 4K Drone Tour`,
                          videoUrl: chosen.videoTour.videoUrl,
                          thumbnailUrl: chosen.videoTour.thumbnailUrl || chosen.coverImage || '',
                          duration: chosen.videoTour.duration || '02:45',
                          description: chosen.videoTour.description || `4K aerial inspection and architectural walkthrough of ${chosen.title} in ${chosen.sector}.`
                        });
                      } else {
                        setDroneTourForm({
                          title: `${chosen.title} 4K Drone Tour & Aerial Walkthrough`,
                          videoUrl: '',
                          thumbnailUrl: chosen.coverImage || '',
                          duration: '02:45',
                          description: `4K aerial inspection and architectural walkthrough of ${chosen.title} in ${chosen.sector}.`
                        });
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 cursor-pointer"
                >
                  {propertiesList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.sector}) {p.videoTour?.videoUrl ? '• [Active Tour]' : '• [No Tour Yet]'}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="e.g. Godrej Woods 4K Aerial Drone & Forest Walkthrough"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>

              {/* Upload or Video URL */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Video Source (MP4 / WebM / Link) *
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium">Unlimited file size</span>
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
                  type="text"
                  required
                  value={droneTourForm.videoUrl}
                  onChange={(e) => setDroneTourForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://... or /uploads/videos/drone-tour.mp4"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={droneTourForm.duration || ''}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g. 02:45 or 03:10"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>

                {/* Thumbnail Image URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Video Thumbnail / Poster URL
                  </label>
                  <input
                    type="text"
                    value={droneTourForm.thumbnailUrl || ''}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="https://... (defaults to property cover)"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Description / Highlights */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Drone Tour Highlights / Overview
                </label>
                <textarea
                  rows={2}
                  value={droneTourForm.description || ''}
                  onChange={(e) => setDroneTourForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Highlight key aerial views, clubhouse fly-through, expressway connectivity, etc."
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
                    className="w-full max-h-48 rounded-lg bg-black object-contain"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                {propertiesList.find(p => p.id === droneTourTargetPropId)?.videoTour?.videoUrl && (
                  <button
                    type="button"
                    disabled={droneActionLoading}
                    onClick={() => {
                      const prop = propertiesList.find(p => p.id === droneTourTargetPropId);
                      if (prop) {
                        setDroneTourModalOpen(false);
                        handleDeleteDroneTour(prop.id, prop.title);
                      }
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
                  <Save className="w-4 h-4" />
                  {droneActionLoading ? 'Saving Tour...' : 'Save & Publish Drone Tour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIDEO LIGHTBOX PREVIEW */}
      {previewDroneVideo && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400">
                  <Film className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">{previewDroneVideo.title}</h3>
                  <p className="text-[11px] text-neutral-400 truncate">{previewDroneVideo.duration || '4K UHD Aerial Experience'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDroneVideo(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={previewDroneVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
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
    </div>
  );
};
