import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { ChatAssistant } from '../../src/components/ChatAssistant';
import {
  getVehicleTypes,
  getManufacturers,
  getModels,
  getBuilts,
  getEngines,
  getStages,
  getEcus,
  getOptions,
} from '../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SelectOption {
  id: string;
  name: string;
  image?: string;
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
  delta_hp_percent: number;
  delta_tq_percent: number;
  price?: number;
}

interface ECU {
  id: string;
  name: string;
}

interface VehicleOption {
  id: number;
  name: string;
  image?: string;
  tooltip?: string;
}

type Step = 'type' | 'manufacturer' | 'model' | 'built' | 'engine' | 'stages';

const STEPS: Step[] = ['type', 'manufacturer', 'model', 'built', 'engine', 'stages'];

export default function ConfiguratorScreen() {
  const { t, language } = useLanguage();
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [chatVisible, setChatVisible] = useState<boolean>(false);
  
  // Data states
  const [types, setTypes] = useState<SelectOption[]>([]);
  const [manufacturers, setManufacturers] = useState<SelectOption[]>([]);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [builts, setBuilts] = useState<SelectOption[]>([]);
  const [engines, setEngines] = useState<SelectOption[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [ecus, setEcus] = useState<ECU[]>([]);
  const [options, setOptions] = useState<VehicleOption[]>([]);
  const [selectedEcu, setSelectedEcu] = useState<ECU | null>(null);
  const [loadingEcus, setLoadingEcus] = useState<boolean>(false);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  
  // Selection states
  const [selectedType, setSelectedType] = useState<SelectOption | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<SelectOption | null>(null);
  const [selectedModel, setSelectedModel] = useState<SelectOption | null>(null);
  const [selectedBuilt, setSelectedBuilt] = useState<SelectOption | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<SelectOption | null>(null);
  
  // Store mdt_id for API calls
  const [currentMdtId, setCurrentMdtId] = useState<string | null>(null);

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: -currentStep * SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [currentStep]);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const response = await getVehicleTypes();
      setTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = async (item: SelectOption) => {
    setSelectedType(item);
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setSelectedBuilt(null);
    setSelectedEngine(null);
    setManufacturers([]);
    setModels([]);
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    // Store mdt_id for subsequent API calls
    const mdtId = item.mdt_id || null;
    setCurrentMdtId(mdtId);
    
    setLoading(true);
    try {
      const response = await getManufacturers(item.id, mdtId || undefined);
      setManufacturers(response.data || []);
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectManufacturer = async (item: SelectOption) => {
    setSelectedManufacturer(item);
    setSelectedModel(null);
    setSelectedBuilt(null);
    setSelectedEngine(null);
    setModels([]);
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    setLoading(true);
    try {
      const response = await getModels(item.id, currentMdtId || undefined);
      setModels(response.data || []);
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (item: SelectOption) => {
    setSelectedModel(item);
    setSelectedBuilt(null);
    setSelectedEngine(null);
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    setLoading(true);
    try {
      const response = await getBuilts(item.id, currentMdtId || undefined);
      setBuilts(response.data || []);
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to load builts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBuilt = async (item: SelectOption) => {
    setSelectedBuilt(item);
    setSelectedEngine(null);
    setEngines([]);
    setStages([]);
    
    setLoading(true);
    try {
      const response = await getEngines(item.id, currentMdtId || undefined);
      setEngines(response.data || []);
      setCurrentStep(4);
    } catch (error) {
      console.error('Failed to load engines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEngine = async (item: SelectOption) => {
    setSelectedEngine(item);
    setStages([]);
    setEcus([]);
    setOptions([]);
    setSelectedEcu(null);
    
    setLoading(true);
    try {
      // Load stages and ECUs in parallel
      const [stagesResponse, ecusResponse] = await Promise.all([
        getStages(item.id, currentMdtId || undefined),
        getEcus(item.id, currentMdtId || undefined)
      ]);
      setStages(stagesResponse.data || []);
      setEcus(ecusResponse.data || []);
      setCurrentStep(5);
    } catch (error) {
      console.error('Failed to load stages/ecus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEcu = async (ecu: ECU) => {
    if (!selectedEngine) return;
    setSelectedEcu(ecu);
    setOptions([]);
    setLoadingOptions(true);
    
    try {
      const response = await getOptions(selectedEngine.id, ecu.id, currentMdtId || undefined);
      setOptions(response.data || []);
    } catch (error) {
      console.error('Failed to load options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetConfigurator = () => {
    setCurrentStep(0);
    setSelectedType(null);
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setSelectedBuilt(null);
    setSelectedEngine(null);
    setManufacturers([]);
    setModels([]);
    setBuilts([]);
    setEngines([]);
    setStages([]);
  };

  // Handle AI suggestion from chat
  const handleVehicleSuggestion = async (suggestion: {
    type_id?: string;
    manufacturer_id?: string;
    model_id?: string;
    built_id?: string;
    engine_id?: string;
  }) => {
    try {
      resetConfigurator();
      setLoading(true);
      
      // Load types first
      const typesResponse = await getVehicleTypes();
      const allTypes = typesResponse.data || [];
      setTypes(allTypes);
      
      if (suggestion.type_id) {
        const selectedTypeItem = allTypes.find((t: SelectOption) => t.id === suggestion.type_id);
        if (selectedTypeItem) {
          setSelectedType(selectedTypeItem);
          setCurrentStep(1);
          
          // Load manufacturers
          const manuResponse = await getManufacturers(suggestion.type_id);
          const allManus = manuResponse.data || [];
          setManufacturers(allManus);
          
          if (suggestion.manufacturer_id) {
            const selectedManu = allManus.find((m: SelectOption) => m.id === suggestion.manufacturer_id);
            if (selectedManu) {
              setSelectedManufacturer(selectedManu);
              setCurrentStep(2);
              
              // Load models
              const modelsResponse = await getModels(suggestion.manufacturer_id);
              const allModels = modelsResponse.data || [];
              setModels(allModels);
              
              if (suggestion.model_id) {
                const selectedModelItem = allModels.find((m: SelectOption) => m.id === suggestion.model_id);
                if (selectedModelItem) {
                  setSelectedModel(selectedModelItem);
                  setCurrentStep(3);
                  
                  // Load builts
                  const builtsResponse = await getBuilts(suggestion.model_id);
                  const allBuilts = builtsResponse.data || [];
                  setBuilts(allBuilts);
                  
                  if (suggestion.built_id) {
                    const selectedBuiltItem = allBuilts.find((b: SelectOption) => b.id === suggestion.built_id);
                    if (selectedBuiltItem) {
                      setSelectedBuilt(selectedBuiltItem);
                      setCurrentStep(4);
                      
                      // Load engines
                      const enginesResponse = await getEngines(suggestion.built_id);
                      const allEngines = enginesResponse.data || [];
                      setEngines(allEngines);
                      
                      if (suggestion.engine_id) {
                        const selectedEngineItem = allEngines.find((e: SelectOption) => e.id === suggestion.engine_id);
                        if (selectedEngineItem) {
                          setSelectedEngine(selectedEngineItem);
                          setCurrentStep(5);
                          
                          // Load stages
                          const stagesResponse = await getStages(suggestion.engine_id);
                          setStages(stagesResponse.data || []);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to apply vehicle suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (STEPS[currentStep]) {
      case 'type': return t('vehicleType');
      case 'manufacturer': return t('manufacturer');
      case 'model': return t('model');
      case 'built': return t('version');
      case 'engine': return t('engine');
      case 'stages': return t('tuningStages');
      default: return '';
    }
  };

  const getSelectionPath = () => {
    const parts = [];
    if (selectedType) parts.push(selectedType.name);
    if (selectedManufacturer) parts.push(selectedManufacturer.name);
    if (selectedModel) parts.push(selectedModel.name);
    if (selectedBuilt) parts.push(selectedBuilt.name);
    if (selectedEngine) parts.push(selectedEngine.name);
    return parts.join(' > ');
  };

  const renderGridItem = (item: SelectOption, onSelect: (item: SelectOption) => void) => (
    <TouchableOpacity
      key={item.id}
      style={styles.gridItem}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.gridItemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#f5a623" />
    </TouchableOpacity>
  );

  const renderGrid = (items: SelectOption[], onSelect: (item: SelectOption) => void) => (
    <ScrollView style={styles.gridContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {items.map((item) => renderGridItem(item, onSelect))}
      </View>
    </ScrollView>
  );

  const renderStageCard = (stage: Stage) => (
    <View key={stage.id} style={styles.stageCard}>
      {/* Stage Name */}
      <View style={styles.stageHeader}>
        <Ionicons name="flash" size={24} color="#f5a623" />
        <Text style={styles.stageName}>{stage.name}</Text>
      </View>
      
      {/* Power/Torque Table */}
      <View style={styles.stageTable}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}></Text>
          <Text style={styles.tableHeaderCell}>Original</Text>
          <Text style={styles.tableHeaderCell}>{stage.name}</Text>
          <View style={styles.tableHeaderIconCell}>
            <Ionicons name="trending-up" size={18} color="#f5a623" />
          </View>
        </View>
        
        {/* HP Row */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>PS</Text>
          <Text style={styles.tableValue}>{stage.org_hp}</Text>
          <Text style={[styles.tableValue, styles.tunedValue]}>{stage.tun_hp}</Text>
          <Text style={styles.tableDelta}>+{stage.delta_hp}</Text>
        </View>
        
        {/* Torque Row */}
        <View style={styles.tableRow}>
          <Text style={styles.tableLabel}>Nm</Text>
          <Text style={styles.tableValue}>{stage.org_tq}</Text>
          <Text style={[styles.tableValue, styles.tunedValue]}>{stage.tun_tq}</Text>
          <Text style={styles.tableDelta}>+{stage.delta_tq}</Text>
        </View>
      </View>
      
      {/* Quote Button */}
      <TouchableOpacity style={styles.quoteButton}>
        <Text style={styles.quoteButtonText}>{t('requestQuote')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEcuSection = () => (
    <View style={styles.ecuSection}>
      <Text style={styles.sectionTitle}>ECUs</Text>
      <View style={styles.ecuGrid}>
        {ecus.map((ecu) => (
          <TouchableOpacity
            key={ecu.id}
            style={[
              styles.ecuButton,
              selectedEcu?.id === ecu.id && styles.ecuButtonActive,
            ]}
            onPress={() => handleSelectEcu(ecu)}
          >
            <Text
              style={[
                styles.ecuButtonText,
                selectedEcu?.id === ecu.id && styles.ecuButtonTextActive,
              ]}
            >
              {ecu.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOptionsSection = () => (
    <View style={styles.optionsSection}>
      <Text style={styles.sectionTitle}>
        {language === 'de' ? 'Verfügbare Optionen' : 'Available Options'}
      </Text>
      {loadingOptions ? (
        <ActivityIndicator color="#f5a623" size="small" style={{ marginTop: 16 }} />
      ) : options.length > 0 ? (
        <View style={styles.optionsGrid}>
          {options.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <Text style={styles.optionName}>{option.name}</Text>
              {option.tooltip && (
                <Text style={styles.optionTooltip} numberOfLines={2}>
                  {option.tooltip}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : selectedEcu ? (
        <Text style={styles.noOptionsText}>
          {language === 'de' ? 'Keine Optionen verfügbar' : 'No options available'}
        </Text>
      ) : null}
    </View>
  );

  const renderStages = () => (
    <ScrollView style={styles.stagesContainer} showsVerticalScrollIndicator={false}>
      {/* Stages Cards */}
      {stages.map(renderStageCard)}
      
      {/* ECUs Section */}
      {ecus.length > 0 && renderEcuSection()}
      
      {/* Options Section (only show if ECU selected) */}
      {selectedEcu && renderOptionsSection()}
      
      <View style={{ height: 30 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <View style={styles.stepHeader}>
        <View style={styles.headerLeft}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{getStepTitle()}</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {STEPS.slice(0, 5).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Selection Path */}
      {getSelectionPath() && (
        <View style={styles.pathContainer}>
          <Text style={styles.pathText} numberOfLines={1}>
            {getSelectionPath()}
          </Text>
          <TouchableOpacity onPress={resetConfigurator} style={styles.resetButton}>
            <Ionicons name="refresh" size={18} color="#f5a623" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#f5a623" size="large" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      )}

      {/* Animated Slides */}
      <Animated.View
        style={[
          styles.slidesContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Step 0: Vehicle Types */}
        <View style={styles.slide}>
          {renderGrid(types, handleSelectType)}
        </View>

        {/* Step 1: Manufacturers */}
        <View style={styles.slide}>
          {renderGrid(manufacturers, handleSelectManufacturer)}
        </View>

        {/* Step 2: Models */}
        <View style={styles.slide}>
          {renderGrid(models, handleSelectModel)}
        </View>

        {/* Step 3: Builts/Versions */}
        <View style={styles.slide}>
          {renderGrid(builts, handleSelectBuilt)}
        </View>

        {/* Step 4: Engines */}
        <View style={styles.slide}>
          {renderGrid(engines, handleSelectEngine)}
        </View>

        {/* Step 5: Tuning Stages */}
        <View style={styles.slide}>
          {renderStages()}
        </View>
      </Animated.View>

      {/* Chat FAB Button */}
      <TouchableOpacity 
        style={styles.chatFab}
        onPress={() => setChatVisible(true)}
      >
        <Ionicons name="chatbubbles" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Chat Assistant */}
      <ChatAssistant
        isVisible={chatVisible}
        onClose={() => setChatVisible(false)}
        onVehicleSuggestion={handleVehicleSuggestion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111931',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333333',
  },
  progressDotActive: {
    backgroundColor: '#f5a623',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: '#f5a623',
    opacity: 0.5,
  },
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#0d1526',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  pathText: {
    flex: 1,
    color: '#8b8b8b',
    fontSize: 12,
  },
  resetButton: {
    padding: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 23, 23, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 16,
  },
  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 6,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
  },
  gridContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#162040',
  },
  gridItemText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  stagesContainer: {
    flex: 1,
  },
  stageCard: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  stageTable: {
    backgroundColor: '#162040',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    flex: 1,
    color: '#8b8b8b',
    fontSize: 13,
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
    paddingVertical: 14,
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
  tableValue: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  tableDelta: {
    flex: 1,
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tunedValue: {
    color: '#f5a623',
    fontWeight: '700',
  },
  ecuSection: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  ecuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ecuButton: {
    backgroundColor: '#162040',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1a2d5a',
  },
  ecuButtonActive: {
    backgroundColor: '#f5a623',
    borderColor: '#f5a623',
  },
  ecuButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  ecuButtonTextActive: {
    color: '#ffffff',
  },
  optionsSection: {
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  optionItem: {
    backgroundColor: '#162040',
    borderRadius: 10,
    padding: 14,
  },
  optionName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionTooltip: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  noOptionsText: {
    color: '#8b8b8b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  quoteButton: {
    backgroundColor: '#f5a623',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  chatFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5a623',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
