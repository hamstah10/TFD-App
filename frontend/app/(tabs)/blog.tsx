import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';
import { getBlogPosts } from '../../src/services/api';

interface BlogPost {
  id: string;
  title_de: string;
  title_en: string;
  excerpt_de: string;
  excerpt_en: string;
  author: string;
  created_at: string;
  image_base64?: string;
}

export default function BlogScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await getBlogPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#bd1f22" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#bd1f22"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('latestNews')}</Text>
          <LanguageSwitch />
        </View>

        {/* Blog Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#8b8b8b" />
            <Text style={styles.emptyText}>{t('noBlogPosts')}</Text>
          </View>
        ) : (
          posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => router.push(`/blog/${post.id}`)}
            >
              <View style={styles.postContent}>
                <Text style={styles.postTitle}>
                  {language === 'de' ? post.title_de : post.title_en}
                </Text>
                <Text style={styles.postExcerpt} numberOfLines={3}>
                  {language === 'de' ? post.excerpt_de : post.excerpt_en}
                </Text>
                <View style={styles.postMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color="#8b8b8b" />
                    <Text style={styles.metaText}>{post.author}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#8b8b8b" />
                    <Text style={styles.metaText}>{formatDate(post.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.readMoreContainer}>
                  <Text style={styles.readMoreText}>{t('readMore')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#bd1f22" />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#8b8b8b',
    fontSize: 16,
    marginTop: 16,
  },
  postCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  postContent: {
    padding: 20,
  },
  postTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  postExcerpt: {
    color: '#a0a0a0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readMoreText: {
    color: '#bd1f22',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 30,
  },
});
