import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { scanFahrzeugschein, FahrzeugscheinData, saveScan } from '../../src/services/api';

interface VehicleField {
  label_de: string;
  label_en: string;
  value: string | undefined;
  key: string;
}

interface MockVehicle {
  manufacturer: string;
  model: string;
  engine: string;
  year: string;
  stages: MockStage[];
}

interface MockStage {
  id: string;
  name: string;
  org_hp: number;
  org_tq: number;
  tun_hp: number;
  tun_tq: number;
  delta_hp: number;
  delta_tq: number;
}

// Mock data for when API returns no data
const MOCK_FAHRZEUGSCHEIN_DATA: FahrzeugscheinData = {
  registrationNumber: 'M-AB 1234',
  vin: 'WVWZZZ3CZWE123456',
  d1: 'Volkswagen',
  d3: 'Golf GTI',
  ez: '2022-03-15',
  ez_string: '15.03.2022',
  hsn: '0603',
  tsn: 'BKJ',
  p1: '1984',
  p3: 'Benzin',
  p2_p4: '180',
  g: '1395',
  f1: '1950',
  j: 'M1',
  field_14: 'Euro 6d',
};

type ScreenStep = 'scan' | 'data' | 'vehicle';

// Get vehicle data from scanned info (now using AI-parsed data)
const getMockVehicle = (data: FahrzeugscheinData): MockVehicle => {
  // AI returns data with keys like 'manufacturer', 'model', 'power'
  // But also keeps backwards compatibility with old d1, d3, p2_p4 keys
  
  // Extract power - AI returns "XX kW" or just the number
  let orgHp = 150; // default
  const powerStr = data.power || data.p2_p4;
  if (powerStr) {
    const kwMatch = powerStr.toString().match(/(\d+)/);
    if (kwMatch) {
      const kw = parseInt(kwMatch[1]);
      // Convert kW to HP (1 kW ≈ 1.36 HP)
      orgHp = Math.round(kw * 1.36);
    }
  }
  
  return {
    manufacturer: data.manufacturer || data.d1 || 'Unbekannt',
    model: data.model || data.d3 || 'Unbekannt',
    engine: data.displacement || data.p1 ? `${data.displacement || data.p1} cm³` : '2.0',
    year: data.firstRegistration || data.ez_string || data.ez || '2020',
    stages: [
      {
        id: 'stage1',
        name: 'Stage 1',
        org_hp: orgHp,
        org_tq: Math.round(orgHp * 2.1),
        tun_hp: Math.round(orgHp * 1.25),
        tun_tq: Math.round(orgHp * 2.1 * 1.3),
        delta_hp: Math.round(orgHp * 0.25),
        delta_tq: Math.round(orgHp * 2.1 * 0.3),
      },
      {
        id: 'stage2',
        name: 'Stage 2',
        org_hp: orgHp,
        org_tq: Math.round(orgHp * 2.1),
        tun_hp: Math.round(orgHp * 1.4),
        tun_tq: Math.round(orgHp * 2.1 * 1.45),
        delta_hp: Math.round(orgHp * 0.4),
        delta_tq: Math.round(orgHp * 2.1 * 0.45),
      },
    ],
  };
};

