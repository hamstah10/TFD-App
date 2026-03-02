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

interface CapturedPhoto {
  id: string;
  uri: string;
  base64: string;
  timestamp: Date;
}

export default function PhotosScreen() {
  const { language } = useLanguage();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newPhoto: CapturedPhoto = {
        id: Date.now().toString(),
        uri: asset.uri,
        base64: asset.base64 || '',
        timestamp: new Date(),
      };
      setPhotos(prev => [newPhoto, ...prev]);
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
        
        if (photo) {
          const newPhoto: CapturedPhoto = {
            id: Date.now().toString(),
            uri: photo.uri,
            base64: photo.base64 || '',
            timestamp: new Date(),
          };
          setPhotos(prev => [newPhoto, ...prev]);
          setCameraVisible(false);
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

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      language === 'de' ? 'Foto löschen' : 'Delete Photo',
      language === 'de' ? 'Möchten Sie dieses Foto wirklich löschen?' : 'Are you sure you want to delete this photo?',
      [
        { text: language === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
        {
          text: language === 'de' ? 'Löschen' : 'Delete',
          style: 'destructive',
          onPress: () => setPhotos(prev => prev.filter(p => p.id !== photoId)),
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'de' ? 'Meine Fotos' : 'My Photos'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={openCamera}>
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={28} color="#bd1f22" />
            </View>
            <Text style={styles.actionText}>
              {language === 'de' ? 'Foto aufnehmen' : 'Take Photo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <View style={styles.actionIcon}>
              <Ionicons name="images" size={28} color="#bd1f22" />
            </View>
            <Text style={styles.actionText}>
              {language === 'de' ? 'Aus Galerie' : 'From Gallery'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photos Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'de' ? 'Aufgenommene Fotos' : 'Captured Photos'} ({photos.length})
          </Text>

          {photos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="camera-outline" size={64} color="#8b8b8b" />
              <Text style={styles.emptyText}>
                {language === 'de' 
                  ? 'Noch keine Fotos aufgenommen' 
                  : 'No photos captured yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {language === 'de' 
                  ? 'Tippen Sie auf "Foto aufnehmen" um zu beginnen' 
                  : 'Tap "Take Photo" to get started'}
              </Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image
                    source={{ uri: photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo.uri }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoDate}>{formatDate(photo.timestamp)}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePhoto(photo.id)}
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
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#121212',
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
    backgroundColor: '#121212',
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
