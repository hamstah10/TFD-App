import React, { useEffect, useState } from 'react';
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getBlogPost, createBlogPost, updateBlogPost } from '../../src/services/api';

export default function BlogEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [titleDe, setTitleDe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentDe, setContentDe] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [excerptDe, setExcerptDe] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [author, setAuthor] = useState('Admin');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const post = await getBlogPost(id as string);
      setTitleDe(post.title_de);
      setTitleEn(post.title_en);
      setContentDe(post.content_de);
      setContentEn(post.content_en);
      setExcerptDe(post.excerpt_de);
      setExcerptEn(post.excerpt_en);
      setAuthor(post.author);
      setPublished(post.published);
    } catch (error) {
      console.error('Failed to load post:', error);
      Alert.alert(t('error'), 'Failed to load post');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!titleDe.trim() || !titleEn.trim() || !contentDe.trim() || !contentEn.trim()) {
      Alert.alert(t('error'), t('required'));
      return;
    }

    setLoading(true);
    try {
      const postData = {
        title_de: titleDe.trim(),
        title_en: titleEn.trim(),
        content_de: contentDe.trim(),
        content_en: contentEn.trim(),
        excerpt_de: excerptDe.trim() || contentDe.trim().substring(0, 150) + '...',
        excerpt_en: excerptEn.trim() || contentEn.trim().substring(0, 150) + '...',
        author: author.trim(),
        published,
      };

      if (isEditing) {
        await updateBlogPost(id as string, postData);
      } else {
        await createBlogPost(postData);
      }

      Alert.alert(t('success'), isEditing ? 'Post updated!' : 'Post created!');
      router.back();
    } catch (error) {
      console.error('Failed to save post:', error);
      Alert.alert(t('error'), 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#e94560" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* German Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('titleGerman')} *</Text>
              <TextInput
                style={styles.input}
                value={titleDe}
                onChangeText={setTitleDe}
                placeholder="Titel auf Deutsch"
                placeholderTextColor="#8b8b8b"
              />
            </View>

            {/* English Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('titleEnglish')} *</Text>
              <TextInput
                style={styles.input}
                value={titleEn}
                onChangeText={setTitleEn}
                placeholder="Title in English"
                placeholderTextColor="#8b8b8b"
              />
            </View>

            {/* German Excerpt */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('excerptGerman')}</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={excerptDe}
                onChangeText={setExcerptDe}
                placeholder="Kurzbeschreibung auf Deutsch"
                placeholderTextColor="#8b8b8b"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* English Excerpt */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('excerptEnglish')}</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={excerptEn}
                onChangeText={setExcerptEn}
                placeholder="Short description in English"
                placeholderTextColor="#8b8b8b"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* German Content */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('contentGerman')} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={contentDe}
                onChangeText={setContentDe}
                placeholder="Inhalt auf Deutsch"
                placeholderTextColor="#8b8b8b"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            {/* English Content */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('contentEnglish')} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={contentEn}
                onChangeText={setContentEn}
                placeholder="Content in English"
                placeholderTextColor="#8b8b8b"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            {/* Author */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Author</Text>
              <TextInput
                style={styles.input}
                value={author}
                onChangeText={setAuthor}
                placeholder="Author name"
                placeholderTextColor="#8b8b8b"
              />
            </View>

            {/* Published Toggle */}
            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Published</Text>
              <Switch
                value={published}
                onValueChange={setPublished}
                trackColor={{ false: '#1a1a2e', true: '#e94560' }}
                thumbColor={published ? '#ffffff' : '#8b8b8b'}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 20,
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
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  textAreaSmall: {
    minHeight: 80,
    paddingTop: 14,
  },
  textArea: {
    minHeight: 150,
    paddingTop: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8b8b8b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 30,
  },
});
