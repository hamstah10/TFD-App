import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  getVehicleTypes,
  getManufacturers,
  getModels,
  getBuilts,
  getEngines,
  getStages,
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

const TUNING_TOOLS = ['Autotuner', 'Flex', 'CMD', 'Kess3'];
const METHODS = ['OBD', 'Bench', 'BDM'];
const SLAVE_MASTER = ['Slave', 'Master'];

export default function FilesScreen() {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setOrderData(prev => ({
          ...prev,
          file: {
            name: file.name,
            size: file.size || 0,
            uri: file.uri,
          },
        }));
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
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        language === 'de' ? 'Erfolgreich!' : 'Success!',
        language === 'de' 
          ? 'Ihre Bestellung wurde erfolgreich übermittelt. Sie erhalten in Kürze eine Bestätigung.' 
          : 'Your order has been submitted successfully. You will receive a confirmation shortly.',
        [{ text: 'OK', onPress: () => {
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
        }}]
      );
    }, 2000);
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
              <Ionicons name="cloud-upload" size={48} color="#bd1f22" />
            </View>
            <Text style={styles.uploadText}>
              {language === 'de' ? 'Datei auswählen' : 'Select File'}
            </Text>
            <Text style={styles.uploadHint}>
              {language === 'de' 
                ? 'Unterstützte Formate: .bin, .ori, .mod' 
                : 'Supported formats: .bin, .ori, .mod'}
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
        <ActivityIndicator color="#bd1f22" size="large" style={{ marginVertical: 20 }} />
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
            <Ionicons name="arrow-back" size={20} color="#bd1f22" />
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
            <Ionicons name="arrow-back" size={20} color="#bd1f22" />
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
            <Ionicons name="arrow-back" size={20} color="#bd1f22" />
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
            <Ionicons name="arrow-back" size={20} color="#bd1f22" />
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
            <Ionicons name="arrow-back" size={20} color="#bd1f22" />
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
                  <Ionicons name="flash" size={20} color={orderData.stage?.id === stage.id ? '#ffffff' : '#bd1f22'} />
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
            <Ionicons name="document" size={24} color="#bd1f22" />
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
            <Ionicons name="construct" size={24} color="#bd1f22" />
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
            <Ionicons name="car" size={24} color="#bd1f22" />
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
            <Ionicons name="flash" size={24} color="#bd1f22" />
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'de' ? 'Tuning-Auftrag' : 'Tuning Order'}
        </Text>
      </View>

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

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
    paddingHorizontal: 20,
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
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  stepCircleActive: {
    backgroundColor: '#bd1f22',
    borderColor: '#bd1f22',
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
    backgroundColor: '#2a2a2a',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#bd1f22',
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
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
  },
  uploadIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#1a1a1a',
  },
  changeFileText: {
    color: '#bd1f22',
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
    backgroundColor: '#121212',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minWidth: '22%',
    alignItems: 'center',
  },
  optionButtonWide: {
    flex: 1,
  },
  optionButtonActive: {
    backgroundColor: '#bd1f22',
    borderColor: '#bd1f22',
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
    backgroundColor: '#121212',
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
    color: '#bd1f22',
    fontSize: 14,
    fontWeight: '500',
  },
  stageItem: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stageItemActive: {
    backgroundColor: '#bd1f22',
    borderColor: '#bd1f22',
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
    backgroundColor: '#121212',
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
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#1a1a1a',
    marginVertical: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#bd1f22',
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
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#bd1f22',
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
});
