import React, { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle, Database, LayoutDashboard, Building, Users, Settings,
  LogOut, Plus, ChevronRight, Activity, Globe, Phone, MapPin, Sparkles,
  Save, Compass, FileText, Check, AlertCircle, Edit, Trash2, ExternalLink,
  MessageCircle, RefreshCw, Menu, Video, Play, Film, Upload, Search,
  Filter, Eye, Shield, ArrowUpRight
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

  // Property list & Search/Filter state
  const [propertiesList, setPropertiesList] = useState<Property[]>(NOIDA_PROPERTIES);
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [propertySectorFilter, setPropertySectorFilter] = useState('all');
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
        console.warn('Admin session requires refresh for leads');
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

  // Filtered properties based on search query and sector filter
  const filteredProperties = propertiesList.filter(prop => {
    const q = propertySearchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      prop.title.toLowerCase().includes(q) ||
      (prop.developer && prop.developer.toLowerCase().includes(q)) ||
      (prop.sector && prop.sector.toLowerCase().includes(q)) ||
      (prop.locality && prop.locality.toLowerCase().includes(q));
    const sec = (prop.sector || '').toLowerCase();
    const matchesSector = propertySectorFilter === 'all' ||
      (propertySectorFilter === 'central' && (sec.includes('43') || sec.includes('121') || sec.includes('central'))) ||
      (propertySectorFilter === 'expressway' && (sec.includes('124') || sec.includes('128') || sec.includes('140') || sec.includes('144') || sec.includes('150') || sec.includes('expressway'))) ||
      (propertySectorFilter === 'jewar' && (sec.includes('jewar') || sec.includes('22d') || sec.includes('18') || sec.includes('yamuna')));
    return matchesSearch && matchesSector;
  });

  return (
    <div className="fixed inset-0 z-50 flex bg-[#FFF3EB] text-slate-900 admin-panel animate-in fade-in duration-300 font-sans selection:bg-amber-500 selection:text-white overflow-hidden relative">

      {/* Decorative ambient background lighting mesh for luxury peach ambiance */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-amber-400/15 blur-[140px] animate-shimmer-pulse" />
        <div className="absolute top-[25%] right-[-15%] w-[50%] h-[65%] rounded-full bg-orange-300/15 blur-[150px]" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-[-15%] left-[20%] w-[60%] h-[55%] rounded-full bg-rose-300/10 blur-[140px]" style={{ animationDelay: '5s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.06),transparent_70%)]" />
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#FFF8F4]/95 backdrop-blur-xl text-slate-700 flex flex-col border-r border-orange-200/80 transition-transform duration-300 ease-in-out lg:static lg:w-68 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-5 sm:px-6 border-b border-orange-200/80 shrink-0 bg-[#FFF3EB]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 ring-1 ring-amber-300/40">
              KR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-wider text-sm">KR ESTATE</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold block tracking-wide">Executive Command Desk</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-orange-100 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-orange-300/60 [&::-webkit-scrollbar-track]:bg-transparent">
          
          {/* Group 1: Portfolio & Media */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-800">
              Portfolio & Media
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'properties' || activeTab === 'add_property'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Properties Portfolio</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'properties' || activeTab === 'add_property'
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-orange-100 text-slate-700 border border-orange-200'
                }`}>
                  {propertiesList.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('drone_tours');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'drone_tours'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Film className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>4K Drone Tours</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'drone_tours'
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {propertiesList.filter(p => p.videoTour?.videoUrl).length} Live
                </span>
              </button>

              <button
                onClick={() => {
                  setEditingProperty(null);
                  setActiveTab('add_property');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-amber-800 hover:text-amber-900 hover:bg-orange-100/70 border border-dashed border-amber-400/60 bg-white/60 mt-1"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>+ Add New Listing</span>
              </button>
            </div>
          </div>

          {/* Group 2: Digital Advisory & Content */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-800">
              Web Content & Advisory
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('website_content'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'website_content'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Hero & Announcements</span>
              </button>

              <button
                onClick={() => { setActiveTab('locality_guides'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'locality_guides'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Noida Locality Intelligence</span>
              </button>

              <button
                onClick={() => { setActiveTab('agency_contact'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'agency_contact'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
                }`}
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Agency & Hotline Routing</span>
              </button>
            </div>
          </div>

          {/* Group 3: Leads & System Security */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-800">
              Leads & Security
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { setActiveTab('inquiries'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'inquiries'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Brochure & Site Leads</span>
                </div>
                {brochureLeads.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'inquiries'
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {brochureLeads.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-100/60'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Security & SEO Portal</span>
              </button>
            </div>
          </div>

        </nav>

        {/* Sidebar Footer: Profile & Exit */}
        <div className="p-4 border-t border-orange-200/80 bg-[#FFF3EB] space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-xs text-amber-800">
                SA
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#FFF3EB]"></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">Super Admin</div>
              <div className="text-[10px] text-amber-700 truncate font-semibold">UP RERA Advisory Desk</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-orange-200 shadow-xs transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Admin Panel</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#FFF3EB]">

        {/* Top Header */}
        <header className="h-16 lg:h-20 bg-[#FFF8F4]/90 backdrop-blur-md border-b border-orange-200/80 flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 text-slate-900">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-orange-100 border border-orange-200 transition-colors cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span>KR Estate Console</span>
                <span>/</span>
                <span className="text-amber-700 font-bold capitalize">
                  {activeTab.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">
                {activeTab === 'overview' && 'Executive Portfolio Intelligence & KPIs'}
                {activeTab === 'properties' && 'Property Portfolio Management'}
                {activeTab === 'drone_tours' && '4K Aerial Drone Tours & Walkthroughs'}
                {activeTab === 'add_property' && (editingProperty ? `Edit Property: ${editingProperty.title}` : 'Add New Property Listing')}
                {activeTab === 'website_content' && 'Hero Section & Announcement Ticker'}
                {activeTab === 'agency_contact' && 'Agency Hotline & WhatsApp Routing'}
                {activeTab === 'locality_guides' && 'Noida Corridor Intelligence & Micro-Markets'}
                {activeTab === 'inquiries' && 'Brochure Leads & Site Visit Bookings'}
                {activeTab === 'settings' && 'Portal Security, 2FA & SEO Engine'}
              </h1>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-slate-900 hover:bg-orange-50 border border-orange-200 shadow-xs transition-colors"
              title="Preview Live Website"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Visit Live Website</span>
            </a>

            {activeTab !== 'add_property' && (
              <button
                onClick={() => {
                  setEditingProperty(null);
                  setActiveTab('add_property');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Add Listing</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-slate-900 hover:bg-orange-50 transition-colors cursor-pointer border border-orange-200 shadow-xs"
              title="Exit Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-orange-300/60 [&::-webkit-scrollbar-track]:bg-transparent">

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Executive Welcome Hero Banner */}
              <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#FFF8F4] via-[#FFF1E6] to-[#FFE8D6] border border-orange-200/90 shadow-md overflow-hidden">
                {/* Ambient glow flare */}
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Executive Real Estate Command Desk
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      KR Estate Noida Intelligence Portal
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      Unified administration console for Noida expressway properties, 4K aerial drone tours, dynamic public announcements, and VIP brochure lead routing.
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setEditingProperty(null);
                        setActiveTab('add_property');
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ New Property Listing</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('drone_tours')}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-slate-900 hover:bg-orange-50 border border-orange-200 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Film className="w-4 h-4 text-amber-400" />
                      <span>Manage Drone Tours</span>
                    </button>
                  </div>
                </div>

                {/* Micro stats ribbon */}
                <div className="mt-6 pt-5 border-t border-orange-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Primary Corridor</span>
                    <span className="font-bold text-slate-900 text-sm">Noida Expressway</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">4K Drone Coverage</span>
                    <span className="font-bold text-amber-400 text-sm">
                      {Math.round((propertiesList.filter(p => p.videoTour?.videoUrl).length / (propertiesList.length || 1)) * 100)}% Published
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Lead Delivery</span>
                    <span className="font-bold text-emerald-400 text-sm">Instant WhatsApp</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Compliance Status</span>
                    <span className="font-bold text-slate-900 text-sm">UP RERA Registered</span>
                  </div>
                </div>
              </div>

              {/* Bento KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Total Properties */}
                <button
                  onClick={() => setActiveTab('properties')}
                  className="bg-white/95 hover:bg-white rounded-2xl p-6 border border-orange-200/80 hover:border-amber-400 shadow-md hover:shadow-lg flex flex-col justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-amber-800 transition-colors uppercase tracking-wider">
                      Properties Portfolio
                    </span>
                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 border border-amber-300 group-hover:scale-110 transition-transform">
                      <Building className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900">{propertiesList.length}</div>
                    <div className="text-[11px] text-slate-600 mt-1">High-yield luxury developments</div>
                  </div>
                  <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Manage all listings</span> &rarr;
                  </span>
                </button>

                {/* 4K Drone Tours */}
                <button
                  onClick={() => setActiveTab('drone_tours')}
                  className="bg-white/95 hover:bg-white rounded-2xl p-6 border border-orange-200/80 hover:border-amber-400 shadow-md hover:shadow-lg flex flex-col justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-amber-800 transition-colors uppercase tracking-wider">
                      4K Drone Tours
                    </span>
                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 border border-amber-300 group-hover:scale-110 transition-transform">
                      <Film className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl sm:text-4xl font-black text-amber-400">
                      {propertiesList.filter(p => p.videoTour?.videoUrl).length}
                      <span className="text-xs font-bold text-slate-500 ml-2">Active</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">UHD aerial footage live</div>
                  </div>
                  <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Upload or edit tours</span> &rarr;
                  </span>
                </button>

                {/* Leads & Inquiries */}
                <button
                  onClick={() => setActiveTab('inquiries')}
                  className="bg-white/95 hover:bg-orange-50 rounded-2xl p-6 border border-orange-200 shadow-xl flex flex-col justify-between text-left hover:border-blue-500/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-300 transition-colors uppercase tracking-wider">
                      VIP Client Leads
                    </span>
                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 border border-amber-300 group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900">
                      {brochureLeads.length > 0 ? brochureLeads.length : '16'}
                      <span className="text-xs font-bold text-emerald-400 ml-2">Live</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">Direct WhatsApp notifications</div>
                  </div>
                  <span className="text-xs text-blue-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open lead inbox</span> &rarr;
                  </span>
                </button>

                {/* System & SEO */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className="bg-white/95 hover:bg-orange-50 rounded-2xl p-6 border border-orange-200 shadow-xl flex flex-col justify-between text-left hover:border-emerald-500/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
                      Portal Security
                    </span>
                    <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 border border-emerald-300 group-hover:scale-110 transition-transform">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400">100%</div>
                    <div className="text-[11px] text-slate-600 mt-1">2FA TOTP & SEO Active</div>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Manage security settings</span> &rarr;
                  </span>
                </button>
              </div>

              {/* Quick Command Hub & Recent Properties */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                
                {/* Quick Actions Panel */}
                <div className="bg-white/95 rounded-2xl border border-orange-200 shadow-xl overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-orange-200/80 flex items-center justify-between bg-[#FFF3EB]">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Quick Command Shortcuts</h3>
                    </div>
                    <span className="text-[11px] text-slate-500">Instant publish</span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3">
                    <button
                      onClick={() => {
                        setEditingProperty(null);
                        setActiveTab('add_property');
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-orange-200 bg-[#FFF8F4] hover:bg-orange-50 hover:border-amber-500/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 block">
                            Add New Property Listing
                          </span>
                          <span className="text-[11px] text-slate-500">Configure cover image, pricing, amenities, and floor plans</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    <button
                      onClick={() => setActiveTab('drone_tours')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-orange-200 bg-[#FFF8F4] hover:bg-orange-50 hover:border-amber-500/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                          <Film className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 block">
                            Upload / Configure 4K Drone Tour
                          </span>
                          <span className="text-[11px] text-slate-500">Add aerial video walkthroughs to property showcase</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    <button
                      onClick={() => setActiveTab('website_content')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-orange-200 bg-[#FFF8F4] hover:bg-orange-50 hover:border-amber-500/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 block">
                            Edit Hero Headline & Live Ticker
                          </span>
                          <span className="text-[11px] text-slate-500">Customize announcement bar and marketing tagline</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    <button
                      onClick={() => setActiveTab('agency_contact')}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-orange-200 bg-[#FFF8F4] hover:bg-orange-50 hover:border-amber-500/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-700 block">
                            Update WhatsApp & Hotline Routing
                          </span>
                          <span className="text-[11px] text-slate-500">Receive lead inquiries instantly on your personal number</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>
                </div>

                {/* Recent Properties Showcase */}
                <div className="bg-white/95 rounded-2xl border border-orange-200 shadow-xl overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-orange-200/80 flex items-center justify-between bg-[#FFF3EB]">
                    <div className="flex items-center gap-2.5">
                      <Building className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Portfolio Spotlight</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('properties')}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({propertiesList.length})</span> &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-orange-100/70">
                    {propertiesList.slice(0, 4).map(prop => (
                      <div key={prop.id} className="p-4 flex items-center justify-between hover:bg-orange-50 transition-colors gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prop.coverImage}
                            alt={prop.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-orange-200 shadow-md"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">{prop.title}</div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                              <span className="text-amber-700 font-medium">{prop.developer}</span>
                              <span>&bull;</span>
                              <span>{prop.sector}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-extrabold text-amber-400">{prop.priceDisplay}</span>
                          <button
                            onClick={() => {
                              setEditingProperty(prop);
                              setActiveTab('add_property');
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
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

          {/* TAB: PROPERTIES PORTFOLIO MANAGER */}
          {activeTab === 'properties' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Building className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-xl font-bold text-slate-900">All Live Properties ({propertiesList.length})</h2>
                      <p className="text-xs text-slate-500">
                        Manage listing details, high-resolution photo galleries, 4K aerial drone tours, and pricing.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setActiveTab('add_property');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Listing</span>
                </button>
              </div>

              {/* Search & Sector Filters Bar */}
              <div className="bg-white/95 border border-orange-200 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={propertySearchQuery}
                    onChange={(e) => setPropertySearchQuery(e.target.value)}
                    placeholder="Search properties by title, developer, or sector (e.g. Godrej, 150, Express)..."
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-orange-200 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                  {propertySearchQuery && (
                    <button
                      onClick={() => setPropertySearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sector Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPropertySectorFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      propertySectorFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-orange-50 text-slate-700 hover:text-slate-900 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    All Sectors ({propertiesList.length})
                  </button>
                  <button
                    onClick={() => setPropertySectorFilter('central')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      propertySectorFilter === 'central'
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-orange-50 text-slate-700 hover:text-slate-900 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    Central Noida
                  </button>
                  <button
                    onClick={() => setPropertySectorFilter('expressway')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      propertySectorFilter === 'expressway'
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-orange-50 text-slate-700 hover:text-slate-900 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    Noida Expressway
                  </button>
                  <button
                    onClick={() => setPropertySectorFilter('jewar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      propertySectorFilter === 'jewar'
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-orange-50 text-slate-700 hover:text-slate-900 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    Yamuna / Jewar
                  </button>
                </div>
              </div>

              {/* Luxury Obsidian Properties Table */}
              <div className="bg-white/95 border border-orange-200 rounded-2xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="bg-orange-50/70 border-b border-orange-200 text-[11px] uppercase tracking-wider text-slate-700 font-bold">
                        <th className="p-4 font-bold">Property Listing</th>
                        <th className="p-4 font-bold">Sector Corridor</th>
                        <th className="p-4 font-bold">Base Price</th>
                        <th className="p-4 font-bold">4K Drone Tour</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100/70">
                      {filteredProperties.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-sm text-slate-500">
                            <Building className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            No properties match your filter "{propertySearchQuery}".
                            <div className="mt-3">
                              <button
                                onClick={() => { setPropertySearchQuery(''); setPropertySectorFilter('all'); }}
                                className="px-3.5 py-1.5 text-xs font-bold bg-amber-400 text-slate-950 rounded-lg cursor-pointer"
                              >
                                Reset Filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProperties.map(prop => (
                          <tr key={prop.id} className="hover:bg-orange-50/60 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prop.coverImage}
                                  alt={prop.title}
                                  className="w-13 h-13 rounded-xl object-cover shrink-0 border border-orange-200 shadow-md"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-900">{prop.title}</div>
                                  <div className="text-xs text-amber-700 font-medium mt-0.5">{prop.developer}</div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <span>{(prop.bhkConfigurations && prop.bhkConfigurations.join(', ')) || 'Luxury Residences'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-amber-950 border border-orange-200 font-semibold">
                                <MapPin className="w-3 h-3 text-amber-400" />
                                {prop.sector}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="text-sm font-extrabold text-amber-400">{prop.priceDisplay}</span>
                            </td>

                            <td className="p-4">
                              {prop.videoTour?.videoUrl ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <Film className="w-3 h-3 text-amber-400" />
                                    <span>4K Tour ({prop.videoTour.duration || 'Live'})</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDroneVideo(prop.videoTour!)}
                                    title="Watch Drone Tour"
                                    className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddDroneTour(prop.id)}
                                    title="Edit Drone Tour"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-orange-100 transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDroneTour(prop.id, prop.title)}
                                    disabled={deletingDroneTourId === prop.id}
                                    title="Delete Drone Tour"
                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-40"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddDroneTour(prop.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg bg-orange-50 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-400 border border-amber-300 text-amber-800 transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Drone Tour</span>
                                </button>
                              )}
                            </td>

                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
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
                                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition-all cursor-pointer shadow-sm"
                                >
                                  Edit Listing
                                </button>
                                <button
                                  onClick={() => handleDeleteProperty(prop.id, prop.title)}
                                  disabled={deletingId === prop.id}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {deletingId === prop.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Film className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">4K Drone Aerial Showcase & Video Walkthroughs</h2>
                      <p className="text-xs text-slate-500">
                        Add high-definition aerial footage, upload MP4 video tours, or delete drone walk-throughs for any property.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAddDroneTour()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Drone Tour</span>
                </button>
              </div>

              {/* Status Message */}
              {saveStatus?.tab === 'drone_tours' && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  saveStatus.isError ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                }`}>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveStatus.message}</span>
                </div>
              )}

              {/* Drone Tour Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/95 p-5 rounded-2xl border border-orange-200 shadow-xl">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Drone Tours</div>
                  <div className="mt-2 text-2xl font-black text-amber-400 flex items-center gap-2">
                    <span>{propertiesList.filter(p => p.videoTour?.videoUrl).length}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      {Math.round((propertiesList.filter(p => p.videoTour?.videoUrl).length / (propertiesList.length || 1)) * 100)}% Coverage
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Live 4K aerial tours visible to VIP buyers</p>
                </div>

                <div className="bg-white/95 p-5 rounded-2xl border border-orange-200 shadow-xl">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Drone Coverage</div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {propertiesList.filter(p => !p.videoTour?.videoUrl).length}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Properties ready for new drone tour upload</p>
                </div>

                <div className="bg-white/95 p-5 rounded-2xl border border-orange-200 shadow-xl">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Video Delivery Engine</div>
                  <div className="mt-2 text-2xl font-black text-emerald-400 flex items-center gap-1.5">
                    <span>Direct MP4 / Stream</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Unlimited size video upload & external embeds supported</p>
                </div>
              </div>

              {/* Published Drone Tours Grid */}
              <div className="bg-white/95 border border-orange-200 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-orange-200/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Published Property Drone Tours</h3>
                    <p className="text-xs text-slate-500">Preview, modify or permanently delete drone videos from the property showcase.</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                    {propertiesList.filter(p => p.videoTour?.videoUrl).length} Published
                  </span>
                </div>

                {propertiesList.filter(p => p.videoTour?.videoUrl).length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl border border-dashed border-orange-200 bg-white">
                    <Film className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-900">No active drone tours yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Upload your first drone footage or paste a video link to activate the 4K aerial tour experience for buyers.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddDroneTour()}
                      className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      + Add First Drone Tour
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {propertiesList.filter(p => p.videoTour?.videoUrl).map(prop => {
                      const tour = prop.videoTour!;
                      return (
                        <div key={prop.id} className="group relative rounded-2xl border border-orange-200 overflow-hidden bg-[#FFF8F4] shadow-xl hover:border-amber-500/40 transition-all flex flex-col">
                          {/* Video Thumbnail Header */}
                          <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                            <img
                              src={tour.thumbnailUrl || prop.coverImage || ''}
                              alt={tour.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = prop.coverImage || '';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setPreviewDroneVideo(tour)}
                                className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 flex items-center justify-center transition-all hover:scale-110 shadow-lg cursor-pointer"
                                title="Play Video"
                              >
                                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                              </button>
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-amber-300 border border-amber-400/30">
                              4K UHD
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-bold text-slate-900">
                              {tour.duration || 'Custom'}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                                {prop.sector} &bull; {prop.developer}
                              </div>
                              <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mt-0.5">
                                {prop.title}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {tour.title || tour.description || '4K Aerial Drone Tour'}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-orange-200/80 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDroneVideo(tour)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-amber-400" />
                                <span>Watch</span>
                              </button>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddDroneTour(prop.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-orange-100 text-slate-700 hover:text-slate-900 border border-orange-200 shadow-xs transition-colors cursor-pointer"
                                  title="Edit Video URL or Details"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDroneTour(prop.id, prop.title)}
                                  disabled={deletingDroneTourId === prop.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Delete Drone Tour"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{deletingDroneTourId === prop.id ? '...' : 'Delete'}</span>
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

              {/* Properties Awaiting Drone Tours Tray */}
              <div className="bg-white/95 border border-orange-200 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-orange-200/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Properties Awaiting 4K Drone Tour</h3>
                    <p className="text-xs text-slate-500">Quickly upload or assign a drone video tour to any of these listings.</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                    {propertiesList.filter(p => !p.videoTour?.videoUrl).length} Pending
                  </span>
                </div>

                {propertiesList.filter(p => !p.videoTour?.videoUrl).length === 0 ? (
                  <div className="p-6 text-center text-xs text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/30 font-semibold">
                    🎉 All active properties currently have 4K Drone Tours assigned!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {propertiesList.filter(p => !p.videoTour?.videoUrl).map(prop => (
                      <div key={prop.id} className="p-3.5 rounded-xl border border-orange-200 bg-[#FFF3EB] hover:border-amber-500/40 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prop.coverImage}
                            alt={prop.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-orange-200"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{prop.title}</h4>
                            <p className="text-[11px] text-slate-500 truncate">{prop.sector} &bull; {prop.priceDisplay}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenAddDroneTour(prop.id)}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition-all shadow-md cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Tour</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ADD / EDIT PROPERTY FORM */}
          {activeTab === 'add_property' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => {
                  setEditingProperty(null);
                  setActiveTab('properties');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 mb-6 transition-colors cursor-pointer bg-white hover:bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-200 shadow-xs w-fit text-amber-800"
              >
                &larr; Back to Properties Portfolio
              </button>
              <div className="bg-white/95 rounded-2xl border border-orange-200 shadow-2xl overflow-hidden relative min-h-[600px] p-2 sm:p-4">
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
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Hero Section & Website Public Content</h2>
                  <p className="text-xs text-slate-500">Edit headlines, announcement bar, hero badge, and primary stats counters. Changes appear instantly across the website.</p>
                </div>
                {saveStatus?.tab === 'website_content' && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    saveStatus.isError ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{saveStatus.message}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveWebsiteContent} noValidate className="space-y-6">
                <div className="bg-white/95 border border-orange-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">

                  {/* Hero Headline & Subtitle */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Hero Main Typography & Messaging
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">
                          Top Badge Text
                        </label>
                        <input
                          type="text"
                          value={heroForm.badge}
                          onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          placeholder="e.g. OFFICIAL RERA ADVISORY & CHANNEL PARTNER"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">
                          Main Hero Headline
                        </label>
                        <input
                          type="text"
                          value={heroForm.title}
                          onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                          placeholder="e.g. Exceptional Residences & High-Yield Commercials Across Noida"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">
                          Hero Subtitle / Description
                        </label>
                        <textarea
                          rows={3}
                          value={heroForm.subtitle}
                          onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          placeholder="Describe the agency's primary advisory focus..."
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">
                          Top Live Announcement Ticker (Optional - leave blank to hide)
                        </label>
                        <input
                          type="text"
                          value={heroForm.announcementText}
                          onChange={(e) => setHeroForm({ ...heroForm, announcementText: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          placeholder="e.g. ⚡ Jewar International Airport Commercial & Residential Boom..."
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-orange-200" />

                  {/* Buttons */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">
                      Call-to-Action Buttons
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Primary Button Label</label>
                        <input
                          type="text"
                          value={heroForm.siteVisitButtonText}
                          onChange={(e) => setHeroForm({ ...heroForm, siteVisitButtonText: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="Schedule Free Site Visit"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Secondary Button Label</label>
                        <input
                          type="text"
                          value={heroForm.droneTourButtonText}
                          onChange={(e) => setHeroForm({ ...heroForm, droneTourButtonText: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="Watch 4K Drone Tour"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-orange-200" />

                  {/* Primary Stats */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">
                      Key Impact Counters (Homepage Stats)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {statsForm.map((stat, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-xl border border-orange-200 space-y-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Counter Value</label>
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => {
                                const next = [...statsForm];
                                next[idx] = { ...next[idx], value: e.target.value };
                                setStatsForm(next);
                              }}
                              className="w-full px-3 py-1.5 text-sm rounded-lg border border-orange-200 bg-white/95 text-slate-900 font-bold text-amber-400"
                              placeholder="e.g. 150+"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Label Caption</label>
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => {
                                const next = [...statsForm];
                                next[idx] = { ...next[idx], label: e.target.value };
                                setStatsForm(next);
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-orange-200 bg-white/95 text-slate-200"
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
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Website Content</span>
                    </button>
                  </div>

                </div>
              </form>
            </div>
          )}

          {/* TAB: EDIT AGENCY CONTACT & HOTLINE */}
          {activeTab === 'agency_contact' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Agency Profile & Hotline Numbers</h2>
                  <p className="text-xs text-slate-500">Configure client phone hotlines, WhatsApp routing number, UP RERA registration, and office address.</p>
                </div>
                {saveStatus?.tab === 'agency_contact' && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    saveStatus.isError ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{saveStatus.message}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveAgencySettings} noValidate className="space-y-6">
                <div className="bg-white/95 border border-orange-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">

                  {/* Agency Identity */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Agency Identity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Agency Name</label>
                        <input
                          type="text"
                          value={agencyForm.name}
                          onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="KR Estate Noida"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Tagline</label>
                        <input
                          type="text"
                          value={agencyForm.tagline}
                          onChange={(e) => setAgencyForm({ ...agencyForm, tagline: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="Premier Real Estate Advisory & Channel Partner"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-orange-200" />

                  {/* Contact Routing */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Direct Contact Numbers & Leads</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Primary Hotline Phone</label>
                        <input
                          type="text"
                          value={agencyForm.phone}
                          onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="+91 78704 33580"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">WhatsApp Lead Number (No + sign)</label>
                        <input
                          type="text"
                          value={agencyForm.whatsapp}
                          onChange={(e) => setAgencyForm({ ...agencyForm, whatsapp: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="917870433580"
                        />
                        <span className="text-[11px] text-slate-500">All PDF brochure and pricing inquiries are dispatched to this WhatsApp.</span>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Lead Receiving Email</label>
                        <input
                          type="email"
                          value={agencyForm.email}
                          onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="avinashmehra5292@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">UP RERA Agent Registration</label>
                        <input
                          type="text"
                          value={agencyForm.reraNumber}
                          onChange={(e) => setAgencyForm({ ...agencyForm, reraNumber: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="UPRERAAGT12894"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-orange-200" />

                  {/* Address & Meta */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Office Location & Experience</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Physical Office Address</label>
                        <input
                          type="text"
                          value={agencyForm.address}
                          onChange={(e) => setAgencyForm({ ...agencyForm, address: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="Expressway Business Corridor, Sector 142..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Advisory Experience (Years)</label>
                          <input
                            type="text"
                            value={agencyForm.experienceYears}
                            onChange={(e) => setAgencyForm({ ...agencyForm, experienceYears: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                            placeholder="12+"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Official Domain</label>
                          <input
                            type="text"
                            value={agencyForm.domain}
                            onChange={(e) => setAgencyForm({ ...agencyForm, domain: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                            placeholder="krestatenoida.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Agency & Contact Info</span>
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
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Noida Micro-Market & Corridor Intelligence</h2>
                  <p className="text-xs text-slate-500">Edit average price per sq.ft, 3-year projected growth, metro connectivity, highlights and descriptions for each corridor.</p>
                </div>
                <div className="flex items-center gap-3">
                  {saveStatus?.tab === 'locality_guides' && (
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                      saveStatus.isError ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{saveStatus.message}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateNewLocality}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 transition-all shadow-md cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Corridor</span>
                  </button>
                </div>
              </div>

              {/* Corridor Sub-Selector Chips */}
              <div className="flex flex-wrap items-center gap-2 p-2 bg-white/95 rounded-2xl border border-orange-200 shadow-xl">
                {localitiesList.map((loc, idx) => (
                  <button
                    key={loc.id || idx}
                    type="button"
                    onClick={() => setSelectedLocalityIdx(idx)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedLocalityIdx === idx
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-700 hover:text-slate-900 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    {loc.name || `Corridor ${idx + 1}`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleCreateNewLocality}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-dashed border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Add New</span>
                </button>
              </div>

              {activeLocality && (
                <form onSubmit={handleSaveLocality} noValidate className="space-y-6">
                  <div className="bg-white/95 border border-orange-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">

                    {/* Active corridor status header */}
                    <div className="flex items-center justify-between pb-4 border-b border-orange-200">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/25">
                          Corridor #{selectedLocalityIdx + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {activeLocality.name || 'Untitled Corridor'}
                        </span>
                      </div>
                      {localitiesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLocality(selectedLocalityIdx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                          title="Delete this corridor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Corridor</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Corridor Name</label>
                        <input
                          type="text"
                          value={activeLocality.name || ''}
                          onChange={(e) => handleUpdateCurrentLocality('name', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="e.g. Sector 150 (Sports City)"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Subtitle / Badge</label>
                        <input
                          type="text"
                          value={activeLocality.subtitle || ''}
                          onChange={(e) => handleUpdateCurrentLocality('subtitle', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                          placeholder="e.g. Noida’s Green Lung & Luxury Sports Hub"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Average Price / Sq.Ft</label>
                        <input
                          type="text"
                          value={activeLocality.avgPricePerSqFt || ''}
                          onChange={(e) => handleUpdateCurrentLocality('avgPricePerSqFt', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white font-bold text-amber-400"
                          placeholder="₹12,000 – ₹16,500 / sq.ft"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">3-Year Projected Capital Appreciation</label>
                        <input
                          type="text"
                          value={activeLocality.projectedGrowth3Yr || ''}
                          onChange={(e) => handleUpdateCurrentLocality('projectedGrowth3Yr', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white font-bold text-emerald-400"
                          placeholder="+32% Capital Appreciation"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Corridor Narrative & Strategic Appraisal</label>
                      <textarea
                        rows={4}
                        value={activeLocality.description || ''}
                        onChange={(e) => handleUpdateCurrentLocality('description', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 leading-relaxed"
                        placeholder="Detailed market overview, low-density zoning, investor appeal..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Metro & Transit Connectivity</label>
                      <input
                        type="text"
                        value={activeLocality.metroConnectivity || ''}
                        onChange={(e) => handleUpdateCurrentLocality('metroConnectivity', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                        placeholder="Sector 148 Aqua Line Metro Station (1 km away)"
                      />
                    </div>

                    {/* Highlights */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">
                        Corridor Key Highlights (One per line)
                      </label>
                      <textarea
                        rows={4}
                        value={activeLocality.highlights?.join('\n') || ''}
                        onChange={(e) => handleUpdateCurrentLocality('highlights', e.target.value.split('\n').filter(Boolean))}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 font-mono text-xs"
                        placeholder="80% Open Green Space&#10;Signal-Free Transit to Jewar International Airport&#10;Luxury projects by ACE, Godrej, ATS"
                      />
                    </div>

                    {/* Top Projects */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">
                        Benchmark Projects (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={activeLocality.topProjects?.join(', ') || ''}
                        onChange={(e) => handleUpdateCurrentLocality('topProjects', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                        placeholder="ACE Starlit, Godrej Palm Retreat, ATS Pristine"
                      />
                    </div>

                    {/* Regional Landmarks */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">
                        Key Regional Landmarks (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={activeLocality.landmarkAttractions?.join(', ') || ''}
                        onChange={(e) => handleUpdateCurrentLocality('landmarkAttractions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                        placeholder="Shaheed Bhagat Singh Park, International Cricket Stadium Project"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-orange-200">
                      <button
                        type="button"
                        onClick={handleCreateNewLocality}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Another Corridor</span>
                      </button>

                      <button
                        type="submit"
                        disabled={loadingLocalities}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{loadingLocalities ? 'Saving Guide...' : 'Save All Locality Guides'}</span>
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
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg hover:bg-rose-500/20 transition-all cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-orange-200 text-slate-700 rounded-lg hover:bg-orange-50 hover:text-slate-900 shadow-xs transition-all cursor-pointer"
                    title="Refresh latest leads"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-400 transition-transform ${loadingLeads ? 'animate-spin' : ''}`} />
                    <span>{loadingLeads ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white/95 border border-orange-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left border-collapse">
                    <thead>
                      <tr className="bg-orange-50/70 border-b border-orange-200 text-[11px] uppercase tracking-wider text-slate-700 font-bold">
                        <th className="p-4 font-bold">Client Details</th>
                        <th className="p-4 font-bold">Contact Info</th>
                        <th className="p-4 font-bold">Property / Interest</th>
                        <th className="p-4 font-bold">Client Comment / Schedule</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100/70">
                      {brochureLeads.length > 0 ? (
                        brochureLeads.map((lead, i) => (
                          <tr key={lead.id || i} className="hover:bg-orange-50/60 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{lead.name}</span>
                                {lead.leadType === 'Site Visit' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                    Site Visit
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 shrink-0">
                                    Brochure
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Today'}
                              </div>
                            </td>
                            <td className="p-4 text-xs">
                              <div className="font-bold text-slate-900">{lead.phone}</div>
                              <div className="text-slate-500">{lead.email}</div>
                            </td>
                            <td className="p-4 text-xs">
                              <div className="font-bold text-amber-400">{lead.propertyTitle}</div>
                              <div className="text-[11px] text-slate-500">{lead.sector} • {lead.priceDisplay}</div>
                            </td>
                            <td className="p-4 text-xs text-slate-300 max-w-xs">
                              <p className="line-clamp-2">{lead.comment || 'Complete digital brochure requested.'}</p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                lead.leadType === 'Site Visit' || lead.status === 'Visit Booked'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
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
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>WhatsApp</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
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
                          <td colSpan={6} className="p-12 text-center text-sm text-slate-500">
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
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Portal Security & SEO Settings</h2>
                  <p className="text-xs text-slate-500">Control search engine rankings, meta tags, administrator credentials, and 2FA protection.</p>
                </div>
                {saveStatus?.tab === 'settings' && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                    saveStatus.isError ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{saveStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="bg-white/95 border border-orange-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">

                {/* SEO Metadata */}
                <form onSubmit={handleSaveSeoSettings} noValidate className="space-y-4">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Search Engine Optimization (SEO)</h3>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Global Site Title</label>
                    <input
                      type="text"
                      value={seoForm.title}
                      onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                      placeholder="KR Estate Noida | Premier Real Estate Advisory"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Site Meta Description</label>
                    <textarea
                      rows={3}
                      value={seoForm.metaDescription}
                      onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                      placeholder="Leading real estate consultancy in Noida & Greater Noida..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Footer Copyright Line</label>
                    <input
                      type="text"
                      value={seoForm.footerCopyright}
                      onChange={(e) => setSeoForm({ ...seoForm, footerCopyright: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900"
                      placeholder="© 2026 KR Estate Noida. All rights reserved."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save SEO Settings</span>
                    </button>
                  </div>
                </form>

                <hr className="border-orange-200" />

                {/* Security Section */}
                <section>
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Security & Authentication</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Change Password */}
                    <div className="bg-[#FFF3EB] border border-orange-200 rounded-xl p-6">
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Update Admin Password</label>
                          <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={4}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Authenticator Code (if enabled)</label>
                          <input
                            type="text"
                            placeholder="123 456"
                            value={passwordTotp}
                            onChange={(e) => setPasswordTotp(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            maxLength={6}
                          />
                        </div>

                        {passwordStatus === 'error' && (
                          <p className="text-xs font-semibold text-rose-400">{passwordError}</p>
                        )}

                        {passwordStatus === 'success' && (
                          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Password updated!
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={passwordStatus === 'loading'}
                          className="w-full px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 border border-amber-400 rounded-xl transition-all shadow-md font-bold disabled:opacity-50 cursor-pointer"
                        >
                          {passwordStatus === 'loading' ? 'Saving...' : 'Change Password'}
                        </button>
                      </form>
                    </div>

                    {/* TOTP Setup */}
                    <div className="bg-[#FFF3EB] border border-orange-200 rounded-xl p-6 flex flex-col items-start">
                      <h4 className="font-bold text-slate-900 mb-1 text-sm">Two-Factor Authentication</h4>
                      <p className="text-xs text-slate-500 mb-4">
                        Secure your admin dashboard by linking Google Authenticator or Microsoft Authenticator.
                      </p>

                      {!setupTotpData ? (
                        <button
                          type="button"
                          onClick={handleBeginTotpSetup}
                          className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 rounded-xl transition-all shadow-md mt-auto cursor-pointer"
                        >
                          Configure Authenticator
                        </button>
                      ) : (
                        <div className="w-full">
                          {setupStatus === 'success' ? (
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs font-medium border border-emerald-500/30">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              2FA configured successfully!
                            </div>
                          ) : (
                            <form onSubmit={handleConfirmTotpSetup} className="space-y-4">
                              <div className="bg-white p-2 rounded-xl border border-orange-200 flex justify-center">
                                <img src={setupTotpData.qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-slate-700 font-bold block mb-1">Verify 6-digit code</label>
                                <input
                                  required
                                  type="text"
                                  value={setupToken}
                                  onChange={(e) => setSetupToken(e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 tracking-widest text-center"
                                  placeholder="123456"
                                  maxLength={6}
                                />
                              </div>

                              {setupError && <p className="text-xs font-semibold text-rose-400 text-center">{setupError}</p>}

                              <button
                                type="submit"
                                disabled={setupStatus === 'loading'}
                                className="w-full px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white/95 border border-orange-200 text-slate-900 rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden shadow-2xl flex flex-col relative">

            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-orange-200 bg-[#FFF3EB]">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                {expandedCard === 'properties' && <><Building className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> Total Properties List</>}
                {expandedCard === 'visits' && <><Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Site Visit Requests</>}
                {expandedCard === 'valuations' && <><Activity className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" /> Active Valuations</>}
              </h3>
              <button onClick={() => setExpandedCard(null)} className="p-1.5 sm:p-2 rounded-full hover:bg-orange-100 transition-colors cursor-pointer text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto overflow-x-auto p-0 flex-1">
              <table className="w-full min-w-[480px] text-left border-collapse">
                <thead className="bg-orange-50/90 backdrop-blur-xs sticky top-0 border-b border-orange-200">
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
                <tbody className="divide-y divide-orange-100/70">
                  {expandedCard === 'properties' && NOIDA_PROPERTIES.map(prop => (
                    <tr key={prop.id} className="hover:bg-orange-50/60 transition-colors">
                      <td className="p-4 font-bold text-sm text-slate-900">{prop.title}</td>
                      <td className="p-4 text-sm text-slate-700">{prop.sector}</td>
                      <td className="p-4 text-sm font-bold text-amber-400">{prop.priceDisplay}</td>
                    </tr>
                  ))}

                  {expandedCard === 'visits' && [
                    { id: 1, name: 'Mr. A. Sharma', phone: '+91 98710 44XXX', interest: 'Godrej Woods', date: 'Oct 7, 2026' },
                    { id: 2, name: 'Mrs. N. Gupta', phone: '+91 99100 22XXX', interest: 'Cleo County', date: 'Oct 7, 2026' },
                    { id: 3, name: 'Dr. V. Singh', phone: '+91 98111 88XXX', interest: 'Jewar Plots', date: 'Oct 6, 2026' },
                    { id: 4, name: 'R. Kapoor', phone: '+91 99999 55XXX', interest: 'ATS Knightsbridge', date: 'Oct 5, 2026' },
                  ].map(v => (
                    <tr key={v.id} className="hover:bg-orange-50/60 transition-colors">
                      <td className="p-4 font-bold text-sm text-slate-900">{v.name}</td>
                      <td className="p-4 text-sm text-slate-700">{v.phone}</td>
                      <td className="p-4 text-sm text-amber-400">{v.interest}</td>
                      <td className="p-4 text-sm text-slate-500">{v.date}</td>
                    </tr>
                  ))}

                  {expandedCard === 'valuations' && [
                    { id: 1, details: '3 BHK, 1850 sq.ft.', location: 'Sector 137', client: 'P. Verma', date: 'Oct 7, 2026' },
                    { id: 2, details: 'Commercial Shop, 500 sq.ft.', location: 'Bhutani Cyberthum', client: 'K. Agarwal', date: 'Oct 6, 2026' },
                    { id: 3, details: '4 BHK Penthouse', location: 'Sector 150', client: 'S. Mehta', date: 'Oct 4, 2026' },
                  ].map(v => (
                    <tr key={v.id} className="hover:bg-orange-50/60 transition-colors">
                      <td className="p-4 font-bold text-sm text-slate-900">{v.details}</td>
                      <td className="p-4 text-sm text-slate-700">{v.location}</td>
                      <td className="p-4 text-sm text-amber-400">{v.client}</td>
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
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white/95 border border-orange-200 text-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-orange-200 flex items-center justify-between bg-[#FFF3EB]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
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
                  placeholder="e.g. Godrej Woods 4K Aerial Showcase & Forest Walkthrough"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Video URL & File Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Video URL / MP4 File Source *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={droneTourForm.videoUrl}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://.../drone-tour.mp4 or /videos/property-drone.mp4"
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <input
                    type="file"
                    ref={droneFileInputRef}
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleUploadDroneFile}
                  />
                  <button
                    type="button"
                    disabled={isUploadingDroneVideo}
                    onClick={() => droneFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingDroneVideo ? 'Uploading...' : 'Upload MP4'}</span>
                  </button>
                </div>
                {droneUploadStatus && (
                  <p className="text-xs text-amber-700 font-medium">{droneUploadStatus}</p>
                )}
              </div>

              {/* Thumbnail URL & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Poster Thumbnail Image URL
                  </label>
                  <input
                    type="text"
                    value={droneTourForm.thumbnailUrl}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                    placeholder="/images/properties/... or https://..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Video Duration (MM:SS)
                  </label>
                  <input
                    type="text"
                    value={droneTourForm.duration}
                    onChange={(e) => setDroneTourForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="02:45"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-orange-200 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Live Preview if URL Present */}
              {droneTourForm.videoUrl && (
                <div className="p-3 bg-black rounded-xl space-y-1.5 border border-orange-200">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>Live Video Player Preview</span>
                  </div>
                  <video
                    src={droneTourForm.videoUrl}
                    controls
                    className="w-full max-h-48 rounded-lg bg-black object-contain"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-orange-200 flex items-center justify-end gap-3">
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer mr-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Tour</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDroneTourModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-900 hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={droneActionLoading || isUploadingDroneVideo}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{droneActionLoading ? 'Saving Tour...' : 'Save & Publish Drone Tour'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIDEO LIGHTBOX PREVIEW */}
      {previewDroneVideo && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-[#FFF8F4] rounded-2xl border border-orange-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-white border-b border-orange-200 flex items-center justify-between text-slate-900">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Film className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{previewDroneVideo.title}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{previewDroneVideo.duration || '4K UHD Aerial Experience'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDroneVideo(null)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer shrink-0"
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
              <div className="p-4 bg-white border-t border-orange-200 text-xs text-slate-300">
                {previewDroneVideo.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
