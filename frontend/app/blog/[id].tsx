import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { getBlogPost } from '../../src/services/api';

interface BlogPost {
  id: string;
  title_de: string;
  title_en: string;
  content_de: string;
  content_en: string;
  author: string;
  created_at: string;
  image_base64?: string;
}

export default function BlogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguage();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const data = await getBlogPost(id as string);
      setPost(data);
    } catch (error) {
      console.error('Failed to load blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#bbcf4e" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerLoading}>
          <Ionicons name="alert-circle-outline" size={64} color="#8b8b8b" />
          <Text style={styles.errorText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {language === 'de' ? post.title_de : post.title_en}
          </Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#8b8b8b" />
              <Text style={styles.metaText}>{post.author}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#8b8b8b" />
              <Text style={styles.metaText}>{formatDate(post.created_at)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.contentText}>
            {language === 'de' ? post.content_de : post.content_en}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111931',
  },
  scrollView: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#8b8b8b',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#162040',
    marginBottom: 20,
  },
  contentText: {
    color: '#d0d0d0',
    fontSize: 16,
    lineHeight: 26,
  },
  bottomSpacer: {
    height: 30,
  },
});
