'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

type AnimatedMessage = {
  id: string;
  message: string;
  order: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type HomePageContent = {
  id: string;
  announcementText: string;
  gettingStartedText: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function AnimatedMessagesClient({
  initialMessages,
}: {
  initialMessages: AnimatedMessage[];
}) {
  const [messages, setMessages] = useState<AnimatedMessage[]>(initialMessages);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [editMessage, setEditMessage] = useState('');

  // Home page content state
  const [announcementText, setAnnouncementText] = useState('');
  const [gettingStartedText, setGettingStartedText] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [isSavingGettingStarted, setIsSavingGettingStarted] = useState(false);

  const handleCreate = async () => {
    if (!newMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/animated-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          order: messages.length,
          enabled: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to create message');

      const created = await response.json();
      setMessages([...messages, created]);
      setNewMessage('');
      setIsCreating(false);
      toast.success('Message created successfully');
    } catch (error) {
      toast.error('Failed to create message');
      console.error(error);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editMessage.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/animated-messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editMessage }),
      });

      if (!response.ok) throw new Error('Failed to update message');

      const updated = await response.json();
      setMessages(messages.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
      setEditMessage('');
      toast.success('Message updated successfully');
    } catch (error) {
      toast.error('Failed to update message');
      console.error(error);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/animated-messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (!response.ok) throw new Error('Failed to toggle message');

      const updated = await response.json();
      setMessages(messages.map((m) => (m.id === id ? updated : m)));
      toast.success(`Message ${!enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle message');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/animated-messages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete message');

      setMessages(messages.filter((m) => m.id !== id));
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
      console.error(error);
    }
  };

  // Fetch home page content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/home-page-content');
        if (!response.ok) throw new Error('Failed to fetch content');
        const data: HomePageContent = await response.json();
        setAnnouncementText(data.announcementText);
        setGettingStartedText(data.gettingStartedText);
      } catch (error) {
        toast.error('Failed to load home page content');
        console.error(error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchContent();
  }, []);

  const handleSaveAnnouncement = async () => {
    if (!announcementText.trim()) {
      toast.error('Announcement text cannot be empty');
      return;
    }

    setIsSavingAnnouncement(true);
    try {
      const response = await fetch('/api/home-page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementText }),
      });

      if (!response.ok) throw new Error('Failed to update announcement');

      toast.success('Announcement updated successfully');
    } catch (error) {
      toast.error('Failed to update announcement');
      console.error(error);
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleSaveGettingStarted = async () => {
    if (!gettingStartedText.trim()) {
      toast.error('Getting started text cannot be empty');
      return;
    }

    setIsSavingGettingStarted(true);
    try {
      const response = await fetch('/api/home-page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gettingStartedText }),
      });

      if (!response.ok) throw new Error('Failed to update getting started content');

      toast.success('Getting started content updated successfully');
    } catch (error) {
      toast.error('Failed to update getting started content');
      console.error(error);
    } finally {
      setIsSavingGettingStarted(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Home Page Content</h1>
        <p className="text-zinc-400 text-base">
          Manage the typewriter messages, announcements, and getting started content displayed on the home page
        </p>
      </div>

      {/* Announcements Section */}
      <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-3">Announcements Banner</h2>
        <p className="text-sm text-zinc-400 mb-4">
          This content appears in the announcements banner on the home page. Edit the text below to update it.
        </p>
        <textarea
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
          placeholder="Welcome! Check back here for important updates and announcements."
          className="w-full p-4 border border-zinc-800 rounded-lg text-zinc-100 bg-zinc-950 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          disabled={isLoadingContent}
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-zinc-500">
            Changes will be reflected immediately on the home page
          </p>
          <button
            onClick={handleSaveAnnouncement}
            disabled={isSavingAnnouncement || isLoadingContent}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSavingAnnouncement ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-3">Getting Started Content</h2>
        <p className="text-sm text-zinc-400 mb-4">
          This content appears in the "Getting Started" box on the home page. You can use line breaks and bullet points.
        </p>
        <textarea
          value={gettingStartedText}
          onChange={(e) => setGettingStartedText(e.target.value)}
          placeholder="Welcome to your home! Browse provider preferences, access procedure guides..."
          className="w-full p-4 border border-zinc-800 rounded-lg text-zinc-100 bg-zinc-950 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          rows={8}
          disabled={isLoadingContent}
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-zinc-500">
            Use • for bullet points. Changes will be reflected immediately on the home page.
          </p>
          <button
            onClick={handleSaveGettingStarted}
            disabled={isSavingGettingStarted || isLoadingContent}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSavingGettingStarted ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-2">Typewriter Messages</h2>
        <p className="text-zinc-400 text-sm">
          Manage the rotating typewriter messages displayed on the home page
        </p>
      </div>

      {/* Create New Message */}
      <div className="bg-main border border-main rounded-lg p-4 mb-6">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Plus size={20} />
            <span>Add New Message</span>
          </button>
        ) : (
          <div className="space-y-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full p-3 border border-main rounded-md text-main bg-main resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Check size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewMessage('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-main rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`bg-main border border-main rounded-lg p-4 ${
              !message.enabled ? 'opacity-50' : ''
            }`}
          >
            {editingId === message.id ? (
              <div className="space-y-3">
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full p-3 border border-main rounded-md text-main bg-main resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(message.id)}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Check size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditMessage('');
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-main rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-main">{message.message}</p>
                  <p className="text-xs text-dim mt-1">
                    Order: {message.order} | {message.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(message.id);
                      setEditMessage(message.message);
                    }}
                    className="p-2 text-dim hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleToggle(message.id, message.enabled)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      message.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    title={message.enabled ? 'Disable' : 'Enable'}
                  >
                    {message.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDelete(message.id)}
                    className="p-2 text-dim hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-12 text-dim">
          <p>No messages yet. Create your first animated message above!</p>
        </div>
      )}
    </div>
  );
}
