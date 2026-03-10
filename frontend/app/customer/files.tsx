import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  getVehicleTypes,
  getManufacturers,
  getModels,
  getBuilts,
  getEngines,
  getStages,
  createOrder,
  getOrders,
  Order as ApiOrder,
} from '../../src/services/api';

interface SelectOption {
  id: string;
  name: string;
  mdt_id?: string;
}

interface Stage {
  id: string;
  name: string;
  org_hp: number;
  org_tq: number;
  tun_hp: number;
  tun_tq: number;
  delta_hp: number;
  delta_tq: number;
}

interface FileData {
  name: string;
  size: number;
  uri: string;
  base64?: string;
}

interface OrderData {
  file: FileData | null;
  tuningTool: string | null;
  method: string | null;
  slaveOrMaster: string | null;
  vehicleType: SelectOption | null;
  manufacturer: SelectOption | null;
  model: SelectOption | null;
  built: SelectOption | null;
  engine: SelectOption | null;
  stage: Stage | null;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | string;
  statusLabel?: string;
  fileName: string;
  vehicle: string;
  stage: string;
  tuningTool: string;
  method: string;
  slaveOrMaster: string;
}

const TUNING_TOOLS = ['Autotuner', 'Flex', 'CMD', 'Kess3'];
const METHODS = ['OBD', 'Bench', 'BDM'];
const SLAVE_MASTER = ['Slave', 'Master'];

type ViewMode = 'newOrder' | 'orders';

const getStatusInfo = (status: string, language: string, statusLabel?: string) => {
  const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
    // English/default statuses
    pending: {
      label: language === 'de' ? 'Ausstehend' : 'Pending',
      color: '#ff9800',
      icon: 'time',
    },
    processing: {
      label: language === 'de' ? 'In Bearbeitung' : 'Processing',
      color: '#2196f3',
      icon: 'cog',
    },
    completed: {
      label: language === 'de' ? 'Abgeschlossen' : 'Completed',
      color: '#4caf50',
      icon: 'checkmark-circle',
    },
    cancelled: {
      label: language === 'de' ? 'Storniert' : 'Cancelled',
      color: '#f5a623',
      icon: 'close-circle',
    },
    // German/CRM statuses
    eingegangen: {
      label: 'Eingegangen',
      color: '#ff9800',
      icon: 'time',
    },
    in_bearbeitung: {
      label: 'In Bearbeitung',
      color: '#2196f3',
      icon: 'cog',
    },
    abgeschlossen: {
      label: 'Abgeschlossen',
      color: '#4caf50',
      icon: 'checkmark-circle',
    },
    fertig: {
      label: 'Fertig',
      color: '#4caf50',
      icon: 'checkmark-circle',
    },
    abgelehnt: {
      label: 'Abgelehnt',
      color: '#f5a623',
      icon: 'close-circle',
    },
    storniert: {
      label: 'Storniert',
      color: '#f5a623',
      icon: 'close-circle',
    },
  };
  
  // If we have a statusLabel from CRM, use it
  if (statusLabel && !statusMap[status]) {
    return {
      label: statusLabel,
      color: '#607d8b', // Default gray for unknown statuses
      icon: 'information-circle',
    };
  }
  
  return statusMap[status] || statusMap.pending;
};

