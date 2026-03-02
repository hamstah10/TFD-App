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
import { scanFahrzeugschein, FahrzeugscheinData } from '../../src/services/api';

interface VehicleField {
  label_de: string;
  label_en: string;
  value: string | undefined;
  key: string;
}

export default function FahrzeugscheinScreen() {
  const { language } = useLanguage();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<FahrzeugscheinData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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
    
    try {
      const result = await scanFahrzeugschein(base64);
      
      if (result.success && result.data) {
        setScannedData(result.data);
      } else {
        Alert.alert(
          language === 'de' ? 'Fehler' : 'Error',
          result.error || (language === 'de' 
            ? 'Dokument konnte nicht erkannt werden. Bitte versuchen Sie es erneut.' 
            : 'Document could not be recognized. Please try again.')
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' 
          : 'An error occurred. Please try again.'
      );
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

  const resetScan = () => {
    setScannedData(null);
    setCapturedImage(null);
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
      { key: 'g', label_de: 'Leergewicht (kg)', label_en: 'Empty Weight (kg)', value: scannedData.g },
      { key: 'f1', label_de: 'Zulässige Gesamtmasse', label_en: 'Max Weight', value: scannedData.f1 },
      { key: 'j', label_de: 'Fahrzeugklasse', label_en: 'Vehicle Class', value: scannedData.j },
      { key: 'field_14', label_de: 'Emissionsklasse', label_en: 'Emission Class', value: scannedData.field_14 },
      { key: 'r', label_de: 'Farbe', label_en: 'Color', value: scannedData.r },
      { key: 'name', label_de: 'Halter Name', label_en: 'Owner Name', value: scannedData.name },
      { key: 'firstname', label_de: 'Vorname', label_en: 'First Name', value: scannedData.firstname },
      { key: 'address', label_de: 'Adresse', label_en: 'Address', value: scannedData.address || `${scannedData.address1 || ''} ${scannedData.address2 || ''}`.trim() },
    ].filter(field => field.value);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'de' ? 'Fahrzeugschein Scanner' : 'Vehicle Registration Scanner'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'de' 
              ? 'Fotografieren Sie Ihren Fahrzeugschein, um die Daten automatisch zu erfassen' 
              : 'Take a photo of your vehicle registration to automatically capture the data'}
          </Text>
        </View>

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
            <ActivityIndicator color="#bd1f22" size="large" />
            <Text style={styles.scanningText}>
              {language === 'de' ? 'Dokument wird analysiert...' : 'Analyzing document...'}
            </Text>
          </View>
        )}

        {/* Results */}
        {scannedData && !scanning && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
              <Text style={styles.resultsTitle}>
                {language === 'de' ? 'Erkannte Daten' : 'Detected Data'}
              </Text>
            </View>
            
            {getVehicleFields().map((field, index) => (
              <View key={field.key} style={[styles.fieldRow, index % 2 === 0 && styles.fieldRowAlt]}>
                <Text style={styles.fieldLabel}>
                  {language === 'de' ? field.label_de : field.label_en}
                </Text>
                <Text style={styles.fieldValue}>{field.value}</Text>
              </View>
            ))}
            
            <TouchableOpacity style={styles.resetButton} onPress={resetScan}>
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.resetButtonText}>
                {language === 'de' ? 'Neuen Scan starten' : 'Start New Scan'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons - show only when not scanning and no results */}
        {!scanning && !scannedData && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.mainActionButton} onPress={openCamera}>
              <View style={styles.mainActionIcon}>
                <Ionicons name="camera" size={40} color="#bd1f22" />
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
              <Ionicons name="images" size={24} color="#bd1f22" />
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
                {language === 'de' 
                  ? 'Gute Beleuchtung verwenden' 
                  : 'Use good lighting'}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="scan" size={20} color="#2196f3" />
              <Text style={styles.tipText}>
                {language === 'de' 
                  ? 'Dokument vollständig im Bild' 
                  : 'Document fully visible'}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="hand-left" size={20} color="#4caf50" />
              <Text style={styles.tipText}>
                {language === 'de' 
                  ? 'Kamera ruhig halten' 
                  : 'Hold camera steady'}
              </Text>
            </View>
          </View>
        )}

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
                  <ActivityIndicator color="#bd1f22" size="large" />
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
    backgroundColor: '#171717',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
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
  imageContainer: {
    backgroundColor: '#121212',
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
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanningText: {
    color: '#bd1f22',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  resultsContainer: {
    backgroundColor: '#121212',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 10,
  },
  resultsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  fieldRowAlt: {
    backgroundColor: '#1a1a1a',
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#bd1f22',
    padding: 16,
    gap: 8,
    margin: 16,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  mainActionButton: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bd1f22',
    borderStyle: 'dashed',
  },
  mainActionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#121212',
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
    backgroundColor: '#121212',
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
    borderColor: '#bd1f22',
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
