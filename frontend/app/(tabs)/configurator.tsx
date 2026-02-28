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
import {
  getVehicleTypes,
  getManufacturers,
  getModels,
  getBuilts,
  getEngines,
  getStages,
} from '../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SelectOption {
  id: string;
  name: string;
}

interface Stage {
  id: string;
  name: string;
  description_de?: string;
  description_en?: string;
  original_power?: string;
  tuned_power?: string;
  original_torque?: string;
  tuned_torque?: string;
  price?: number;
}

type Step = 'type' | 'manufacturer' | 'model' | 'built' | 'engine' | 'stages';

const STEPS: Step[] = ['type', 'manufacturer', 'model', 'built', 'engine', 'stages'];

export default function ConfiguratorScreen() {
  const { t, language } = useLanguage();
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Data states
  const [types, setTypes] = useState<SelectOption[]>([]);
  const [manufacturers, setManufacturers] = useState<SelectOption[]>([]);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [builts, setBuilts] = useState<SelectOption[]>([]);
  const [engines, setEngines] = useState<SelectOption[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  // Selection states
  const [selectedType, setSelectedType] = useState<SelectOption | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<SelectOption | null>(null);
  const [selectedModel, setSelectedModel] = useState<SelectOption | null>(null);
  const [selectedBuilt, setSelectedBuilt] = useState<SelectOption | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<SelectOption | null>(null);

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
    
    setLoading(true);
    try {
      const response = await getManufacturers(item.id);
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
      const response = await getModels(item.id);
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
      const response = await getBuilts(item.id);
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
      const response = await getEngines(item.id);
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
    
    setLoading(true);
    try {
      const response = await getStages(item.id);
      setStages(response.data || []);
      setCurrentStep(5);
    } catch (error) {
      console.error('Failed to load stages:', error);
    } finally {
      setLoading(false);
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
      <Ionicons name="chevron-forward" size={20} color="#bd1f22" />
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
      <View style={styles.stageHeader}>
        <Ionicons name="flash" size={24} color="#bd1f22" />
        <Text style={styles.stageName}>{stage.name}</Text>
      </View>
      
      <Text style={styles.stageDescription}>
        {language === 'de' ? stage.description_de : stage.description_en}
      </Text>
      
      <View style={styles.stageDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('originalPower')}</Text>
          <Text style={styles.detailValue}>{stage.original_power}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('tunedPower')}</Text>
          <Text style={[styles.detailValue, styles.tunedValue]}>{stage.tuned_power}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('originalTorque')}</Text>
          <Text style={styles.detailValue}>{stage.original_torque}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('tunedTorque')}</Text>
          <Text style={[styles.detailValue, styles.tunedValue]}>{stage.tuned_torque}</Text>
        </View>
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>{t('price')}</Text>
        <Text style={styles.priceValue}>€{stage.price}</Text>
      </View>
      
      <TouchableOpacity style={styles.quoteButton}>
        <Text style={styles.quoteButtonText}>{t('requestQuote')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStages = () => (
    <ScrollView style={styles.stagesContainer} showsVerticalScrollIndicator={false}>
      {stages.map(renderStageCard)}
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
            <Ionicons name="refresh" size={18} color="#bd1f22" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#bd1f22" size="large" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontSize: 22,
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
    backgroundColor: '#bd1f22',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: '#bd1f22',
    opacity: 0.5,
  },
  pathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#121212',
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
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
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
    backgroundColor: '#121212',
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
  stageDescription: {
    color: '#a0a0a0',
    fontSize: 14,
    marginBottom: 16,
  },
  stageDetails: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  tunedValue: {
    color: '#bd1f22',
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    color: '#8b8b8b',
    fontSize: 16,
  },
  priceValue: {
    color: '#bd1f22',
    fontSize: 28,
    fontWeight: '700',
  },
  quoteButton: {
    backgroundColor: '#bd1f22',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
