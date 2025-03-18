"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database, ContactMessage } from '@/types/supabase';
import { toast } from 'react-hot-toast';

export default function AdminContactMessagesPage() {
  const supabase = createClientComponentClient<Database>();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const userSession = await supabase.auth.getSession();
        console.log('User session:', userSession);
        const { data, error } = await supabase.from('contact_messages').select('*');
        console.log('Fetched data:', data);
        console.log('Fetch error:', error);
        if (error) throw error;
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [supabase]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', id);
      if (error) throw error;
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, status: 'read' } : msg)));
      toast.success('Message marked as read.');
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read.');
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      toast.success('Message deleted.');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message.');
    }
  };

  if (loading) return <p>Loading messages...</p>;

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">Admin Contact Messages</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Message</th>
            <th className="py-2">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={message.id} className="border-t">
              <td className="py-2">{message.name}</td>
              <td className="py-2">{message.email}</td>
              <td className="py-2">{message.message}</td>
              <td className="py-2">{message.status}</td>
              <td className="py-2">
                {message.status === 'unread' && (
                  <button
                    onClick={() => handleMarkAsRead(message.id)}
                    className="mr-2 text-blue-500 hover:underline"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}