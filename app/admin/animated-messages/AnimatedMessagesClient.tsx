'use client';

import { useState } from 'react';
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main mb-2">Animated Messages</h1>
        <p className="text-medium">
          Manage the typewriter messages displayed on the home page
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
