import React, { useState, useRef, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { saveCustomerPhoto, getCustomerPhotos, deleteCustomerPhoto, CustomerPhoto } from '../../src/services/api';

interface CapturedPhoto {
  id: string;
  base64: string;
  filename?: string;
  description?: string;
  createdAt: string;
}

export default function PhotosScreen() {
  const { language } = useLanguage();
  const { getAccessToken } = useAuth();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const data = await getCustomerPhotos(token);
        // Map API response to local interface
        const mappedPhotos: CapturedPhoto[] = data.map((p: CustomerPhoto) => ({
          id: p.id,
          base64: p.base64 || '',
          filename: p.filename,
          description: p.description,
          createdAt: p.createdAt,
        }));
        setPhotos(mappedPhotos);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        await savePhotoToServer(asset.base64, 'gallery_image.jpg');
      }
    }
  };

  const savePhotoToServer = async (base64: string, filename: string) => {
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const newPhoto = await saveCustomerPhoto(token, base64, filename);
      // Map to local interface
      const mappedPhoto: CapturedPhoto = {
        id: newPhoto.id,
        base64: base64,
        filename: newPhoto.filename,
        description: newPhoto.description,
        createdAt: newPhoto.createdAt,
      };
      setPhotos(prev => [mappedPhoto, ...prev]);
      Alert.alert(
        language === 'de' ? 'Erfolg' : 'Success',
        language === 'de' ? 'Foto wurde gespeichert!' : 'Photo saved successfully!'
      );
    } catch (error) {
      console.error('Failed to save photo:', error);
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' ? 'Foto konnte nicht gespeichert werden.' : 'Failed to save photo.'
      );
    } finally {
      setSaving(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !capturing) {
      setCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        
        if (photo && photo.base64) {
          setCameraVisible(false);
          await savePhotoToServer(photo.base64, `photo_${Date.now()}.jpg`);
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

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      language === 'de' ? 'Foto löschen' : 'Delete Photo',
      language === 'de' ? 'Möchten Sie dieses Foto wirklich löschen?' : 'Are you sure you want to delete this photo?',
      [
        { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
        {
          text: language === 'de' ? 'Löschen' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAccessToken();
              if (!token) throw new Error('Not authenticated');
              await deleteCustomerPhoto(token, photoId);
              setPhotos(prev => prev.filter(p => p.id !== photoId));
            } catch (error) {
              console.error('Failed to delete photo:', error);
              Alert.alert(
                language === 'de' ? 'Fehler' : 'Error',
                language === 'de' ? 'Foto konnte nicht gelöscht werden.' : 'Failed to delete photo.'
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#bbcf4e" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#bbcf4e"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'de' ? 'Meine Fotos' : 'My Photos'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={openCamera} disabled={saving}>
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={28} color="#bbcf4e" />
            </View>
            <Text style={styles.actionText}>
              {language === 'de' ? 'Foto aufnehmen' : 'Take Photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={pickImage} disabled={saving}>
            <View style={styles.actionIcon}>
              <Ionicons name="images" size={28} color="#bbcf4e" />
            </View>
            <Text style={styles.actionText}>
              {language === 'de' ? 'Aus Galerie' : 'From Gallery'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saving Indicator */}
        {saving && (
          <View style={styles.savingContainer}>
            <ActivityIndicator color="#bbcf4e" size="small" />
            <Text style={styles.savingText}>
              {language === 'de' ? 'Foto wird gespeichert...' : 'Saving photo...'}
            </Text>
          </View>
        )}

        {/* Photos Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Gespeicherte Fotos' : 'Saved Photos'} ({photos.length})
          </Text>

          {photos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={64} color="#8b8b8b" />
              <Text style={styles.emptyText}>
                {language === 'de' 
                  ? 'Noch keine Fotos gespeichert' 
                  : 'No photos saved yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {language === 'de' 
                  ? 'Fotos werden in der Cloud gespeichert' 
                  : 'Photos are saved to the cloud'}
              </Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${photo.base64}` }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoDate}>{formatDate(photo.created_at)}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePhoto(photo.id)}
                    >
                      <Ionicons name="trash" size={18} color="#ff4757" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

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
                {language === 'de' ? 'Foto aufnehmen' : 'Take Photo'}
              </Text>
              <TouchableOpacity
                style={styles.cameraFlipButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Camera Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={capturing}
              >
                {capturing ? (
                  <ActivityIndicator color="#bbcf4e" size="large" />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111931',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#162040',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#162040',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  savingText: {
    color: '#bbcf4e',
    fontSize: 14,
    fontWeight: '600',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#0d1526',
    borderRadius: 16,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#8b8b8b',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '48%',
    backgroundColor: '#0d1526',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  photoDate: {
    color: '#8b8b8b',
    fontSize: 11,
  },
  deleteButton: {
    padding: 4,
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
