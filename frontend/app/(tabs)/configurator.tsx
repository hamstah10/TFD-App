import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';
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

export default function ConfiguratorScreen() {
  const { t, language } = useLanguage();
  
  const [types, setTypes] = useState<SelectOption[]>([]);
  const [manufacturers, setManufacturers] = useState<SelectOption[]>([]);
  const [models, setModels] = useState<SelectOption[]>([]);
  const [builts, setBuilts] = useState<SelectOption[]>([]);
  const [engines, setEngines] = useState<SelectOption[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedBuilt, setSelectedBuilt] = useState<string>('');
  const [selectedEngine, setSelectedEngine] = useState<string>('');
  
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    setLoading('types');
    try {
      const response = await getVehicleTypes();
      setTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load types:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleTypeChange = async (typeId: string) => {
    setSelectedType(typeId);
    setSelectedManufacturer('');
    setSelectedModel('');
    setSelectedBuilt('');
    setSelectedEngine('');
    setManufacturers([]);
    setModels([]);
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    if (typeId) {
      setLoading('manufacturers');
      try {
        const response = await getManufacturers(typeId);
        setManufacturers(response.data || []);
      } catch (error) {
        console.error('Failed to load manufacturers:', error);
      } finally {
        setLoading(null);
      }
    }
  };

  const handleManufacturerChange = async (manufacturerId: string) => {
    setSelectedManufacturer(manufacturerId);
    setSelectedModel('');
    setSelectedBuilt('');
    setSelectedEngine('');
    setModels([]);
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    if (manufacturerId) {
      setLoading('models');
      try {
        const response = await getModels(manufacturerId);
        setModels(response.data || []);
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoading(null);
      }
    }
  };

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    setSelectedBuilt('');
    setSelectedEngine('');
    setBuilts([]);
    setEngines([]);
    setStages([]);
    
    if (modelId) {
      setLoading('builts');
      try {
        const response = await getBuilts(modelId);
        setBuilts(response.data || []);
      } catch (error) {
        console.error('Failed to load builts:', error);
      } finally {
        setLoading(null);
      }
    }
  };

  const handleBuiltChange = async (builtId: string) => {
    setSelectedBuilt(builtId);
    setSelectedEngine('');
    setEngines([]);
    setStages([]);
    
    if (builtId) {
      setLoading('engines');
      try {
        const response = await getEngines(builtId);
        setEngines(response.data || []);
      } catch (error) {
        console.error('Failed to load engines:', error);
      } finally {
        setLoading(null);
      }
    }
  };

  const handleEngineChange = async (engineId: string) => {
    setSelectedEngine(engineId);
    setStages([]);
    
    if (engineId) {
      setLoading('stages');
      try {
        const response = await getStages(engineId);
        setStages(response.data || []);
      } catch (error) {
        console.error('Failed to load stages:', error);
      } finally {
        setLoading(null);
      }
    }
  };

  const renderPicker = (
    label: string,
    placeholder: string,
    value: string,
    options: SelectOption[],
    onChange: (value: string) => void,
    disabled: boolean,
    loadingKey: string
  ) => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={[styles.pickerWrapper, disabled && styles.pickerDisabled]}>
        {loading === loadingKey ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#e94560" size="small" />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : (
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            enabled={!disabled && options.length > 0}
            style={styles.picker}
            dropdownIconColor="#e94560"
          >
            <Picker.Item label={placeholder} value="" color="#8b8b8b" />
            {options.map((option) => (
              <Picker.Item
                key={option.id}
                label={option.name}
                value={option.id}
                color={Platform.OS === 'ios' ? '#ffffff' : '#000000'}
              />
            ))}
          </Picker>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('selectYourVehicle')}</Text>
          <LanguageSwitch />
        </View>

        {/* Selectors */}
        <View style={styles.selectorsContainer}>
          {renderPicker(
            t('vehicleType'),
            t('selectType'),
            selectedType,
            types,
            handleTypeChange,
            false,
            'types'
          )}
          
          {renderPicker(
            t('manufacturer'),
            t('selectManufacturer'),
            selectedManufacturer,
            manufacturers,
            handleManufacturerChange,
            !selectedType,
            'manufacturers'
          )}
          
          {renderPicker(
            t('model'),
            t('selectModel'),
            selectedModel,
            models,
            handleModelChange,
            !selectedManufacturer,
            'models'
          )}
          
          {renderPicker(
            t('version'),
            t('selectVersion'),
            selectedBuilt,
            builts,
            handleBuiltChange,
            !selectedModel,
            'builts'
          )}
          
          {renderPicker(
            t('engine'),
            t('selectEngine'),
            selectedEngine,
            engines,
            handleEngineChange,
            !selectedBuilt,
            'engines'
          )}
        </View>

        {/* Tuning Stages */}
        {stages.length > 0 && (
          <View style={styles.stagesContainer}>
            <Text style={styles.stagesTitle}>{t('tuningStages')}</Text>
            {stages.map((stage) => (
              <View key={stage.id} style={styles.stageCard}>
                <View style={styles.stageHeader}>
                  <Ionicons name="flash" size={24} color="#e94560" />
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
            ))}
          </View>
        )}

        {loading === 'stages' && (
          <View style={styles.centerLoading}>
            <ActivityIndicator color="#e94560" size="large" />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  selectorsContainer: {
    gap: 16,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  pickerLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    overflow: 'hidden',
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  picker: {
    color: '#ffffff',
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 10,
  },
  loadingText: {
    color: '#8b8b8b',
  },
  stagesContainer: {
    marginTop: 30,
  },
  stagesTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  stageCard: {
    backgroundColor: '#16213e',
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
    backgroundColor: '#1a1a2e',
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
    color: '#e94560',
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
    color: '#e94560',
    fontSize: 28,
    fontWeight: '700',
  },
  quoteButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  centerLoading: {
    padding: 40,
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 30,
  },
});
