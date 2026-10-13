import React, { useState, useRef, useEffect } from 'react';
import { 
  X, CheckCircle, Database, Upload, Star, Trash2, Plus, 
  Play, Compass, MapPin, Sparkles, Building2, Check, Video, Layers, Award
} from 'lucide-react';
import { Property, FloorPlan, PropertyType, PropertyStatus } from '../types';
import { getAdminAuthHeaders } from '../utils/adminAuth';
import { VideoSizeExceededModal } from './VideoSizeExceededModal';

interface AdminPropertyFormProps {
  onClose: () => void;
  inlineMode?: boolean;
  propertyToEdit?: Property | null;
}

const LUXURY_AMENITY_PRESETS = [
  '2 Infinity Edge Pools',
  'Urban Forest Canopy Walk',
  'Turkish Hammam & Spa',
  'Glass Facade Clubhouse',
  'Indoor Badminton & Squash Courts',
  'EV Fast Charging Stations',
  'Multi-tier 24/7 Biometric Security',
  'Kids Forest Adventure Zone',
  'Temperature Controlled All-Weather Pool',
  'Sky Lounge & Cigar Bar',
  'Concierge & Valet Service',
  'Private High-Speed Elevators'
];

export const AdminPropertyForm: React.FC<AdminPropertyFormProps> = ({ 
  onClose, 
  inlineMode = false,
  propertyToEdit = null 
}) => {
  const isEditMode = Boolean(propertyToEdit);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Photo uploads state
  const [uploadFiles, setUploadFiles] = useState<{ id: string; name: string; base64: string }[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<{ url: string; caption: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoUrlInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState<string>('');
  const [sizeExceededModal, setSizeExceededModal] = useState<{
    isOpen: boolean;
    sizeMb: number;
    fileName: string;
  }>({
    isOpen: false,
    sizeMb: 0,
    fileName: ''
  });

  // Amenity temporary input states
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [customBulkAmenities, setCustomBulkAmenities] = useState('');

  // At least 8 custom location advantage slots state (two categories: Header and Answer)
  interface LocationAdvantagePair {
    label: string;
    value: string;
  }

  const initializeCustomLocationPairs = (prop?: Property | null): LocationAdvantagePair[] => {
    const pairs: LocationAdvantagePair[] = [];
    
    if (prop?.locationAdvantages && prop.locationAdvantages.length > 0) {
      prop.locationAdvantages.forEach(item => {
        pairs.push({ label: item.label || '', value: item.value || '' });
      });
    } else if (prop) {
      if (prop.distanceToMetro) {
        pairs.push({ label: 'Metro Network Distance', value: prop.distanceToMetro });
      }
      if (prop.distanceToAirport) {
        pairs.push({ label: 'Jewar International Airport Distance', value: prop.distanceToAirport });
      }
      if (prop.distanceToExpressway) {
        pairs.push({ label: 'Expressway Access Distance', value: prop.distanceToExpressway });
      }
      if (prop.highlights && prop.highlights.length > 0) {
        prop.highlights.forEach(h => {
          if (h.includes(':')) {
            const [lbl, ...val] = h.split(':');
            pairs.push({ label: lbl.trim(), value: val.join(':').trim() });
          } else if (h.includes(' - ')) {
            const [lbl, ...val] = h.split(' - ');
            pairs.push({ label: lbl.trim(), value: val.join(' - ').trim() });
          } else if (h.trim()) {
            pairs.push({ label: 'Location Advantage', value: h.trim() });
          }
        });
      }
    }

    while (pairs.length < 8) {
      pairs.push({ label: '', value: '' });
    }
    return pairs;
  };

  const [customLocationPairs, setCustomLocationPairs] = useState<LocationAdvantagePair[]>(() => initializeCustomLocationPairs(propertyToEdit));
  const [customBulkLocationText, setCustomBulkLocationText] = useState('');
  const [showBulkLocation, setShowBulkLocation] = useState(false);

  // Initial state factory
  const getInitialFormData = (prop?: Property | null): Partial<Property> => {
    if (prop) {
      return {
        ...prop,
        floorPlans: prop.floorPlans || [],
        highlights: prop.highlights || [],
        amenities: prop.amenities || [],
        bhkConfigurations: prop.bhkConfigurations || ['3 BHK'],
        videoTour: prop.videoTour || {
          title: '',
          videoUrl: '',
          thumbnailUrl: '',
          duration: '',
          description: ''
        }
      };
    }
    return {
      id: `prop-${Date.now()}`,
      title: '',
      developer: '',
      tagline: '',
      sector: '',
      locality: 'Central Noida',
      propertyType: 'luxury_apartment',
      status: 'under_construction',
      possessionDate: 'Mid 2026',
      priceDisplay: '',
      priceNumInCrores: undefined,
      pricePerSqFt: undefined,
      bhkConfigurations: ['3 BHK', '4 BHK'],
      reraNumber: '',
      totalAcres: undefined,
      openGreensPercentage: undefined,
      shortDescription: '',
      fullDescription: '',
      distanceToMetro: '',
      distanceToAirport: '',
      distanceToExpressway: '',
      coverImage: '',
      galleryImages: [],
      highlights: [], // Zero preapplied highlights
      amenities: [
        '2 Infinity Edge Pools',
        'Urban Forest Canopy Walk',
        'Turkish Hammam & Spa',
        'Glass Facade Clubhouse'
      ],
      floorPlans: [
        {
          name: '3 BHK Royal Luxe',
          bedrooms: 3,
          bathrooms: 3,
          carpetAreaSqFt: 1350,
          superAreaSqFt: 1850,
          priceEstimate: '₹2.65 Cr'
        },
        {
          name: '4 BHK Grand Suite',
          bedrooms: 4,
          bathrooms: 4,
          carpetAreaSqFt: 1950,
          superAreaSqFt: 2600,
          priceEstimate: '₹4.20 Cr'
        }
      ],
      videoTour: {
        title: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: '02:30',
        description: ''
      },
      architecturalTheme: {
        accentColor: 'text-amber-500',
        gradient: 'from-slate-900 via-slate-800 to-slate-900',
        iconType: 'tower'
      }
    };
  };

  const [formData, setFormData] = useState<Partial<Property>>(() => getInitialFormData(propertyToEdit));
  const [isVideoPortrait, setIsVideoPortrait] = useState(false);

  useEffect(() => {
    setFormData(getInitialFormData(propertyToEdit));
    setExistingGalleryImages(propertyToEdit?.galleryImages || []);
    setUploadFiles([]);
    setCustomLocationPairs(initializeCustomLocationPairs(propertyToEdit));
  }, [propertyToEdit]);

  // Standard input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'priceNumInCrores' || name === 'pricePerSqFt' || name === 'totalAcres' || name === 'openGreensPercentage')
        ? (value === '' ? undefined : Number(value))
        : value
    }));
  };

  // Video tour change handler
  const handleVideoTourChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      videoTour: {
        title: prev.videoTour?.title || '',
        videoUrl: prev.videoTour?.videoUrl || '',
        thumbnailUrl: prev.videoTour?.thumbnailUrl || '',
        duration: prev.videoTour?.duration || '02:00',
        description: prev.videoTour?.description || '',
        [name]: value
      }
    }));
  };

  // Video file upload handler (no storage or duration limit)
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > 50) {
      setSizeExceededModal({
        isOpen: true,
        sizeMb: fileSizeMb,
        fileName: file.name
      });
      setError(`Video file is too large (${fileSizeMb.toFixed(1)} MB). Direct upload limit is 50MB. Please paste a YouTube or Google Drive link.`);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadStatus(`Preparing ${file.name} (${fileSizeMb.toFixed(1)} MB)...`);

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
        setVideoUploadStatus(`Uploading ${file.name} directly to cloud storage (${fileSizeMb.toFixed(1)} MB)...`);

        const uploadRes = await fetch(slotData.signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'video/mp4'
          },
          body: file
        });

        if (!uploadRes.ok) {
          if (uploadRes.status === 413) {
            throw new Error(`Video file exceeds cloud storage size limit (50MB). Please compress the video to under 50MB or paste a link.`);
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
        setVideoUploadStatus(`Uploading ${file.name} to server (${fileSizeMb.toFixed(1)} MB)...`);
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
            throw new Error(`Video file is too large (${fileSizeMb.toFixed(1)} MB). Please compress the video to under 50MB or paste a video link.`);
          }
          throw new Error(data?.error || `Upload failed (HTTP ${res.status}). Please try again or paste a link.`);
        }

        finalVideoUrl = data.videoUrl;
      }

      setFormData(prev => ({
        ...prev,
        videoTour: {
          title: prev.videoTour?.title?.trim() || `${prev.title?.trim() || 'Property'} 4K Drone Tour`,
          videoUrl: finalVideoUrl,
          thumbnailUrl: prev.videoTour?.thumbnailUrl || prev.coverImage || '',
          duration: prev.videoTour?.duration || '03:00',
          description: prev.videoTour?.description || `4K aerial inspection and architectural walkthrough of ${prev.title?.trim() || 'this development'}.`
        }
      }));

      setVideoUploadStatus(`Video uploaded successfully! (${fileSizeMb.toFixed(1)} MB)`);
      setTimeout(() => setVideoUploadStatus(''), 4500);
    } catch (err: any) {
      console.error(err);
      if (fileSizeMb > 50 || err.message?.toLowerCase().includes('50mb') || err.message?.toLowerCase().includes('too large') || err.message?.toLowerCase().includes('exceeds')) {
        setSizeExceededModal({
          isOpen: true,
          sizeMb: fileSizeMb,
          fileName: file.name
        });
      }
      setError(`Video upload failed: ${err.message}`);
      setVideoUploadStatus('');
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    setFormData(prev => ({
      ...prev,
      videoTour: {
        title: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: '',
        description: ''
      }
    }));
  };

  // Floor plans handlers
  const handleAddFloorPlan = () => {
    const newPlan: FloorPlan = {
      name: `Plan ${((formData.floorPlans?.length || 0) + 1)}`,
      bedrooms: 3,
      bathrooms: 3,
      carpetAreaSqFt: 1400,
      superAreaSqFt: 1900,
      priceEstimate: '₹2.50 Cr'
    };
    setFormData(prev => ({
      ...prev,
      floorPlans: [...(prev.floorPlans || []), newPlan]
    }));
  };

  const handleUpdateFloorPlan = (idx: number, field: keyof FloorPlan, val: any) => {
    setFormData(prev => {
      const plans = [...(prev.floorPlans || [])];
      plans[idx] = {
        ...plans[idx],
        [field]: (field === 'bedrooms' || field === 'bathrooms' || field === 'carpetAreaSqFt' || field === 'superAreaSqFt')
          ? Number(val)
          : val
      };
      return { ...prev, floorPlans: plans };
    });
  };

  const handleRemoveFloorPlan = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      floorPlans: (prev.floorPlans || []).filter((_, i) => i !== idx)
    }));
  };

  // Amenities handlers with multi-split (comma & newline support) and no limits
  const handleAddAmenity = (name: string) => {
    if (!name) return;
    const splitItems = name
      .split(/[,\n]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (splitItems.length === 0) return;

    setFormData(prev => {
      const current = prev.amenities || [];
      const newItems = splitItems.filter(item => !current.includes(item));
      return {
        ...prev,
        amenities: [...current, ...newItems]
      };
    });
    setNewAmenityInput('');
  };

  const handleBulkAddAmenities = (replace = false) => {
    if (!customBulkAmenities.trim()) return;
    const items = customBulkAmenities
      .split(/[,\n]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (items.length === 0) return;

    setFormData(prev => {
      if (replace) {
        return {
          ...prev,
          amenities: items
        };
      }
      const current = prev.amenities || [];
      const newItems = items.filter(item => !current.includes(item));
      return {
        ...prev,
        amenities: [...current, ...newItems]
      };
    });
    setCustomBulkAmenities('');
  };

  const handleClearAllAmenities = () => {
    setFormData(prev => ({
      ...prev,
      amenities: []
    }));
  };

  const handleRemoveAmenity = (name: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: (prev.amenities || []).filter(a => a !== name)
    }));
  };

  // Custom 8+ Location Advantage Handlers (Header + Answer pairs)
  const handleUpdateLocationPair = (index: number, field: 'label' | 'value', text: string) => {
    setCustomLocationPairs(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: text
      };
      return updated;
    });
  };

  const handleAddLocationPairSlot = () => {
    setCustomLocationPairs(prev => [...prev, { label: '', value: '' }]);
  };

  const handleRemoveLocationPairSlot = (index: number) => {
    setCustomLocationPairs(prev => {
      if (prev.length <= 8) {
        // Keep at least 8 slots, clear content if <= 8
        const updated = [...prev];
        updated[index] = { label: '', value: '' };
        return updated;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClearLocationPairSlot = (index: number) => {
    setCustomLocationPairs(prev => {
      const updated = [...prev];
      updated[index] = { label: '', value: '' };
      return updated;
    });
  };

  const handleClearAllLocationPairs = () => {
    setCustomLocationPairs([
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
      { label: '', value: '' },
    ]);
  };

  const handleApplyBulkLocationPairs = () => {
    if (!customBulkLocationText.trim()) return;
    const lines = customBulkLocationText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const parsedPairs: LocationAdvantagePair[] = lines.map(line => {
      if (line.includes('-->')) {
        const [lbl, ...val] = line.split('-->');
        return { label: lbl.trim(), value: val.join('-->').trim() };
      } else if (line.includes('->')) {
        const [lbl, ...val] = line.split('->');
        return { label: lbl.trim(), value: val.join('->').trim() };
      } else if (line.includes(':')) {
        const [lbl, ...val] = line.split(':');
        return { label: lbl.trim(), value: val.join(':').trim() };
      } else if (line.includes(' - ')) {
        const [lbl, ...val] = line.split(' - ');
        return { label: lbl.trim(), value: val.join(' - ').trim() };
      }
      return { label: 'Location Advantage', value: line };
    });

    setCustomLocationPairs(prev => {
      const updated = [...prev];
      let parsedIdx = 0;
      for (let i = 0; i < updated.length && parsedIdx < parsedPairs.length; i++) {
        if (!updated[i].label.trim() && !updated[i].value.trim()) {
          updated[i] = parsedPairs[parsedIdx++];
        }
      }
      while (parsedIdx < parsedPairs.length) {
        updated.push(parsedPairs[parsedIdx++]);
      }
      while (updated.length < 8) {
        updated.push({ label: '', value: '' });
      }
      return updated;
    });
    setCustomBulkLocationText('');
    setShowBulkLocation(false);
  };

  // BHK configurations toggle
  const handleToggleBhk = (bhk: string) => {
    const current = formData.bhkConfigurations || [];
    if (current.includes(bhk)) {
      setFormData(prev => ({
        ...prev,
        bhkConfigurations: current.filter(b => b !== bhk)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bhkConfigurations: [...current, bhk]
      }));
    }
  };

  // Image Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    setError('');

    const processedPromises = rawFiles.map((file) => {
      return new Promise<{ id: string; name: string; base64: string }>((resolve, reject) => {
        if (file.size > 25 * 1024 * 1024) {
          return reject(new Error(`File ${file.name} is too large (>25MB).`));
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const originalBase64 = event.target?.result as string;
          if (!originalBase64) {
            return resolve({
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              base64: ''
            });
          }

          const img = new Image();
          img.onload = () => {
            const MAX_WIDTH = 1920;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              if (width / height > MAX_WIDTH / MAX_HEIGHT) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              } else {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
              resolve({
                id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                base64: compressedBase64,
              });
            } else {
              resolve({
                id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                base64: originalBase64,
              });
            }
          };
          img.onerror = () => {
            resolve({
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              base64: originalBase64,
            });
          };
          img.src = originalBase64;
        };
        reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
        reader.readAsDataURL(file);
      });
    });

    try {
      const results = await Promise.all(processedPromises);
      setUploadFiles((prev) => [...prev, ...results]);
    } catch (err: any) {
      setError(err.message || 'Error processing selected files');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRemoveExistingImage = (idxToRemove: number) => {
    setExistingGalleryImages(prev => {
      const nextList = prev.filter((_, idx) => idx !== idxToRemove);
      if (prev[idxToRemove]?.url === formData.coverImage) {
        setFormData(f => ({ ...f, coverImage: nextList[0]?.url || '' }));
      }
      return nextList;
    });
  };

  const handleSetExistingAsCover = (url: string) => {
    setFormData(prev => ({ ...prev, coverImage: url }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fallbackLuxuryImage = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
      
      let resolvedCover = '';
      if (uploadFiles.length > 0 && !formData.coverImage) {
        resolvedCover = ''; // server will assign first uploaded image as cover
      } else if (formData.coverImage?.trim()) {
        resolvedCover = formData.coverImage.trim();
      } else if (existingGalleryImages.length > 0) {
        resolvedCover = existingGalleryImages[0].url;
      } else {
        resolvedCover = fallbackLuxuryImage;
      }

      const title = formData.title?.trim() || 'Premier Luxury Residence';
      const sector = formData.sector?.trim() || 'Noida';
      const developer = formData.developer?.trim() || 'Direct Owner / Private';

      const resolvedShortDesc = formData.shortDescription?.trim() || 
        formData.tagline?.trim() || 
        `Ultra-luxury development by ${developer} located in ${sector}, featuring bespoke architectural design, state-of-the-art amenities, and rapid expressway connectivity.`;

      const resolvedFullDesc = formData.fullDescription?.trim() || 
        `${title} sets a new benchmark in luxury living at ${sector}, Noida. Conceived by ${developer}, this distinguished landmark offers expansive floor layouts, panoramic skyline vistas, world-class recreational facilities, and seamless access to central business hubs and upcoming Jewar International Airport.`;

      const cleanedLocationAdvantages = customLocationPairs
        .map(pair => ({
          label: pair.label.trim(),
          value: pair.value.trim()
        }))
        .filter(pair => pair.label.length > 0 || pair.value.length > 0);

      const metroItem = cleanedLocationAdvantages.find(p => p.label.toLowerCase().includes('metro'));
      const airportItem = cleanedLocationAdvantages.find(p => p.label.toLowerCase().includes('airport') || p.label.toLowerCase().includes('jewar'));
      const expresswayItem = cleanedLocationAdvantages.find(p => p.label.toLowerCase().includes('expressway') || p.label.toLowerCase().includes('highway'));

      const resolvedMetro = metroItem ? metroItem.value : (formData.distanceToMetro?.trim() || '');
      const resolvedAirport = airportItem ? airportItem.value : (formData.distanceToAirport?.trim() || '');
      const resolvedExpressway = expresswayItem ? expresswayItem.value : (formData.distanceToExpressway?.trim() || '');

      const resolvedHighlights = cleanedLocationAdvantages.map(p => 
        p.label && p.value ? `${p.label} - ${p.value}` : (p.value || p.label)
      );

      const resolvedRera = (formData.reraNumber?.trim() && formData.reraNumber.trim().toUpperCase() !== 'UPRERA')
        ? formData.reraNumber.trim()
        : `UPRERAPRJ${Math.floor(100000 + Math.random() * 900000)}`;

      const resolvedFloorPlans = (formData.floorPlans && formData.floorPlans.length > 0)
        ? formData.floorPlans
        : [
            {
              name: 'Executive Suite',
              bedrooms: formData.bhkConfigurations?.includes('4 BHK') ? 4 : (formData.bhkConfigurations?.includes('2 BHK') ? 2 : 3),
              bathrooms: 3,
              carpetAreaSqFt: 1150,
              superAreaSqFt: 1680,
              priceEstimate: formData.priceDisplay?.trim() || 'Price on Request'
            },
            {
              name: 'Grand Presidential Suite',
              bedrooms: 4,
              bathrooms: 4,
              carpetAreaSqFt: 1650,
              superAreaSqFt: 2350,
              priceEstimate: formData.priceDisplay?.trim() || 'Price on Request'
            }
          ];

      // Video tour: prioritize user's entry, or omit cleanly if removed/empty
      const hasVideoUrl = Boolean(formData.videoTour?.videoUrl?.trim());
      const cleanVideoTour = hasVideoUrl ? {
        title: formData.videoTour?.title?.trim() || `${title} 4K Drone Tour`,
        videoUrl: formData.videoTour!.videoUrl.trim(),
        thumbnailUrl: formData.videoTour?.thumbnailUrl?.trim() || resolvedCover || fallbackLuxuryImage,
        duration: formData.videoTour?.duration?.trim() || '02:30',
        description: formData.videoTour?.description?.trim() || `Experience the luxury specifications and panoramic views of ${title}.`
      } : undefined;

      const finalData = {
        ...formData,
        title,
        developer,
        sector,
        locality: formData.locality || 'Central Noida',
        priceDisplay: formData.priceDisplay?.trim() || (formData.priceNumInCrores ? `₹${formData.priceNumInCrores} Cr` : 'Price on Request'),
        priceNumInCrores: formData.priceNumInCrores !== undefined ? Number(formData.priceNumInCrores) : 0,
        pricePerSqFt: formData.pricePerSqFt !== undefined ? Number(formData.pricePerSqFt) : 0,
        totalAcres: formData.totalAcres !== undefined ? Number(formData.totalAcres) : 0,
        openGreensPercentage: formData.openGreensPercentage !== undefined ? Number(formData.openGreensPercentage) : 0,
        shortDescription: resolvedShortDesc,
        fullDescription: resolvedFullDesc,
        highlights: resolvedHighlights,
        locationAdvantages: cleanedLocationAdvantages,
        distanceToMetro: resolvedMetro,
        distanceToAirport: resolvedAirport,
        distanceToExpressway: resolvedExpressway,
        reraNumber: resolvedRera,
        floorPlans: resolvedFloorPlans,
        coverImage: resolvedCover,
        galleryImages: existingGalleryImages.length > 0 ? existingGalleryImages : [
          { url: resolvedCover, caption: title || 'Architectural Showcase' }
        ],
        videoTour: cleanVideoTour,
        deleteVideoTour: !hasVideoUrl,
        ...(uploadFiles.length > 0 && {
          uploadedImages: uploadFiles.map(f => ({ name: f.name, base64: f.base64 }))
        })
      };

      const targetUrl = isEditMode ? `/api/admin/properties/${propertyToEdit!.id}` : '/api/admin/properties';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(targetUrl, {
        method,
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(finalData)
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned error (${response.status}). The uploaded images may be too large.`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Failed to save property (status ${response.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full shadow-2xl">
          <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
          <h3 className="text-xl font-bold text-slate-900">
            {isEditMode ? 'Property Updated!' : 'Property Added!'}
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            {isEditMode 
              ? 'All metrics, floor plans & overview details updated successfully. Reloading...' 
              : 'The complete luxury listing has been written to the codebase. Reloading...'}
          </p>
        </div>
      </div>
    );
  }

  const formContent = (
    <div className={`bg-slate-50 text-slate-900 admin-panel flex flex-col relative w-full h-full ${inlineMode ? '' : 'rounded-3xl max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl border border-slate-300'}`}>

      {/* Top Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-700 border border-amber-300">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditMode ? `Edit Property: ${formData.title || 'Listing'}` : 'Add New Luxury Listing'}
            </h2>
            <p className="text-xs text-slate-500">
              Fill in the architectural overview, metrics, floor plans, location advantages, and lifestyle amenities.
            </p>
          </div>
        </div>
        {!inlineMode && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>

      {/* Form Scrollable Body */}
      <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
        {error && <div className="p-3.5 bg-red-100 text-red-700 rounded-xl text-sm border border-red-200 font-medium">{error}</div>}

        <form id="admin-form" onSubmit={handleSubmit} className="space-y-8">

          {/* SECTION: BASIC IDENTITY & PRICING */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                Basic Property Identity & Pricing
              </span>
              <span className="text-xs text-slate-400">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Property Title <span className="text-amber-500">*</span>
                </label>
                <input 
                  required 
                  name="title" 
                  value={formData.title || ''} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                  placeholder="e.g. Godrej Woods" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Developer / Builder <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input 
                  name="developer" 
                  value={formData.developer || ''} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                  placeholder="e.g. Godrej Properties (or leave blank for Direct Owner)" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tagline / Banner Hook
              </label>
              <input 
                name="tagline" 
                value={formData.tagline || ''} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                placeholder="e.g. Private Urban Forest Residences adjacent to Noida Golf Course" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Sector / Address
                </label>
                <input 
                  name="sector" 
                  value={formData.sector || ''} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                  placeholder="e.g. Sector 43" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Locality Corridor
                </label>
                <select
                  name="locality"
                  value={formData.locality || 'Central Noida'}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="Central Noida">Central Noida (Sec 43, 44, 7x)</option>
                  <option value="Noida Expressway">Noida Expressway (Sec 128 - 150)</option>
                  <option value="Sector 150 Sports City">Sector 150 Sports City</option>
                  <option value="Yamuna Expressway">Yamuna Expressway (Jewar Airport)</option>
                  <option value="Greater Noida West">Greater Noida West (Noida Ext.)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Property Category
                </label>
                <select
                  name="propertyType"
                  value={formData.propertyType || 'luxury_apartment'}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  <option value="luxury_apartment">Luxury Apartment</option>
                  <option value="penthouse">Sky Penthouse</option>
                  <option value="villa">Signature Villa / Mansions</option>
                  <option value="commercial">Commercial Hub / High Street</option>
                  <option value="plots">Freehold Plots & Townships</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Price Display String <span className="text-slate-400 font-normal">(e.g. ₹2.65 Cr - ₹6.80 Cr)</span>
                </label>
                <input 
                  name="priceDisplay" 
                  value={formData.priceDisplay || ''} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                  placeholder="e.g. ₹2.65 Cr - ₹6.80 Cr" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Base Price (in Crores)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="priceNumInCrores" 
                  value={formData.priceNumInCrores ?? ''} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                  placeholder="e.g. 2.65" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Possession Timeline
                </label>
                <input 
                  name="possessionDate" 
                  value={formData.possessionDate || ''} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                  placeholder="e.g. Mid 2026 / Ready to Move" 
                />
              </div>
            </div>

            {/* BHK Configurations checkboxes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Available BHK Configurations
              </label>
              <div className="flex flex-wrap gap-2">
                {['2 BHK', '3 BHK', '4 BHK', '5 BHK Penthouse', 'Signature Villa', 'Commercial Suites'].map((bhk) => {
                  const isSelected = formData.bhkConfigurations?.includes(bhk);
                  return (
                    <button
                      key={bhk}
                      type="button"
                      onClick={() => handleToggleBhk(bhk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-xs' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {isSelected ? `✓ ${bhk}` : `+ ${bhk}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 01: PROJECT ARCHITECTURE & OVERVIEW */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                01. Project Architecture & Overview
              </span>
              <span className="text-xs text-slate-400">Detailed property descriptions</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Project Architecture Description
              </label>
              <textarea 
                rows={4}
                name="fullDescription" 
                value={formData.fullDescription || ''} 
                onChange={handleChange} 
                className="w-full p-3.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed" 
                placeholder="e.g. Godrej Woods in Sector 43, Noida brings nature right to your doorstep with an authentic private forest ecosystem of over 1,100 mature trees. Nestled right next to the prestigious Noida Golf Course and just 900m from Botanical Garden Metro Interchange..." 
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Short Description / Key Feature Hook
              </label>
              <input 
                name="shortDescription" 
                value={formData.shortDescription || ''} 
                onChange={handleChange} 
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400" 
                placeholder="e.g. 1,100 dense urban trees, 2 infinity edge swimming pools, elevated walking bridges, and bespoke Turkish hammam bath." 
              />
            </div>
          </div>

          {/* SECTION 02: PROJECT INVARIANTS & METRICS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                02. Project Invariants & Metrics
              </span>
              <span className="text-xs text-slate-400">Campus size, greens %, rate & RERA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Total Campus (Acres)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1" 
                    name="totalAcres" 
                    value={formData.totalAcres ?? ''} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    placeholder="e.g. 11" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">Acres</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Open Greens (%)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="1" 
                    name="openGreensPercentage" 
                    value={formData.openGreensPercentage ?? ''} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-emerald-700" 
                    placeholder="e.g. 78" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">% Green</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Rate / Sq.Ft (₹)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="pricePerSqFt" 
                    value={formData.pricePerSqFt ?? ''} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-700" 
                    placeholder="e.g. 17200" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">₹/Sq.Ft</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  UP RERA Number
                </label>
                <input 
                  name="reraNumber" 
                  value={formData.reraNumber || ''} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 text-sm font-mono font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800" 
                  placeholder="e.g. UPRERAPRJ704730" 
                />
              </div>
            </div>

            {/* 4K Drone Tour & Property Video Section (No storage or duration limit) */}
            <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                    <Video className="w-4 h-4 text-amber-600" />
                    Property Video Tour & Drone Flythrough (Max 50MB per upload · Or paste any link)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload an MP4/WebM video file directly from your computer or paste any video link (YouTube, Vimeo, MP4 stream).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingVideo}
                    onClick={() => videoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingVideo ? 'Uploading Video...' : 'Upload Video File'}</span>
                  </button>
                  {formData.videoTour?.videoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Status / Progress Banner */}
              {videoUploadStatus && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${videoUploadStatus.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                  {isUploadingVideo ? (
                    <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-medium">{videoUploadStatus}</span>
                </div>
              )}

              {/* Video Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Video URL or Stream Link
                  </label>
                  <input 
                    ref={videoUrlInputRef}
                    name="videoUrl" 
                    value={formData.videoTour?.videoUrl || ''} 
                    onChange={handleVideoTourChange} 
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    placeholder="e.g. https://youtube.com/watch?v=... or https://drive.google.com/file/d/... or /uploads/videos/..." 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Duration (No Limit)
                  </label>
                  <input 
                    name="duration" 
                    value={formData.videoTour?.duration || ''} 
                    onChange={handleVideoTourChange} 
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    placeholder="e.g. 03:45 or 15 Mins" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Video Title
                  </label>
                  <input 
                    name="title" 
                    value={formData.videoTour?.title || ''} 
                    onChange={handleVideoTourChange} 
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    placeholder="e.g. 4K Drone Tour & Architectural Flythrough" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Short Description
                  </label>
                  <input 
                    name="description" 
                    value={formData.videoTour?.description || ''} 
                    onChange={handleVideoTourChange} 
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    placeholder="e.g. Experience panoramic aerial views and luxury specifications..." 
                  />
                </div>
              </div>

              {/* Live Video Preview if URL exists */}
              {formData.videoTour?.videoUrl && (
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Play className="w-3 h-3 text-amber-500" />
                      Live Video Preview
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.videoTour.videoUrl.startsWith('http') ? 'Streaming URL' : 'Local Uploaded Video'}
                    </span>
                  </div>
                  <div className={`relative ${isVideoPortrait ? 'aspect-[9/16] max-h-72 mx-auto' : 'aspect-video max-h-56 w-full'} rounded-xl overflow-hidden bg-black border border-slate-200 shadow-inner flex items-center justify-center transition-all`}>
                    {isVideoPortrait && (
                      <video
                        src={formData.videoTour.videoUrl}
                        muted
                        playsInline
                        autoPlay
                        loop
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                      />
                    )}
                    {formData.videoTour.videoUrl.includes('youtube.com') || formData.videoTour.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={formData.videoTour.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full relative z-10"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        key={formData.videoTour.videoUrl}
                        src={formData.videoTour.videoUrl}
                        controls
                        playsInline
                        onLoadedMetadata={(e) => {
                          const { videoWidth, videoHeight } = e.currentTarget;
                          if (videoWidth && videoHeight) {
                            setIsVideoPortrait(videoHeight > videoWidth);
                          }
                        }}
                        className="w-full h-full object-contain relative z-10"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 03: FLOOR PLANS & LAYOUT DIMENSIONS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                03. Floor Plans & Layout Dimensions
              </span>
              <button
                type="button"
                onClick={handleAddFloorPlan}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Floor Plan</span>
              </button>
            </div>

            {(!formData.floorPlans || formData.floorPlans.length === 0) ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                No floor plans configured yet. Click "+ Add Floor Plan" to configure 2BHK, 3BHK, 4BHK, or Penthouse specs.
              </div>
            ) : (
              <div className="space-y-3">
                {formData.floorPlans.map((plan, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Plan Name</label>
                      <input 
                        value={plan.name}
                        onChange={(e) => handleUpdateFloorPlan(idx, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                        placeholder="e.g. 3 BHK Royal Luxe"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Bed / Baths</label>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          value={plan.bedrooms}
                          onChange={(e) => handleUpdateFloorPlan(idx, 'bedrooms', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-semibold"
                          title="Bedrooms"
                          placeholder="Beds"
                        />
                        <span className="text-slate-400">/</span>
                        <input 
                          type="number"
                          value={plan.bathrooms}
                          onChange={(e) => handleUpdateFloorPlan(idx, 'bathrooms', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-semibold"
                          title="Baths"
                          placeholder="Baths"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Carpet / Super (Sq.Ft)</label>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number"
                          value={plan.carpetAreaSqFt}
                          onChange={(e) => handleUpdateFloorPlan(idx, 'carpetAreaSqFt', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-semibold"
                          placeholder="Carpet"
                        />
                        <span className="text-slate-400">/</span>
                        <input 
                          type="number"
                          value={plan.superAreaSqFt}
                          onChange={(e) => handleUpdateFloorPlan(idx, 'superAreaSqFt', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-semibold"
                          placeholder="Super"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Estimated Investment</label>
                      <input 
                        value={plan.priceEstimate}
                        onChange={(e) => handleUpdateFloorPlan(idx, 'priceEstimate', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-amber-700 placeholder:text-slate-400"
                        placeholder="e.g. ₹2.65 Cr"
                      />
                    </div>
                    <div className="flex justify-end sm:justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveFloorPlan(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Delete this floor plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 04: LOCATION ADVANTAGE & STRATEGIC TRANSIT */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  04. Location Advantage & Strategic Transit (Custom Options)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Two custom fields per item: Header (Category) and Answer (Details/Distance). Minimum 8 slots ready to fill with zero pre-applied restrictions.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {customLocationPairs.filter(p => p.label.trim().length > 0 || p.value.trim().length > 0).length} of {customLocationPairs.length} Filled
                </span>
                {customLocationPairs.some(p => p.label.trim().length > 0 || p.value.trim().length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearAllLocationPairs}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* 8+ Custom Location Advantage Slots (Header + Answer pairs) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Custom Location Advantages (Minimum 8 Options)
                </label>
                <span className="text-[11px] text-slate-400">Fill in any order · Leave unused slots blank</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {customLocationPairs.map((pair, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 focus-within:border-amber-400 focus-within:bg-amber-50/20 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all space-y-2.5"
                  >
                    {/* Header bar of slot */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-900 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {idx < 9 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">Option {idx < 9 ? `0${idx + 1}` : idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(pair.label.trim() || pair.value.trim()) && (
                          <button
                            type="button"
                            onClick={() => handleClearLocationPairSlot(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Clear this slot"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {customLocationPairs.length > 8 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLocationPairSlot(idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category 1: Header */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Header / Category Name
                      </label>
                      <input
                        type="text"
                        value={pair.label}
                        onChange={(e) => handleUpdateLocationPair(idx, 'label', e.target.value)}
                        placeholder="e.g. Metro Network Distance"
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-900 rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                      />
                    </div>

                    {/* Category 2: Answer / Details */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Answer / Details / Distance
                      </label>
                      <input
                        type="text"
                        value={pair.value}
                        onChange={(e) => handleUpdateLocationPair(idx, 'value', e.target.value)}
                        placeholder="e.g. 800 Meters (Sector 142 Metro Station)"
                        className="w-full px-3 py-2 text-xs font-medium text-slate-900 rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Slot Management Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleAddLocationPairSlot}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Location Advantage Slot ({customLocationPairs.length + 1})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkLocation(prev => !prev)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  {showBulkLocation ? 'Hide Quick Paste' : 'Quick Paste Format (Header --> Answer)'}
                </button>
              </div>

              {/* Quick paste drawer */}
              {showBulkLocation && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-2 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Quick Paste Location Advantages (Format: Header --&gt; Answer or Header: Answer per line):
                  </label>
                  <textarea
                    rows={4}
                    value={customBulkLocationText}
                    onChange={(e) => setCustomBulkLocationText(e.target.value)}
                    placeholder="Metro Network Distance --> 800 Meters (Sector 142 Metro Station)&#10;Jewar International Airport --> 35 Mins Direct Corridor&#10;Expressway Access --> 2 Mins to Noida-Gr. Noida Expressway&#10;Educational Hub --> 5 Mins (Amity University & Lotus Valley)"
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkLocation(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBulkLocationPairs}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Populate Slots
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 05: LIFESTYLE AMENITIES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  05. Lifestyle Amenities (Unlimited & Custom)
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add as many amenities as you wish in your own words. Zero limitations.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {formData.amenities?.length || 0} Amenities (No Limit)
                </span>
                {(formData.amenities?.length || 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllAmenities}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Active Amenities Chips */}
            {formData.amenities && formData.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-slate-200">
                {formData.amenities.map((amenity, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-xs hover:border-amber-300 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="break-words leading-relaxed">{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(amenity)}
                      className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove this amenity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 px-3 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                No amenities added yet. Use the custom input box below or choose from presets to add as many as you like.
              </div>
            )}

            {/* Custom Single Amenity Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Add Custom Amenity in Your Own Words
              </label>
              <div className="flex gap-2">
                <input 
                  value={newAmenityInput}
                  onChange={(e) => setNewAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAmenity(newAmenityInput);
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Type any custom amenity in your own words (e.g. Temperature Controlled All-Weather Pool) and press Enter..."
                />
                <button
                  type="button"
                  onClick={() => handleAddAmenity(newAmenityInput)}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Amenity</span>
                </button>
              </div>
            </div>

            {/* Bulk / Free-Form Custom Amenities Textarea */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 block">
                  Bulk Custom Amenities (Unlimited & Free-Form)
                </label>
                <span className="text-[11px] text-amber-800">
                  Separate with commas ( , ) or new lines
                </span>
              </div>
              <textarea 
                rows={3}
                value={customBulkAmenities}
                onChange={(e) => setCustomBulkAmenities(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-amber-300/80 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed"
                placeholder="Type or paste any number of amenities in your own words here...&#10;e.g. Olympic Size Heated Pool, Private Cigar Lounge, Italian Marble Clubhouse, Zen Meditation Deck, 24/7 Butler Service, Rooftop Helipad, EV Charging Bay"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleBulkAddAmenities(false)}
                  disabled={!customBulkAmenities.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add All to List</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAddAmenities(true)}
                  disabled={!customBulkAmenities.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-amber-400 text-amber-900 hover:bg-amber-100/80 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Replaces current list with the items in this box"
                >
                  Replace All With This
                </button>
              </div>
            </div>

            {/* Quick Luxury Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Quick Luxury Amenity Presets (Click to add):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LUXURY_AMENITY_PRESETS.map((preset) => {
                  const isAlreadyAdded = formData.amenities?.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddAmenity(preset)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        isAlreadyAdded 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60 cursor-default'
                          : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 cursor-pointer'
                      }`}
                    >
                      {isAlreadyAdded ? `✓ ${preset}` : `+ ${preset}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION: PROPERTY PHOTOS & SHOWCASE REEL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Property Photos & High-Res Showcase Reel
              </span>
              <span className="text-xs text-slate-400">Multiple photo upload with cover selection</span>
            </div>

            {/* Existing Gallery Photos (if editing) */}
            {isEditMode && existingGalleryImages.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Active Gallery Photos ({existingGalleryImages.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click ★ to set as Cover Photo
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {existingGalleryImages.map((imgItem, idx) => {
                    const isCover = formData.coverImage === imgItem.url || (!formData.coverImage && idx === 0);
                    return (
                      <div 
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-white shadow-xs ${
                          isCover ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img src={imgItem.url} alt={imgItem.caption} className="w-full h-20 object-cover" />
                        
                        <button
                          type="button"
                          onClick={() => handleSetExistingAsCover(imgItem.url)}
                          title="Set as Cover photo"
                          className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                            isCover 
                              ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                              : 'bg-black/60 text-white/90 hover:bg-amber-400 hover:text-neutral-950'
                          }`}
                        >
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {isCover ? 'Cover' : 'Make Cover'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          title="Remove photo from gallery"
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-md"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* File input for new uploads */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100/80 text-amber-900 rounded-2xl transition-all text-sm font-semibold cursor-pointer shadow-xs hover:border-amber-500"
              >
                <Upload className="w-4 h-4 text-amber-600" />
                <span>{uploadFiles.length > 0 ? '+ Add More New Photos' : 'Select Photos from Computer (One-Click Multi-Upload)'}</span>
              </button>

              <div className="flex-1">
                <input
                  name="coverImage"
                  value={formData.coverImage || ''}
                  onChange={handleChange}
                  className="w-full h-full px-3.5 py-2.5 text-sm rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Or paste an external Image URL (Optional)..."
                  disabled={uploadFiles.length > 0}
                />
              </div>
            </div>

            {/* Thumbnail grid of newly added files */}
            {uploadFiles.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    New Photos to Upload ({uploadFiles.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadFiles([])}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Clear New Photos
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {uploadFiles.map((file, idx) => (
                    <div
                      key={file.id}
                      className="group relative h-20 rounded-xl overflow-hidden border-2 bg-white shadow-xs transition-all border-slate-200 hover:border-amber-400"
                    >
                      <img
                        src={file.base64}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />

                      <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        idx === 0 && !existingGalleryImages.length
                          ? 'bg-amber-400 text-neutral-950 shadow-xs' 
                          : 'bg-black/60 text-white backdrop-blur-xs font-mono'
                      }`}>
                        {idx === 0 && !existingGalleryImages.length ? '★ Cover' : `+${idx + 1}`}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(file.id)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-rose-500 text-white transition-all cursor-pointer opacity-80 group-hover:opacity-100 shadow-md"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </form>
      </div>

      {/* Footer Sticky Bar */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500 hidden sm:block">
          All changes immediately reflect in the Property Card & High-Res Detail Modal.
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {!inlineMode && (
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            form="admin-form" 
            disabled={loading} 
            className="px-8 py-2.5 text-sm font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md hover:shadow-amber-400/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {loading ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditMode ? 'Update Luxury Listing' : 'Publish Property Listing'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {inlineMode ? (
        formContent
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          {formContent}
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
            if (videoUrlInputRef.current) {
              videoUrlInputRef.current.focus();
              videoUrlInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        }}
      />
    </>
  );
};