export default function FahrzeugscheinScreen() {
  const { language } = useLanguage();
  const { getAccessToken } = useAuth();
  const [currentStep, setCurrentStep] = useState<ScreenStep>('scan');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<FahrzeugscheinData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mockVehicle, setMockVehicle] = useState<MockVehicle | null>(null);
  const [selectedStage, setSelectedStage] = useState<MockStage | null>(null);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          language === 'de' ? 'Berechtigung erforderlich' : 'Permission Required',
          language === 'de' 
            ? 'Bitte erlauben Sie den Kamerazugriff in den Einstellungen.' 
            : 'Please allow camera access in settings.'
        );
        return;
      }
    }
    setCameraVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      await processImage(result.assets[0].base64);
    }
  };

  const processImage = async (base64: string) => {
    setCapturedImage(base64);
    setScanning(true);
    setScannedData(null);
    setCurrentStep('scan');
    
    try {
      const result = await scanFahrzeugschein(base64);
      
      if (result.success && result.data && Object.keys(result.data).length > 0) {
        setScannedData(result.data);
        setCurrentStep('data');
      } else {
        // Use mock data if API returns no data or error
        console.log('API returned no data, using mock data');
        setScannedData(MOCK_FAHRZEUGSCHEIN_DATA);
        setCurrentStep('data');
      }
    } catch (error) {
      console.error('Scan error:', error);
      // Use mock data on error
      console.log('API error, using mock data');
      setScannedData(MOCK_FAHRZEUGSCHEIN_DATA);
      setCurrentStep('data');
    } finally {
      setScanning(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !capturing) {
      setCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.9,
        });
        
        if (photo?.base64) {
          setCameraVisible(false);
          await processImage(photo.base64);
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert(
          language === 'de' ? 'Fehler' : 'Error',
          language === 'de' ? 'Foto konnte nicht aufgenommen werden.' : 'Failed to capture photo.'
        );
      } finally {
        setCapturing(false);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleNext = () => {
    if (scannedData) {
      const vehicle = getMockVehicle(scannedData);
      setMockVehicle(vehicle);
      setCurrentStep('vehicle');
    }
  };

  const handleBack = () => {
    if (currentStep === 'vehicle') {
      setCurrentStep('data');
    } else if (currentStep === 'data') {
      setCurrentStep('scan');
      setScannedData(null);
      setCapturedImage(null);
    }
  };

  const resetScan = () => {
    setScannedData(null);
    setCapturedImage(null);
    setMockVehicle(null);
    setSelectedStage(null);
    setCurrentStep('scan');
  };

  const handleRequestQuote = async () => {
    if (!scannedData || !selectedStage) return;
    
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      
      // Save the scan to the database
      await saveScan(token, scannedData, selectedStage, capturedImage || undefined);
      
      Alert.alert(
        language === 'de' ? 'Anfrage gesendet' : 'Request Sent',
        language === 'de' 
          ? 'Ihre Tuning-Anfrage wurde erfolgreich gespeichert. Wir melden uns in Kürze bei Ihnen.' 
          : 'Your tuning request has been saved successfully. We will contact you shortly.',
        [{ text: 'OK', onPress: resetScan }]
      );
    } catch (error) {
      console.error('Failed to save scan:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Anfrage konnte nicht gespeichert werden.' 
          : 'Failed to save request.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getVehicleFields = (): VehicleField[] => {
    if (!scannedData) return [];
    
    return [
      { key: 'registrationNumber', label_de: 'Kennzeichen', label_en: 'Registration Number', value: scannedData.registrationNumber },
      { key: 'vin', label_de: 'FIN (Fahrgestellnummer)', label_en: 'VIN', value: scannedData.vin },
      { key: 'd1', label_de: 'Marke', label_en: 'Brand', value: scannedData.d1 },
      { key: 'd3', label_de: 'Handelsbezeichnung', label_en: 'Model', value: scannedData.d3 },
      { key: 'ez_string', label_de: 'Erstzulassung', label_en: 'First Registration', value: scannedData.ez_string || scannedData.ez },
      { key: 'hsn', label_de: 'HSN', label_en: 'HSN', value: scannedData.hsn },
      { key: 'tsn', label_de: 'TSN', label_en: 'TSN', value: scannedData.tsn },
      { key: 'p1', label_de: 'Hubraum (cm³)', label_en: 'Engine Size (cm³)', value: scannedData.p1 },
      { key: 'p3', label_de: 'Kraftstoff', label_en: 'Fuel Type', value: scannedData.p3 },
      { key: 'p2_p4', label_de: 'Leistung (kW)', label_en: 'Power (kW)', value: scannedData.p2_p4 },
    ].filter(field => field.value);
  };

  // Render Step 1: Scan
  const renderScanStep = () => (
    <>
      {/* Show scanned image if available */}
      {capturedImage && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${capturedImage}` }}
            style={styles.capturedImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Scanning indicator */}
      {scanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator color="#f5a623" size="large" />
          <Text style={styles.scanningText}>
            {language === 'de' ? 'Dokument wird analysiert...' : 'Analyzing document...'}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {!scanning && !scannedData && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.mainActionButton} onPress={openCamera}>
            <View style={styles.mainActionIcon}>
              <Ionicons name="camera" size={40} color="#f5a623" />
            </View>
            <Text style={styles.mainActionTitle}>
              {language === 'de' ? 'Fahrzeugschein fotografieren' : 'Take Photo of Registration'}
            </Text>
            <Text style={styles.mainActionSubtitle}>
              {language === 'de' 
                ? 'Halten Sie die Kamera über das Dokument' 
                : 'Hold the camera over the document'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionButton} onPress={pickImage}>
            <Ionicons name="images" size={24} color="#f5a623" />
            <Text style={styles.secondaryActionText}>
              {language === 'de' ? 'Bild aus Galerie wählen' : 'Choose from Gallery'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tips */}
      {!scannedData && !scanning && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>
            {language === 'de' ? 'Tipps für beste Ergebnisse' : 'Tips for Best Results'}
          </Text>
          <View style={styles.tipItem}>
            <Ionicons name="sunny" size={20} color="#ffc107" />
            <Text style={styles.tipText}>
              {language === 'de' ? 'Gute Beleuchtung verwenden' : 'Use good lighting'}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="scan" size={20} color="#2196f3" />
            <Text style={styles.tipText}>
              {language === 'de' ? 'Dokument vollständig im Bild' : 'Document fully visible'}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="hand-left" size={20} color="#4caf50" />
            <Text style={styles.tipText}>
              {language === 'de' ? 'Kamera ruhig halten' : 'Hold camera steady'}
            </Text>
          </View>
        </View>
      )}
    </>
  );

  // Render Step 2: Data Display
  const renderDataStep = () => (
    <View style={styles.dataContainer}>
      <View style={styles.dataHeader}>
        <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
        <Text style={styles.dataTitle}>
          {language === 'de' ? 'Erkannte Fahrzeugdaten' : 'Detected Vehicle Data'}
        </Text>
      </View>
      
      <View style={styles.dataCard}>
        {getVehicleFields().map((field, index) => (
          <View key={field.key} style={[styles.fieldRow, index % 2 === 0 && styles.fieldRowAlt]}>
            <Text style={styles.fieldLabel}>
              {language === 'de' ? field.label_de : field.label_en}
            </Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.backButtonText}>
            {language === 'de' ? 'Zurück' : 'Back'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {language === 'de' ? 'Weiter' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Step 3: Vehicle & Stages
  const renderVehicleStep = () => (
    <View style={styles.vehicleContainer}>
      {/* Vehicle Info Card */}
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleHeader}>
          <Ionicons name="car-sport" size={28} color="#f5a623" />
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {mockVehicle?.manufacturer} {mockVehicle?.model}
            </Text>
            <Text style={styles.vehicleDetails}>
              {mockVehicle?.engine} • {mockVehicle?.year}
            </Text>
          </View>
        </View>
      </View>

      {/* Stages */}
      <Text style={styles.stagesTitle}>
        {language === 'de' ? 'Verfügbare Tuning-Stufen' : 'Available Tuning Stages'}
      </Text>

      {mockVehicle?.stages.map((stage) => (
        <TouchableOpacity
          key={stage.id}
          style={[
            styles.stageCard,
            selectedStage?.id === stage.id && styles.stageCardSelected,
          ]}
          onPress={() => setSelectedStage(stage)}
        >
          {/* Stage Header */}
          <View style={styles.stageHeader}>
            <Ionicons name="flash" size={24} color={selectedStage?.id === stage.id ? '#ffffff' : '#f5a623'} />
            <Text style={[styles.stageName, selectedStage?.id === stage.id && styles.stageNameSelected]}>
              {stage.name}
            </Text>
            {selectedStage?.id === stage.id && (
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            )}
          </View>
          
          {/* Power/Torque Table */}
          <View style={[styles.stageTable, selectedStage?.id === stage.id && styles.stageTableSelected]}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}></Text>
              <Text style={styles.tableHeaderCell}>Original</Text>
              <Text style={styles.tableHeaderCell}>{stage.name}</Text>
              <View style={styles.tableHeaderIconCell}>
                <Ionicons name="trending-up" size={18} color={selectedStage?.id === stage.id ? '#ffffff' : '#f5a623'} />
              </View>
            </View>
            
            {/* HP Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, selectedStage?.id === stage.id && styles.tableLabelSelected]}>PS</Text>
              <Text style={[styles.tableValue, selectedStage?.id === stage.id && styles.tableValueSelected]}>{stage.org_hp}</Text>
              <Text style={[styles.tableValue, styles.tunedValue, selectedStage?.id === stage.id && styles.tunedValueSelected]}>{stage.tun_hp}</Text>
              <Text style={[styles.tableDelta, selectedStage?.id === stage.id && styles.tableDeltaSelected]}>+{stage.delta_hp}</Text>
            </View>
            
            {/* Torque Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, selectedStage?.id === stage.id && styles.tableLabelSelected]}>Nm</Text>
              <Text style={[styles.tableValue, selectedStage?.id === stage.id && styles.tableValueSelected]}>{stage.org_tq}</Text>
              <Text style={[styles.tableValue, styles.tunedValue, selectedStage?.id === stage.id && styles.tunedValueSelected]}>{stage.tun_tq}</Text>
              <Text style={[styles.tableDelta, selectedStage?.id === stage.id && styles.tableDeltaSelected]}>+{stage.delta_tq}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Action Buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
          <Text style={styles.backButtonText}>
            {language === 'de' ? 'Zurück' : 'Back'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, (!selectedStage || saving) && styles.submitButtonDisabled]}
          onPress={handleRequestQuote}
          disabled={!selectedStage || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={20} color="#ffffff" />
          )}
          <Text style={styles.submitButtonText}>
            {saving 
              ? (language === 'de' ? 'Wird gespeichert...' : 'Saving...')
              : (language === 'de' ? 'Anfrage senden' : 'Send Request')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetScan}>
        <Ionicons name="refresh" size={18} color="#f5a623" />
        <Text style={styles.resetButtonText}>
          {language === 'de' ? 'Neuen Scan starten' : 'Start New Scan'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Step Indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['scan', 'data', 'vehicle'].map((step, index) => (
        <React.Fragment key={step}>
          <View style={[
            styles.stepCircle,
            (currentStep === step || 
             (currentStep === 'data' && index === 0) ||
             (currentStep === 'vehicle' && index <= 1)) && styles.stepCircleActive,
            currentStep === step && styles.stepCircleCurrent,
          ]}>
            {(currentStep === 'data' && index === 0) || (currentStep === 'vehicle' && index < 2) ? (
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep === step && styles.stepNumberActive,
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          {index < 2 && (
            <View style={[
              styles.stepLine,
              ((currentStep === 'data' && index === 0) || (currentStep === 'vehicle')) && styles.stepLineActive,
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'de' ? 'Fahrzeugschein Scanner' : 'Vehicle Registration Scanner'}
          </Text>
          <Text style={styles.subtitle}>
            {currentStep === 'scan' && (language === 'de' 
              ? 'Fotografieren Sie Ihren Fahrzeugschein' 
              : 'Take a photo of your vehicle registration')}
            {currentStep === 'data' && (language === 'de' 
              ? 'Überprüfen Sie die erkannten Daten' 
              : 'Review the detected data')}
            {currentStep === 'vehicle' && (language === 'de' 
              ? 'Wählen Sie Ihre Tuning-Stufe' 
              : 'Select your tuning stage')}
          </Text>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {currentStep === 'scan' && renderScanStep()}
        {currentStep === 'data' && renderDataStep()}
        {currentStep === 'vehicle' && renderVehicleStep()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          >
            {/* Camera Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setCameraVisible(false)}
              >
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>
                {language === 'de' ? 'Fahrzeugschein scannen' : 'Scan Registration'}
              </Text>
              <TouchableOpacity
                style={styles.cameraFlipButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Guide Overlay */}
            <View style={styles.guideOverlay}>
              <View style={styles.guideFrame}>
                <View style={styles.guideCorner} />
                <View style={[styles.guideCorner, styles.guideCornerTopRight]} />
                <View style={[styles.guideCorner, styles.guideCornerBottomLeft]} />
                <View style={[styles.guideCorner, styles.guideCornerBottomRight]} />
              </View>
              <Text style={styles.guideText}>
                {language === 'de' 
                  ? 'Fahrzeugschein im Rahmen positionieren' 
                  : 'Position registration within frame'}
              </Text>
            </View>

            {/* Camera Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={capturing}
              >
                {capturing ? (
                  <ActivityIndicator color="#f5a623" size="large" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111931',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8b8b8b',
    fontSize: 14,
    lineHeight: 20,
  },
  // Step Indicator
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
    width: 50,
    height: 2,
    backgroundColor: '#1a2d5a',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#f5a623',
  },
  // Scan Step
  imageContainer: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  scanningContainer: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanningText: {
    color: '#f5a623',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  mainActionButton: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f5a623',
    borderStyle: 'dashed',
  },
  mainActionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#162040',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainActionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainActionSubtitle: {
    color: '#8b8b8b',
    fontSize: 14,
    textAlign: 'center',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  tipsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  // Data Step
  dataContainer: {
    flex: 1,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  dataTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  dataCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#162040',
  },
  fieldRowAlt: {
    backgroundColor: '#162040',
  },
  fieldLabel: {
    color: '#8b8b8b',
    fontSize: 13,
    flex: 1,
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
  // Vehicle Step
  vehicleContainer: {
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  vehicleDetails: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  stagesTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  stageCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stageCardSelected: {
    backgroundColor: '#f5a623',
    borderColor: '#f5a623',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stageName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  stageNameSelected: {
    color: '#ffffff',
  },
  stageTable: {
    backgroundColor: '#162040',
    borderRadius: 12,
    overflow: 'hidden',
  },
  stageTableSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    flex: 1,
    color: '#8b8b8b',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableHeaderIconCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  tableLabel: {
    flex: 1,
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '600',
  },
  tableLabelSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  tableValue: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  tableValueSelected: {
    color: '#ffffff',
  },
  tunedValue: {
    color: '#f5a623',
    fontWeight: '700',
  },
  tunedValueSelected: {
    color: '#ffffff',
  },
  tableDelta: {
    flex: 1,
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableDeltaSelected: {
    color: '#90EE90',
  },
  // Navigation
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
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
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5a623',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  resetButtonText: {
    color: '#f5a623',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraCloseButton: {
    padding: 8,
  },
  cameraTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraFlipButton: {
    padding: 8,
  },
  guideOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: '85%',
    aspectRatio: 1.5,
    position: 'relative',
  },
  guideCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#f5a623',
  },
  guideCornerTopRight: {
    top: 0,
    left: undefined,
    right: 0,
    borderTopWidth: 4,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  guideCornerBottomLeft: {
    top: undefined,
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  guideCornerBottomRight: {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  guideText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
});
