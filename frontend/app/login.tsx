import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { LanguageSwitch } from '../src/components/LanguageSwitch';
import Logo from '../src/components/Logo';

export default function LoginScreen() {
  const { login } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Bitte E-Mail und Passwort eingeben.' 
          : 'Please enter email and password.'
      );
      return;
    }

    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/customer/dashboard');
      } else {
        Alert.alert(
          language === 'de' ? 'Fehler' : 'Error',
          language === 'de' 
            ? 'Ungültige Anmeldedaten.' 
            : 'Invalid credentials.'
        );
      }
    } catch (error) {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de' 
          ? 'Ein Fehler ist aufgetreten.' 
          : 'An error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Logo width={140} height={42} />
        <LanguageSwitch />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Login Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="person-circle" size={80} color="#bd1f22" />
          </View>

          <Text style={styles.title}>
            {language === 'de' ? 'Kundenportal' : 'Customer Portal'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'de' 
              ? 'Melden Sie sich an, um auf Ihr Dashboard zuzugreifen' 
              : 'Sign in to access your dashboard'}
          </Text>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#8b8b8b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={language === 'de' ? 'E-Mail Adresse' : 'Email Address'}
                placeholderTextColor="#8b8b8b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#8b8b8b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={language === 'de' ? 'Passwort' : 'Password'}
                placeholderTextColor="#8b8b8b"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#8b8b8b" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>
                {language === 'de' ? 'Passwort vergessen?' : 'Forgot password?'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    {language === 'de' ? 'Anmelden' : 'Sign In'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo Info */}
          <View style={styles.demoInfo}>
            <Ionicons name="information-circle" size={18} color="#2196f3" />
            <Text style={styles.demoText}>
              {language === 'de' 
                ? 'Demo: Beliebige E-Mail + "demo" als Passwort' 
                : 'Demo: Any email + "demo" as password'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8b8b8b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#bd1f22',
    fontSize: 14,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#bd1f22',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  demoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  demoText: {
    color: '#2196f3',
    fontSize: 12,
  },
});
