import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { LanguageSwitch } from '../../src/components/LanguageSwitch';
import {
  getBlogPosts,
  deleteBlogPost,
  getContactMessages,
  markMessageRead,
  deleteContactMessage,
} from '../../src/services/api';

type AdminTab = 'blog' | 'messages';

interface BlogPost {
  id: string;
  title_de: string;
  title_en: string;
  published: boolean;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function AdminScreen() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('blog');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'blog') {
        const data = await getBlogPosts(false);
        setPosts(data);
      } else {
        const data = await getContactMessages();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      t('confirmDelete'),
      '',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBlogPost(postId);
              loadData();
            } catch (error) {
              console.error('Failed to delete post:', error);
            }
          },
        },
      ]
    );
  };

  const handleMarkRead = async (messageId: string) => {
    try {
      await markMessageRead(messageId);
      loadData();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      t('confirmDelete'),
      '',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContactMessage(messageId);
              loadData();
            } catch (error) {
              console.error('Failed to delete message:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e94560"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('adminPanel')}</Text>
          <LanguageSwitch />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'blog' && styles.activeTab]}
            onPress={() => setActiveTab('blog')}
          >
            <Ionicons
              name="newspaper"
              size={20}
              color={activeTab === 'blog' ? '#ffffff' : '#8b8b8b'}
            />
            <Text
              style={[styles.tabText, activeTab === 'blog' && styles.activeTabText]}
            >
              {t('manageBlog')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
            onPress={() => setActiveTab('messages')}
          >
            <View style={styles.tabIconContainer}>
              <Ionicons
                name="mail"
                size={20}
                color={activeTab === 'messages' ? '#ffffff' : '#8b8b8b'}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabText,
                activeTab === 'messages' && styles.activeTabText,
              ]}
            >
              {t('manageMessages')}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color="#e94560" size="large" />
          </View>
        ) : activeTab === 'blog' ? (
          <View style={styles.contentContainer}>
            {/* Create Post Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/admin/blog-editor')}
            >
              <Ionicons name="add-circle" size={24} color="#ffffff" />
              <Text style={styles.createButtonText}>{t('createPost')}</Text>
            </TouchableOpacity>

            {/* Posts List */}
            {posts.map((post) => (
              <View key={post.id} style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>
                    {language === 'de' ? post.title_de : post.title_en}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemDate}>{formatDate(post.created_at)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        post.published ? styles.publishedBadge : styles.draftBadge,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {post.published ? 'Published' : 'Draft'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      router.push({
                        pathname: '/admin/blog-editor',
                        params: { id: post.id },
                      })
                    }
                  >
                    <Ionicons name="pencil" size={20} color="#e94560" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeletePost(post.id)}
                  >
                    <Ionicons name="trash" size={20} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {posts.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={48} color="#8b8b8b" />
                <Text style={styles.emptyText}>{t('noBlogPosts')}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {/* Messages List */}
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.messageCard, !msg.read && styles.unreadCard]}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.messageName}>{msg.name}</Text>
                  {!msg.read && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{t('unread')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.messageEmail}>{msg.email}</Text>
                <Text style={styles.messageSubject}>{msg.subject}</Text>
                <Text style={styles.messageText} numberOfLines={3}>
                  {msg.message}
                </Text>
                <Text style={styles.messageDate}>{formatDate(msg.created_at)}</Text>
                <View style={styles.messageActions}>
                  {!msg.read && (
                    <TouchableOpacity
                      style={styles.readButton}
                      onPress={() => handleMarkRead(msg.id)}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                      <Text style={styles.readButtonText}>{t('markAsRead')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMessage(msg.id)}
                  >
                    <Ionicons name="trash" size={18} color="#ffffff" />
                    <Text style={styles.deleteButtonText}>{t('delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {messages.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-outline" size={48} color="#8b8b8b" />
                <Text style={styles.emptyText}>No messages</Text>
              </View>
            )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#e94560',
  },
  tabIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabText: {
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  centerLoading: {
    padding: 40,
    alignItems: 'center',
  },
  contentContainer: {
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemDate: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  publishedBadge: {
    backgroundColor: '#00c853',
  },
  draftBadge: {
    backgroundColor: '#ff9800',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e94560',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  messageEmail: {
    color: '#8b8b8b',
    fontSize: 12,
    marginBottom: 8,
  },
  messageSubject: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  messageText: {
    color: '#a0a0a0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  messageDate: {
    color: '#8b8b8b',
    fontSize: 12,
    marginBottom: 12,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00c853',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  readButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8b8b8b',
    fontSize: 16,
    marginTop: 12,
  },
  bottomSpacer: {
    height: 30,
  },
});
