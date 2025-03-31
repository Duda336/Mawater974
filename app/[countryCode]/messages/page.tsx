'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  replies: any[];
  isNotification?: boolean;
  isContactMessage?: boolean;
}

export default function MessagesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const countryCode = params.countryCode as string;

  useEffect(() => {
    if (!user) {
      router.push(`/${countryCode}/login`);
      return;
    }
    fetchNotifications();
  }, [user, countryCode]);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch both notifications and contact messages
      const [notificationsResponse, contactMessagesResponse] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('contact_messages')
          .select(`
            *,
            replies:contact_messages!parent_message_id(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (notificationsResponse.error) throw notificationsResponse.error;
      if (contactMessagesResponse.error) throw contactMessagesResponse.error;

      // Filter out replies from contact messages
      const mainMessages = contactMessagesResponse.data?.filter(msg => !msg.parent_message_id) || [];

      // Combine and sort notifications and contact messages
      const allNotifications = [
        ...(notificationsResponse.data || []).map(n => ({
          ...n,
          isNotification: true
        })),
        ...(mainMessages || []).map(m => ({
          ...m,
          isContactMessage: true
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error(t('messages.error.load'));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      toast.success(t('messages.success.markedRead'));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error(t('messages.error.markRead'));
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      toast.success(t('messages.success.allMarkedRead'));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error(t('messages.error.markAllRead'));
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
      toast.success(t('messages.success.deleted'));
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error(t('messages.error.delete'));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return '🎉';
      case 'rejection':
        return '⚠️';
      case 'sold':
        return '🎊';
      default:
        return '📫';
    }
  };

  // Helper function to format message content
  const formatMessageContent = (message: string) => {
    return (
      <>
        {message
          .split('\n')
          .map((line, index) => (
            <p key={index} className="mb-1 whitespace-pre-wrap">
              {line}
            </p>
          ))}
      </>
    );
  };

  // Helper function to render replies
  const renderReplies = (replies: any[]) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className="ml-6 mt-4 space-y-4">
        {replies.map((reply) => (
          <div key={reply.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-qatar-maroon">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{reply.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{reply.email}</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(reply.created_at), 'PPp')}
              </span>
            </div>
            <div className="prose max-w-none text-sm text-gray-700 dark:text-gray-300">
              {formatMessageContent(reply.message)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to get a preview of the message
  const getMessagePreview = (message: string) => {
    const words = message.split(' ');
    if (words.length <= 15) return message;
    return words.slice(0, 15).join(' ') + '...';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('messages.signInRequired')}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('messages.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t(`messages.total${notifications.length === 1 ? '' : '_plural'}`, { count: notifications.length })}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as 'all' | 'unread' | 'read');
                    fetchNotifications();
                  }}
                  className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
                >
                  <option value="all">{t('messages.filter.all')}</option>
                  <option value="unread">{t('messages.filter.unread')}</option>
                  <option value="read">{t('messages.filter.read')}</option>
                </select>
                {notifications.some(n => !n.is_read) && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-qatar-maroon text-white text-sm rounded-md hover:bg-qatar-maroon/90 transition-colors"
                  >
                    {t('messages.markAllRead')}
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qatar-maroon"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {filter !== 'all' 
                    ? t('messages.noMessagesFiltered', { filter: t(`messages.filter.${filter}`) })
                    : t('messages.noMessages')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                      notification.is_read
                        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        : 'bg-qatar-maroon/5 border-qatar-maroon'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div>
                          {notification.isNotification ? (
                            <>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-start">
                                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                  {expandedMessage === notification.id 
                                    ? notification.message 
                                    : getMessagePreview(notification.message)
                                  }
                                </p>
                                <button
                                  onClick={() => setExpandedMessage(
                                    expandedMessage === notification.id ? null : notification.id
                                  )}
                                  className="ml-4 text-sm text-qatar-maroon hover:text-qatar-maroon-dark"
                                >
                                  {expandedMessage === notification.id
                                    ? t('contact.messages.actions.colapse')
                                    : t('contact.messages.actions.expand')
                                  }
                                </button>
                              </div>
                              {expandedMessage === notification.id && notification.replies && notification.replies.length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                                    {t('contact.messages.replies')}
                                  </h4>
                                  {renderReplies(notification.replies)}
                                </div>
                              )}
                            </>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {format(new Date(notification.created_at), 'PPp')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 items-end ml-4">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-qatar-maroon hover:text-qatar-maroon/80 whitespace-nowrap"
                          >
                            {t('messages.markAsRead')}
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {t('messages.delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
