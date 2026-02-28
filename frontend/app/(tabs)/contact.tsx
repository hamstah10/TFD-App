import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { OpeningHoursCard } from '../../src/components/OpeningHoursCard';
import { submitContactMessage, getCompanyInfo } from '../../src/services/api';

export default function ContactScreen() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const data = await getCompanyInfo();
      setCompanyInfo(data);
    } catch (error) {
      console.error('Failed to load company info:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert(t('error'), t('required'));
      return;
    }

    setLoading(true);
    try {
      await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      Alert.alert(t('success'), t('messageSent'));
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('error'), t('messageFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Text style={styles.pageTitle}>{t('contactUs')}</Text>

          {/* Contact Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('yourName')} *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('yourName')}
                placeholderTextColor="#8b8b8b"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('yourEmail')} *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('yourEmail')}
                placeholderTextColor="#8b8b8b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('yourPhone')}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('yourPhone')}
                placeholderTextColor="#8b8b8b"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('subject')} *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder={t('subject')}
                placeholderTextColor="#8b8b8b"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('message')} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder={t('message')}
                placeholderTextColor="#8b8b8b"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>{t('send')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Company Info */}
          {companyInfo && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#bd1f22" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{t('address')}</Text>
                  <Text style={styles.infoText}>{companyInfo.address.street}</Text>
                  <Text style={styles.infoText}>
                    {companyInfo.address.zip} {companyInfo.address.city}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#bd1f22" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Telefon</Text>
                  <Text style={styles.infoText}>{companyInfo.phone}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color="#bd1f22" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>E-Mail</Text>
                  <Text style={styles.infoText}>{companyInfo.email}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Opening Hours */}
          <OpeningHoursCard />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 16,
  },
  formContainer: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: '#bd1f22',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    color: '#8b8b8b',
    fontSize: 12,
    marginBottom: 4,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 30,
  },
});
