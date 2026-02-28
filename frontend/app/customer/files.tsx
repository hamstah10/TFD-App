import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';

// Mock data for files
const MOCK_FILES = [
  {
    id: '1',
    name: 'Original_ECU_Audi_A4.bin',
    size: '2.4 MB',
    uploaded_at: '2024-02-28',
    type: 'original',
    status: 'processed',
  },
  {
    id: '2',
    name: 'Stage1_Audi_A4.bin',
    size: '2.4 MB',
    uploaded_at: '2024-02-28',
    type: 'tuned',
    status: 'ready',
  },
  {
    id: '3',
    name: 'Original_BMW_330i.bin',
    size: '3.1 MB',
    uploaded_at: '2024-02-27',
    type: 'original',
    status: 'processing',
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'original':
      return 'document';
    case 'tuned':
      return 'flash';
    default:
      return 'document-outline';
  }
};

const getStatusInfo = (status: string, language: string) => {
  const statusMap: { [key: string]: { label: string; color: string } } = {
    processing: {
      label: language === 'de' ? 'Verarbeitung' : 'Processing',
      color: '#ff9800',
    },
    processed: {
      label: language === 'de' ? 'Verarbeitet' : 'Processed',
      color: '#2196f3',
    },
    ready: {
      label: language === 'de' ? 'Bereit' : 'Ready',
      color: '#4caf50',
    },
  };
  return statusMap[status] || statusMap.processing;
};

export default function FilesScreen() {
  const { language } = useLanguage();
  const [files] = useState(MOCK_FILES);

  const handleUpload = () => {
    Alert.alert(
      language === 'de' ? 'Datei hochladen' : 'Upload File',
      language === 'de' 
        ? 'Diese Funktion wird in Kürze verfügbar sein.' 
        : 'This feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleDownload = (fileName: string) => {
    Alert.alert(
      language === 'de' ? 'Download' : 'Download',
      language === 'de' 
        ? `${fileName} wird heruntergeladen...` 
        : `Downloading ${fileName}...`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'de' ? 'Meine Dateien' : 'My Files'}
        </Text>
      </View>

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <View style={styles.uploadIcon}>
          <Ionicons name="cloud-upload" size={32} color="#bd1f22" />
        </View>
        <View style={styles.uploadText}>
          <Text style={styles.uploadTitle}>
            {language === 'de' ? 'Datei hochladen' : 'Upload File'}
          </Text>
          <Text style={styles.uploadSubtitle}>
            {language === 'de' 
              ? 'Ziehen Sie Dateien hierher oder klicken Sie zum Durchsuchen' 
              : 'Drag files here or click to browse'}
          </Text>
        </View>
        <Ionicons name="add-circle" size={28} color="#bd1f22" />
      </TouchableOpacity>

      {/* Files List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {language === 'de' ? 'Hochgeladene Dateien' : 'Uploaded Files'}
        </Text>

        {files.map((file) => {
          const statusInfo = getStatusInfo(file.status, language);
          return (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileIconContainer}>
                <Ionicons 
                  name={getFileIcon(file.type) as any} 
                  size={24} 
                  color={file.type === 'tuned' ? '#4caf50' : '#bd1f22'} 
                />
              </View>
              
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.name}</Text>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileSize}>{file.size}</Text>
                  <Text style={styles.fileDot}>•</Text>
                  <Text style={styles.fileDate}>{file.uploaded_at}</Text>
                </View>
              </View>

              <View style={styles.fileActions}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Text style={styles.statusText}>{statusInfo.label}</Text>
                </View>
                {file.status === 'ready' && (
                  <TouchableOpacity 
                    style={styles.downloadButton}
                    onPress={() => handleDownload(file.name)}
                  >
                    <Ionicons name="download" size={20} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {files.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#8b8b8b" />
            <Text style={styles.emptyText}>
              {language === 'de' 
                ? 'Keine Dateien vorhanden' 
                : 'No files available'}
            </Text>
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#2196f3" />
        <Text style={styles.infoText}>
          {language === 'de' 
            ? 'Unterstützte Formate: .bin, .ori, .mod - Max. Dateigröße: 10 MB' 
            : 'Supported formats: .bin, .ori, .mod - Max file size: 10 MB'}
        </Text>
      </View>

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
    paddingVertical: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    flex: 1,
    marginLeft: 16,
  },
  uploadTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadSubtitle: {
    color: '#8b8b8b',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fileSize: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  fileDot: {
    color: '#8b8b8b',
    marginHorizontal: 6,
  },
  fileDate: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  fileActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#bd1f22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8b8b8b',
    fontSize: 16,
    marginTop: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#2196f3',
    fontSize: 12,
  },
  bottomSpacer: {
    height: 30,
  },
});