export default function FilesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { getAccessToken } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Order data
  const [orderData, setOrderData] = useState<OrderData>({
    file: null,
    tuningTool: null,
    method: null,
    slaveOrMaster: null,
    vehicleType: null,
    manufacturer: null,
    model: null,
    built: null,
    engine: null,
    stage: null,
  });

  // Vehicle data
  const [vehicleTypes, setVehicleTypes] = useState<SelectOption[]>([]);
  const [manufacturers, setManufacturers] = useState<SelectOption[]>([]);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [builts, setBuilts] = useState<SelectOption[]>([]);
  const [engines, setEngines] = useState<SelectOption[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentMdtId, setCurrentMdtId] = useState<string | null>(null);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Refresh orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = await getAccessToken();
      if (token) {
        const apiOrders = await getOrders(token);
        // Map API orders to local Order type
        const mappedOrders: Order[] = apiOrders.map((o: ApiOrder) => ({
          id: o.id || o.orderNumber,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          status: o.status as Order['status'],
          statusLabel: o.statusLabel,
          fileName: o.fileName,
          vehicle: o.vehicle,
          stage: o.stage,
          tuningTool: o.tuningTool,
          method: o.method,
          slaveOrMaster: o.slaveOrMaster,
        }));
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

  // Load vehicle types on step 3
  useEffect(() => {
    if (currentStep === 3 && vehicleTypes.length === 0) {
      loadVehicleTypes();
    }
  }, [currentStep]);

  const loadVehicleTypes = async () => {
    setLoading(true);
    try {
      const response = await getVehicleTypes();
      setVehicleTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load vehicle types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicleType = async (type: SelectOption) => {
    setOrderData(prev => ({ ...prev, vehicleType: type, manufacturer: null, model: null, built: null, engine: null, stage: null }));
    setManufacturers([]);
    setModels([]);
    setBuilts([]);
    setEngines([]);
    setStages([]);
    setCurrentMdtId(type.mdt_id || null);
    
    setLoading(true);
    try {
      const response = await getManufacturers(type.id, type.mdt_id);
      setManufacturers(response.data || []);
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectManufacturer = async (manufacturer: SelectOption) => {
    setOrderData(prev => ({ ...prev, manufacturer, model: null, built: null, engine: null, stage: null }));
    setModels([]);
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    setLoading(true);
    try {
      const response = await getModels(manufacturer.id, currentMdtId || undefined);
      setModels(response.data || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (model: SelectOption) => {
    setOrderData(prev => ({ ...prev, model, built: null, engine: null, stage: null }));
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    setLoading(true);
    try {
      const response = await getBuilts(model.id, currentMdtId || undefined);
      setBuilts(response.data || []);
    } catch (error) {
      console.error('Failed to load builts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBuilt = async (built: SelectOption) => {
    setOrderData(prev => ({ ...prev, built, engine: null, stage: null }));
    setEngines([]);
    setStages([]);
    
    setLoading(true);
    try {
      const response = await getEngines(built.id, currentMdtId || undefined);
      setEngines(response.data || []);
    } catch (error) {
      console.error('Failed to load engines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEngine = async (engine: SelectOption) => {
    setOrderData(prev => ({ ...prev, engine, stage: null }));
    setStages([]);
    
    setLoading(true);
    try {
      const response = await getStages(engine.id, currentMdtId || undefined);
      setStages(response.data || []);
    } catch (error) {
      console.error('Failed to load stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStage = (stage: Stage) => {
    setOrderData(prev => ({ ...prev, stage }));
  };

  // Parse filename to extract vehicle information
  const parseFilenameForVehicle = (filename: string): { manufacturer?: string; model?: string; year?: string; engine?: string } => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Replace underscores and common separators with spaces
    const normalized = nameWithoutExt
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Common patterns in tuning file names:
    // "Audi A6 2011 (C7) 3.0 TDI EU6 (FWD) 218 hp Bosch EDC17CP54 OBD VR"
    // "BMW 320i 2020 Stage1"
    // "VW Golf 7 2.0 TDI"
    
    const parts = normalized.split(' ');
    
    // Known manufacturers
    const knownManufacturers = [
      'Audi', 'BMW', 'Mercedes', 'VW', 'Volkswagen', 'Porsche', 'Seat', 'Skoda',
      'Ford', 'Opel', 'Peugeot', 'Renault', 'Citroen', 'Fiat', 'Alfa', 'Hyundai',
      'Kia', 'Toyota', 'Honda', 'Nissan', 'Mazda', 'Volvo', 'Jaguar', 'Land',
      'Mini', 'Smart', 'Jeep', 'Dodge', 'Chevrolet', 'Tesla', 'Lexus', 'Infiniti',
      'Mitsubishi', 'Subaru', 'Suzuki', 'Dacia', 'Cupra', 'DS'
    ];
    
    let manufacturer: string | undefined;
    let model: string | undefined;
    let year: string | undefined;
    let engine: string | undefined;
    
    // Find manufacturer
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const matchedManu = knownManufacturers.find(m => 
        m.toLowerCase() === part.toLowerCase()
      );
      if (matchedManu) {
        manufacturer = matchedManu;
        // Model is usually the next part(s)
        if (i + 1 < parts.length) {
          // Check if next part is a model name (not a year)
          const nextPart = parts[i + 1];
          if (!/^\d{4}$/.test(nextPart) && !/^\(\w+\)$/.test(nextPart)) {
            model = nextPart;
          }
        }
        break;
      }
    }
    
    // Find year (4 digit number between 1990 and 2030)
    for (const part of parts) {
      const yearMatch = part.match(/^(19\d{2}|20[0-3]\d)$/);
      if (yearMatch) {
        year = yearMatch[1];
        break;
      }
    }
    
    // Find engine info (patterns like "2.0 TDI", "3.0 TFSI", "320i", "2.0T")
    const enginePatterns = [
      /(\d+\.\d+)\s*(TDI|TFSI|TSI|CDI|HDI|CRDI|T|Turbo)/i,
      /(\d{3}[a-z]?i?)/i, // BMW style like 320i, 330d
      /(\d+\.\d+)\s*(Diesel|Benzin|Petrol)/i,
    ];
    
    for (const pattern of enginePatterns) {
      const match = normalized.match(pattern);
      if (match) {
        engine = match[0];
        break;
      }
    }
    
    console.log('Parsed filename:', { manufacturer, model, year, engine });
    return { manufacturer, model, year, engine };
  };

  // Try to auto-select vehicle based on filename (optional feature)
  const tryAutoSelectVehicle = async (filename: string) => {
    const parsed = parseFilenameForVehicle(filename);
    
    if (!parsed.manufacturer) {
      console.log('Could not detect manufacturer from filename');
      return;
    }
    
    try {
      // First, get vehicle types and find PKW (most common)
      const typesResponse = await getVehicleTypes();
      const types = typesResponse.data || [];
      const pkwType = types.find((t: SelectOption) => 
        t.name.toLowerCase().includes('pkw') || t.name.toLowerCase().includes('car')
      ) || types[0];
      
      if (!pkwType) {
        console.log('No vehicle type found');
        return;
      }
      
      setVehicleTypes(types);
      
      // Get mdt_id from pkwType
      const mdtId = pkwType.mdt_id || '1';
      
      // Get manufacturers for this type
      const manuResponse = await getManufacturers(pkwType.id, mdtId);
      const manuList = manuResponse.data || [];
      setManufacturers(manuList);
      
      // Find matching manufacturer
      const matchedManu = manuList.find((m: SelectOption) =>
        m.name.toLowerCase().includes(parsed.manufacturer!.toLowerCase()) ||
        parsed.manufacturer!.toLowerCase().includes(m.name.toLowerCase())
      );
      
      if (!matchedManu) {
        console.log('Manufacturer not found:', parsed.manufacturer);
        // Still set the vehicle type so user can continue manually
        setOrderData(prev => ({ 
          ...prev, 
          vehicleType: pkwType,
        }));
        return;
      }
      
      // Use the manufacturer's mdt_id or fall back
      const manuMdtId = matchedManu.mdt_id || mdtId;
      setCurrentMdtId(manuMdtId);
      
      // Get models for this manufacturer
      const modelsResponse = await getModels(matchedManu.id, manuMdtId);
      const modelsList = modelsResponse.data || [];
      setModels(modelsList);
      
      // Try to find matching model
      let matchedModel = null;
      if (parsed.model && modelsList.length > 0) {
        // Try exact match first
        matchedModel = modelsList.find((m: SelectOption) =>
          m.name.toLowerCase() === parsed.model!.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (!matchedModel) {
          matchedModel = modelsList.find((m: SelectOption) =>
            m.name.toLowerCase().startsWith(parsed.model!.toLowerCase()) ||
            m.name.toLowerCase().includes(parsed.model!.toLowerCase())
          );
        }
      }
      
      if (!matchedModel) {
        console.log('Model not found:', parsed.model);
        setOrderData(prev => ({ 
          ...prev, 
          vehicleType: pkwType,
          manufacturer: matchedManu,
        }));
        
        Alert.alert(
          language === 'de' ? 'Fahrzeug teilweise erkannt' : 'Vehicle partially detected',
          language === 'de' 
            ? `Erkannt: ${parsed.manufacturer}\n\nBitte wählen Sie das Modell manuell aus.`
            : `Detected: ${parsed.manufacturer}\n\nPlease select the model manually.`
        );
        return;
      }
      
      // Get builts for this model
      const modelMdtId = matchedModel.mdt_id || manuMdtId;
      const builtsResponse = await getBuilts(matchedModel.id, modelMdtId);
      const builtsList = builtsResponse.data || [];
      setBuilts(builtsList);
      
      // Try to find matching year
      let matchedBuilt = null;
      if (parsed.year && builtsList.length > 0) {
        matchedBuilt = builtsList.find((b: SelectOption) =>
          b.name.includes(parsed.year!)
        );
      }
      
      if (!matchedBuilt) {
        console.log('Year not found:', parsed.year);
        setOrderData(prev => ({ 
          ...prev, 
          vehicleType: pkwType,
          manufacturer: matchedManu,
          model: matchedModel,
        }));
        
        Alert.alert(
          language === 'de' ? 'Fahrzeug teilweise erkannt' : 'Vehicle partially detected',
          language === 'de' 
            ? `Erkannt: ${parsed.manufacturer} ${parsed.model}\n\nBitte wählen Sie das Baujahr manuell aus.`
            : `Detected: ${parsed.manufacturer} ${parsed.model}\n\nPlease select the build year manually.`
        );
        return;
      }
      
      // Get engines for this built
      const builtMdtId = matchedBuilt.mdt_id || modelMdtId;
      const enginesResponse = await getEngines(matchedBuilt.id, builtMdtId);
      const enginesList = enginesResponse.data || [];
      setEngines(enginesList);
      
      // Try to find matching engine
      let matchedEngine = null;
      if (parsed.engine && enginesList.length > 0) {
        matchedEngine = enginesList.find((e: SelectOption) =>
          e.name.toLowerCase().includes(parsed.engine!.toLowerCase().split(' ')[0])
        );
      }
      
      if (!matchedEngine) {
        setOrderData(prev => ({ 
          ...prev, 
          vehicleType: pkwType,
          manufacturer: matchedManu,
          model: matchedModel,
          built: matchedBuilt,
        }));
        
        Alert.alert(
          language === 'de' ? 'Fahrzeug erkannt' : 'Vehicle detected',
          language === 'de' 
            ? `Erkannt: ${parsed.manufacturer} ${parsed.model} ${parsed.year}\n\nBitte wählen Sie den Motor manuell aus.`
            : `Detected: ${parsed.manufacturer} ${parsed.model} ${parsed.year}\n\nPlease select the engine manually.`
        );
        return;
      }
      
      // Get stages for this engine
      const engineMdtId = matchedEngine.mdt_id || builtMdtId;
      const stagesResponse = await getStages(matchedEngine.id, engineMdtId);
      setStages(stagesResponse.data || []);
      
      // Set all found values
      setOrderData(prev => ({ 
        ...prev, 
        vehicleType: pkwType,
        manufacturer: matchedManu,
        model: matchedModel,
        built: matchedBuilt,
        engine: matchedEngine,
      }));
      
      Alert.alert(
        language === 'de' ? 'Fahrzeug erkannt!' : 'Vehicle detected!',
        language === 'de' 
          ? `Erkannt: ${parsed.manufacturer} ${parsed.model} ${parsed.year}\n\nBitte wählen Sie nur noch die Tuning-Stufe aus.`
          : `Detected: ${parsed.manufacturer} ${parsed.model} ${parsed.year}\n\nPlease just select the tuning stage.`
      );
      
    } catch (error) {
      console.error('Error in auto-select vehicle:', error);
      // Don't show error to user, just let them select manually
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Read file as base64 immediately after picking
        let base64Data = '';
        try {
          if (Platform.OS === 'web') {
            // For web, fetch the file and convert to base64
            const response = await fetch(file.uri);
            const blob = await response.blob();
            base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data URL prefix if present
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            // For native (iOS/Android), use FileSystem
            base64Data = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          console.log('File read successfully, base64 length:', base64Data.length);
        } catch (readError) {
          console.error('Error reading file as base64:', readError);
          Alert.alert(
            language === 'de' ? 'Fehler' : 'Error',
            language === 'de' 
              ? 'Die Datei konnte nicht gelesen werden. Bitte versuchen Sie es mit einer anderen Datei.'
              : 'The file could not be read. Please try with a different file.'
          );
          return;
        }
        
        if (!base64Data || base64Data.trim() === '') {
          Alert.alert(
            language === 'de' ? 'Fehler' : 'Error',
            language === 'de' 
              ? 'Die Datei ist leer oder konnte nicht gelesen werden.'
              : 'The file is empty or could not be read.'
          );
          return;
        }
        
        setOrderData(prev => ({
          ...prev,
          file: {
            name: file.name,
            size: file.size || 0,
            uri: file.uri,
            base64: base64Data,
          },
        }));
        
        // Try to auto-detect vehicle from filename
        tryAutoSelectVehicle(file.name);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Fehler', 'Datei konnte nicht ausgewählt werden.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return orderData.file !== null;
      case 2:
        return orderData.tuningTool && orderData.method && orderData.slaveOrMaster;
      case 3:
        return orderData.stage !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!orderData.file) {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' ? 'Bitte wählen Sie eine Datei aus.' : 'Please select a file.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAccessToken();
      console.log('Got token for order:', token ? token.substring(0, 20) + '...' : 'NULL');
      if (!token) {
        Alert.alert(
          language === 'de' ? 'Fehler' : 'Error',
          language === 'de' ? 'Sitzung abgelaufen. Bitte erneut anmelden.' : 'Session expired. Please login again.'
        );
        setSubmitting(false);
        return;
      }

      // Use the base64 data that was read when the file was picked
      let fileData = orderData.file.base64 || '';
      
      // If base64 wasn't stored, try to read it now (fallback)
      if (!fileData && orderData.file.uri) {
        try {
          if (Platform.OS === 'web') {
            const response = await fetch(orderData.file.uri);
            const blob = await response.blob();
            fileData = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            fileData = await FileSystem.readAsStringAsync(orderData.file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
        } catch (e) {
          console.error('Fallback file read error:', e);
        }
      }
      
      // Validate fileData is not empty
      if (!fileData || fileData.trim() === '') {
        Alert.alert(
          language === 'de' ? 'Fehler' : 'Error',
          language === 'de' 
            ? 'Die Datei konnte nicht gelesen werden. Bitte wählen Sie die Datei erneut aus.'
            : 'The file could not be read. Please select the file again.'
        );
        setSubmitting(false);
        return;
      }
      
      console.log('File data length:', fileData.length);

      // Build vehicle display string
      const vehicleParts = [
        orderData.manufacturer?.name,
        orderData.model?.name,
        orderData.built?.name,
        orderData.engine?.name,
      ].filter(Boolean);
      const vehicleDisplay = vehicleParts.join(' ') || 'Unbekannt';

      // Create order
      const result = await createOrder(token, {
        fileName: orderData.file.name,
        fileData: fileData,
        fileSize: orderData.file.size,
        tuningTool: orderData.tuningTool || '',
        method: orderData.method || '',
        slaveOrMaster: orderData.slaveOrMaster || '',
        vehicleType: orderData.vehicleType?.name,
        manufacturer: orderData.manufacturer?.name,
        model: orderData.model?.name,
        built: orderData.built?.name,
        engine: orderData.engine?.name,
        stage: orderData.stage?.name,
        vehicleDisplay: vehicleDisplay,
      });

      console.log('Order created successfully:', result);

      // Show success message and switch to orders view
      console.log('Setting showSuccessMessage to true');
      setShowSuccessMessage(true);
      setViewMode('orders');
      
      // Reset form
      setCurrentStep(1);
      setOrderData({
        file: null,
        tuningTool: null,
        method: null,
        slaveOrMaster: null,
        vehicleType: null,
        manufacturer: null,
        model: null,
        built: null,
        engine: null,
        stage: null,
      });
      
      // Reload orders to show the new one
      await loadOrders();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        console.log('Hiding success message');
        setShowSuccessMessage(false);
      }, 5000);
      
    } catch (error: any) {
      console.error('Order submission error:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Bestellung konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.' 
          : 'Order could not be submitted. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive,
            currentStep === step && styles.stepCircleCurrent,
          ]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {language === 'de' ? 'Schritt 1: Datei hochladen' : 'Step 1: Upload File'}
      </Text>
      <Text style={styles.stepDescription}>
        {language === 'de' 
          ? 'Wählen Sie das Tuning-File aus, das bearbeitet werden soll.' 
          : 'Select the tuning file to be processed.'}
      </Text>

      <TouchableOpacity style={styles.uploadArea} onPress={handlePickFile}>
        {orderData.file ? (
          <View style={styles.fileSelected}>
            <View style={styles.fileIconLarge}>
              <Ionicons name="document" size={40} color="#4caf50" />
            </View>
            <Text style={styles.fileName}>{orderData.file.name}</Text>
            <Text style={styles.fileSize}>{formatFileSize(orderData.file.size)}</Text>
            <TouchableOpacity style={styles.changeFileButton} onPress={handlePickFile}>
              <Text style={styles.changeFileText}>
                {language === 'de' ? 'Andere Datei wählen' : 'Choose different file'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.uploadIconLarge}>
              <Ionicons name="cloud-upload" size={48} color="#f5a623" />
            </View>
            <Text style={styles.uploadText}>
              {language === 'de' ? 'Datei auswählen' : 'Select File'}
            </Text>
            <Text style={styles.uploadHint}>
              {language === 'de' 
                ? 'Formate: .bin, .ori, .mod, .slave' 
                : 'Formats: .bin, .ori, .mod, .slave'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {language === 'de' ? 'Schritt 2: Tuning-Einstellungen' : 'Step 2: Tuning Settings'}
      </Text>
      <Text style={styles.stepDescription}>
        {language === 'de' 
          ? 'Wählen Sie das verwendete Tool und die Methode aus.' 
          : 'Select the tool and method used.'}
      </Text>

      {/* Tuning Tool */}
      <View style={styles.optionSection}>
        <Text style={styles.optionLabel}>
          {language === 'de' ? 'Tuning-Tool' : 'Tuning Tool'}
        </Text>
        <View style={styles.optionGrid}>
          {TUNING_TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool}
              style={[
                styles.optionButton,
                orderData.tuningTool === tool && styles.optionButtonActive,
              ]}
              onPress={() => setOrderData(prev => ({ ...prev, tuningTool: tool }))}
            >
              <Text style={[
                styles.optionButtonText,
                orderData.tuningTool === tool && styles.optionButtonTextActive,
              ]}>
                {tool}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Method */}
      <View style={styles.optionSection}>
        <Text style={styles.optionLabel}>
          {language === 'de' ? 'Methode' : 'Method'}
        </Text>
        <View style={styles.optionGrid}>
          {METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.optionButton,
                orderData.method === method && styles.optionButtonActive,
              ]}
              onPress={() => setOrderData(prev => ({ ...prev, method }))}
            >
              <Text style={[
                styles.optionButtonText,
                orderData.method === method && styles.optionButtonTextActive,
              ]}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Slave/Master */}
      <View style={styles.optionSection}>
        <Text style={styles.optionLabel}>Slave / Master</Text>
        <View style={styles.optionGrid}>
          {SLAVE_MASTER.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                styles.optionButtonWide,
                orderData.slaveOrMaster === option && styles.optionButtonActive,
              ]}
              onPress={() => setOrderData(prev => ({ ...prev, slaveOrMaster: option }))}
            >
              <Text style={[
                styles.optionButtonText,
                orderData.slaveOrMaster === option && styles.optionButtonTextActive,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {language === 'de' ? 'Schritt 3: Fahrzeug & Stage' : 'Step 3: Vehicle & Stage'}
      </Text>
      <Text style={styles.stepDescription}>
        {language === 'de' 
          ? 'Wählen Sie Ihr Fahrzeug und die gewünschte Tuning-Stufe.' 
          : 'Select your vehicle and desired tuning stage.'}
      </Text>

      {loading && (
        <ActivityIndicator color="#f5a623" size="large" style={{ marginVertical: 20 }} />
      )}

      {/* Vehicle Type */}
      {!orderData.vehicleType && !loading && (
        <View style={styles.selectionSection}>
          <Text style={styles.selectionLabel}>
            {language === 'de' ? 'Fahrzeugtyp' : 'Vehicle Type'}
          </Text>
          <View style={styles.selectionGrid}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.selectionItem}
                onPress={() => handleSelectVehicleType(type)}
              >
                <Text style={styles.selectionItemText}>{type.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Manufacturer */}
      {orderData.vehicleType && !orderData.manufacturer && !loading && (
        <View style={styles.selectionSection}>
          <TouchableOpacity style={styles.backSelection} onPress={() => setOrderData(prev => ({ ...prev, vehicleType: null }))}>
            <Ionicons name="arrow-back" size={20} color="#f5a623" />
            <Text style={styles.backSelectionText}>{orderData.vehicleType.name}</Text>
          </TouchableOpacity>
          <Text style={styles.selectionLabel}>
            {language === 'de' ? 'Hersteller' : 'Manufacturer'}
          </Text>
          <ScrollView style={styles.selectionScroll} nestedScrollEnabled>
            {manufacturers.map((manu) => (
              <TouchableOpacity
                key={manu.id}
                style={styles.selectionItem}
                onPress={() => handleSelectManufacturer(manu)}
              >
                <Text style={styles.selectionItemText}>{manu.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Model */}
      {orderData.manufacturer && !orderData.model && !loading && (
        <View style={styles.selectionSection}>
          <TouchableOpacity style={styles.backSelection} onPress={() => setOrderData(prev => ({ ...prev, manufacturer: null }))}>
            <Ionicons name="arrow-back" size={20} color="#f5a623" />
            <Text style={styles.backSelectionText}>{orderData.manufacturer.name}</Text>
          </TouchableOpacity>
          <Text style={styles.selectionLabel}>
            {language === 'de' ? 'Modell' : 'Model'}
          </Text>
          <ScrollView style={styles.selectionScroll} nestedScrollEnabled>
            {models.map((model) => (
              <TouchableOpacity
                key={model.id}
                style={styles.selectionItem}
                onPress={() => handleSelectModel(model)}
              >
                <Text style={styles.selectionItemText}>{model.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Built */}
      {orderData.model && !orderData.built && !loading && (
        <View style={styles.selectionSection}>
          <TouchableOpacity style={styles.backSelection} onPress={() => setOrderData(prev => ({ ...prev, model: null }))}>
            <Ionicons name="arrow-back" size={20} color="#f5a623" />
            <Text style={styles.backSelectionText}>{orderData.model.name}</Text>
          </TouchableOpacity>
          <Text style={styles.selectionLabel}>
            {language === 'de' ? 'Baujahr' : 'Year'}
          </Text>
          <ScrollView style={styles.selectionScroll} nestedScrollEnabled>
            {builts.map((built) => (
              <TouchableOpacity
                key={built.id}
                style={styles.selectionItem}
                onPress={() => handleSelectBuilt(built)}
              >
                <Text style={styles.selectionItemText}>{built.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Engine */}
      {orderData.built && !orderData.engine && !loading && (
        <View style={styles.selectionSection}>
          <TouchableOpacity style={styles.backSelection} onPress={() => setOrderData(prev => ({ ...prev, built: null }))}>
            <Ionicons name="arrow-back" size={20} color="#f5a623" />
            <Text style={styles.backSelectionText}>{orderData.built.name}</Text>
          </TouchableOpacity>
          <Text style={styles.selectionLabel}>
            {language === 'de' ? 'Motor' : 'Engine'}
          </Text>
          <ScrollView style={styles.selectionScroll} nestedScrollEnabled>
            {engines.map((engine) => (
              <TouchableOpacity
                key={engine.id}
                style={styles.selectionItem}
                onPress={() => handleSelectEngine(engine)}
              >
                <Text style={styles.selectionItemText}>{engine.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Stage */}
      {orderData.engine && !loading && (
        <View style={styles.selectionSection}>
          <TouchableOpacity style={styles.backSelection} onPress={() => setOrderData(prev => ({ ...prev, engine: null }))}>
            <Ionicons name="arrow-back" size={20} color="#f5a623" />
            <Text style={styles.backSelectionText}>{orderData.engine.name}</Text>
          </TouchableOpacity>
          <Text style={styles.selectionLabel}>
            {language === 'de' ? 'Tuning-Stufe' : 'Tuning Stage'}
          </Text>
          <ScrollView style={styles.selectionScroll} nestedScrollEnabled>
            {stages.map((stage) => (
              <TouchableOpacity
                key={stage.id}
                style={[
                  styles.stageItem,
                  orderData.stage?.id === stage.id && styles.stageItemActive,
                ]}
                onPress={() => handleSelectStage(stage)}
              >
                <View style={styles.stageHeader}>
                  <Ionicons name="flash" size={20} color={orderData.stage?.id === stage.id ? '#ffffff' : '#f5a623'} />
                  <Text style={[
                    styles.stageName,
                    orderData.stage?.id === stage.id && styles.stageNameActive,
                  ]}>
                    {stage.name}
                  </Text>
                  {orderData.stage?.id === stage.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                  )}
                </View>
                <View style={styles.stageStats}>
                  <View style={styles.stageStat}>
                    <Text style={styles.stageStatLabel}>PS</Text>
                    <Text style={styles.stageStatValue}>{stage.org_hp} → {stage.tun_hp}</Text>
                    <Text style={styles.stageStatDelta}>+{stage.delta_hp}</Text>
                  </View>
                  <View style={styles.stageStat}>
                    <Text style={styles.stageStatLabel}>Nm</Text>
                    <Text style={styles.stageStatValue}>{stage.org_tq} → {stage.tun_tq}</Text>
                    <Text style={styles.stageStatDelta}>+{stage.delta_tq}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {language === 'de' ? 'Schritt 4: Übersicht' : 'Step 4: Overview'}
      </Text>
      <Text style={styles.stepDescription}>
        {language === 'de' 
          ? 'Überprüfen Sie Ihre Bestellung und senden Sie sie ab.' 
          : 'Review your order and submit.'}
      </Text>

      <View style={styles.summaryCard}>
        {/* File */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="document" size={24} color="#f5a623" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>
              {language === 'de' ? 'Datei' : 'File'}
            </Text>
            <Text style={styles.summaryValue}>{orderData.file?.name}</Text>
            <Text style={styles.summaryMeta}>{formatFileSize(orderData.file?.size || 0)}</Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        {/* Tool & Method */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="construct" size={24} color="#f5a623" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>
              {language === 'de' ? 'Tool & Methode' : 'Tool & Method'}
            </Text>
            <Text style={styles.summaryValue}>
              {orderData.tuningTool} • {orderData.method} • {orderData.slaveOrMaster}
            </Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        {/* Vehicle */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="car" size={24} color="#f5a623" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>
              {language === 'de' ? 'Fahrzeug' : 'Vehicle'}
            </Text>
            <Text style={styles.summaryValue}>
              {orderData.manufacturer?.name} {orderData.model?.name}
            </Text>
            <Text style={styles.summaryMeta}>
              {orderData.built?.name} • {orderData.engine?.name}
            </Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        {/* Stage */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons name="flash" size={24} color="#f5a623" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>
              {language === 'de' ? 'Tuning-Stufe' : 'Tuning Stage'}
            </Text>
            <Text style={styles.summaryValue}>{orderData.stage?.name}</Text>
            <Text style={styles.summaryMeta}>
              +{orderData.stage?.delta_hp} PS • +{orderData.stage?.delta_tq} Nm
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {language === 'de' ? 'Bestellung absenden' : 'Submit Order'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOrderCard = (order: Order) => {
    const statusInfo = getStatusInfo(order.status, language, order.statusLabel);

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => router.push(`/customer/order/${order.orderNumber}`)}
        activeOpacity={0.8}
        data-testid={`order-card-${order.orderNumber}`}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.orderDate}>{order.createdAt}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderMainInfo}>
          <View style={styles.orderVehicle}>
            <Ionicons name="car" size={18} color="#f5a623" />
            <Text style={styles.orderVehicleText}>{order.vehicle}</Text>
          </View>
          <View style={styles.orderStage}>
            <Ionicons name="flash" size={16} color="#4caf50" />
            <Text style={styles.orderStageText}>{order.stage}</Text>
          </View>
        </View>

        <View style={styles.orderFile}>
          <Ionicons name="document" size={16} color="#8b8b8b" />
          <Text style={styles.orderFileText} numberOfLines={1}>{order.fileName}</Text>
        </View>

        <View style={styles.orderArrow}>
          <Ionicons name="chevron-forward" size={20} color="#8b8b8b" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderOrdersOverview = () => (
    <View style={styles.ordersContainer}>
      <View style={styles.ordersStats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Gesamt' : 'Total'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#ff9800' }]}>
            {orders.filter(o => o.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Ausstehend' : 'Pending'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2196f3' }]}>
            {orders.filter(o => o.status === 'processing').length}
          </Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'In Arbeit' : 'Processing'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#4caf50' }]}>
            {orders.filter(o => o.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>
            {language === 'de' ? 'Fertig' : 'Done'}
          </Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Ionicons name="folder-open" size={48} color="#8b8b8b" />
          <Text style={styles.emptyOrdersText}>
            {language === 'de' 
              ? 'Noch keine Aufträge vorhanden' 
              : 'No orders yet'}
          </Text>
        </View>
      ) : (
        orders.map((order) => (
          <React.Fragment key={order.id || order.orderNumber}>
            {renderOrderCard(order)}
          </React.Fragment>
        ))
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#f5a623']}
          tintColor="#f5a623"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'de' ? 'Tuning-Aufträge' : 'Tuning Orders'}
        </Text>
      </View>

      {/* Tab Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'orders' && styles.tabActive]}
          onPress={() => setViewMode('orders')}
        >
          <Ionicons
            name="list"
            size={18}
            color={viewMode === 'orders' ? '#ffffff' : '#8b8b8b'}
          />
          <Text style={[styles.tabText, viewMode === 'orders' && styles.tabTextActive]}>
            {language === 'de' ? 'Aufträge' : 'Orders'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'newOrder' && styles.tabActive]}
          onPress={() => setViewMode('newOrder')}
        >
          <Ionicons
            name="add-circle"
            size={18}
            color={viewMode === 'newOrder' ? '#ffffff' : '#8b8b8b'}
          />
          <Text style={[styles.tabText, viewMode === 'newOrder' && styles.tabTextActive]}>
            {language === 'de' ? 'Neuer Auftrag' : 'New Order'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Banner - Always visible at top when shown */}
      {showSuccessMessage && (
        <View style={styles.successBanner} data-testid="order-success-banner">
          <Ionicons name="checkmark-circle" size={28} color="#4caf50" />
          <View style={styles.successTextContainer}>
            <Text style={styles.successTitle}>
              {language === 'de' ? 'Bestellung erfolgreich!' : 'Order Successful!'}
            </Text>
            <Text style={styles.successMessage}>
              {language === 'de' 
                ? 'Ihre Bestellung wurde übermittelt. Sie erhalten in Kürze eine Bestätigung.' 
                : 'Your order has been submitted. You will receive a confirmation shortly.'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowSuccessMessage(false)} style={styles.successCloseBtn}>
            <Ionicons name="close-circle" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
      {viewMode === 'orders' && renderOrdersOverview()}

      {viewMode === 'newOrder' && (
        <>
          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <View style={styles.navButtons}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={20} color="#ffffff" />
                  <Text style={styles.backButtonText}>
                    {language === 'de' ? 'Zurück' : 'Back'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={styles.nextButtonText}>
                  {language === 'de' ? 'Weiter' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111931',
    paddingHorizontal: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a472a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4caf50',
    gap: 12,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  successMessage: {
    color: '#a5d6a7',
    fontSize: 14,
    lineHeight: 20,
  },
  successCloseBtn: {
    padding: 4,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#162040',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a2d5a',
  },
  stepCircleActive: {
    backgroundColor: '#f5a623',
    borderColor: '#f5a623',
  },
  stepCircleCurrent: {
    borderColor: '#ffffff',
  },
  stepNumber: {
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#1a2d5a',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#f5a623',
  },
  stepContent: {
    marginBottom: 20,
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    color: '#8b8b8b',
    fontSize: 14,
    marginBottom: 24,
  },
  uploadArea: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a2d5a',
    borderStyle: 'dashed',
  },
  uploadIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#162040',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadHint: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  fileSelected: {
    alignItems: 'center',
  },
  fileIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  fileSize: {
    color: '#8b8b8b',
    fontSize: 14,
    marginBottom: 16,
  },
  changeFileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#162040',
  },
  changeFileText: {
    color: '#f5a623',
    fontSize: 14,
    fontWeight: '500',
  },
  optionSection: {
    marginBottom: 24,
  },
  optionLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#0d1526',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1a2d5a',
    minWidth: '22%',
    alignItems: 'center',
  },
  optionButtonWide: {
    flex: 1,
  },
  optionButtonActive: {
    backgroundColor: '#f5a623',
    borderColor: '#f5a623',
  },
  optionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  selectionSection: {
    marginBottom: 16,
  },
  selectionLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectionGrid: {
    gap: 8,
  },
  selectionScroll: {
    maxHeight: 300,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1526',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  selectionItemText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  backSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backSelectionText: {
    color: '#f5a623',
    fontSize: 14,
    fontWeight: '500',
  },
  stageItem: {
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stageItemActive: {
    backgroundColor: '#f5a623',
    borderColor: '#f5a623',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  stageName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stageNameActive: {
    color: '#ffffff',
  },
  stageStats: {
    flexDirection: 'row',
    gap: 20,
  },
  stageStat: {
    flex: 1,
  },
  stageStatLabel: {
    color: '#8b8b8b',
    fontSize: 12,
    marginBottom: 4,
  },
  stageStatValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  stageStatDelta: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#162040',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    color: '#8b8b8b',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryMeta: {
    color: '#8b8b8b',
    fontSize: 13,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#162040',
    marginVertical: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5a623',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162040',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5a623',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 30,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#f5a623',
  },
  tabText: {
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  // Orders Overview Styles
  ordersContainer: {
    flex: 1,
  },
  ordersStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#8b8b8b',
    fontSize: 11,
    marginTop: 4,
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyOrdersText: {
    color: '#8b8b8b',
    fontSize: 16,
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumberContainer: {
    flex: 1,
  },
  orderNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  orderDate: {
    color: '#8b8b8b',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderVehicleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  orderStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderStageText: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: '600',
  },
  orderFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  orderFileText: {
    color: '#8b8b8b',
    fontSize: 13,
    flex: 1,
  },
  orderArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  orderDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#162040',
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDetailLabel: {
    color: '#8b8b8b',
    fontSize: 13,
  },
  orderDetailValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
});
