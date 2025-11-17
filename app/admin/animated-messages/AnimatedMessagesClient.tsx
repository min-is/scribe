'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface AnimatedMessage {
  id: string;
  message: string;
  order: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AnimatedMessagesClientProps {
  initialMessages: AnimatedMessage[];
}

export default function AnimatedMessagesClient({ initialMessages }: AnimatedMessagesClientProps) {
  const [messages, setMessages] = useState<AnimatedMessage[]>(initialMessages);
  const [isAdding, setIsAdding] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = async () => {
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

      if (!response.ok) {
        throw new Error('Failed to create message');
      }

      const created = await response.json();
      setMessages([...messages, created]);
      setNewMessage('');
      setIsAdding(false);
      toast.success('Message added successfully');
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to add message');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/animated-messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update message');
      }

      const updated = await response.json();
      setMessages(messages.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/animated-messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle message');
      }

      const updated = await response.json();
      setMessages(messages.map((m) => (m.id === id ? updated : m)));
      toast.success(enabled ? 'Message enabled' : 'Message disabled');
    } catch (error) {
      console.error('Error toggling message:', error);
      toast.error('Failed to toggle message');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`/api/animated-messages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      setMessages(messages.filter((m) => m.id !== id));
      toast.success('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const startEdit = (message: AnimatedMessage) => {
    setEditingId(message.id);
    setEditText(message.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-main mb-2">How it works</h3>
        <p className="text-sm text-medium">
          These messages will appear on the home page with a typewriter animation effect.
          Only enabled messages will be shown, and they will cycle through in the order specified.
        </p>
      </div>

      {/* Messages List */}
      <div className="bg-main border border-main rounded-lg overflow-hidden">
        <div className="divide-y divide-main">
          {messages.length === 0 && !isAdding && (
            <div className="p-8 text-center text-dim">
              No messages yet. Click "Add Message" to create one.
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className="p-4 hover:bg-dim transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 cursor-grab text-dim">
                  <GripVertical size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === message.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-2 border border-main rounded-md bg-main text-main"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdate(message.id)}
                        className="p-2 hover:bg-dim rounded-md text-green-600"
                        title="Save"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 hover:bg-dim rounded-md text-red-600"
                        title="Cancel"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p
                        className="text-main cursor-pointer hover:text-primary"
                        onClick={() => startEdit(message)}
                      >
                        {message.message}
                      </p>
                      <p className="text-xs text-dim mt-1">
                        Order: {message.order} •{' '}
                        {message.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={message.enabled}
                      onChange={(e) =>
                        handleToggleEnabled(message.id, e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-medium">Enabled</span>
                  </label>

                  <button
                    onClick={() => handleDelete(message.id)}
                    className="p-2 hover:bg-dim rounded-md text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Message Form */}
          {isAdding && (
            <div className="p-4 bg-dim">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter new message..."
                    className="w-full px-3 py-2 border border-main rounded-md bg-main text-main"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd();
                      if (e.key === 'Escape') {
                        setIsAdding(false);
                        setNewMessage('');
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewMessage('');
                  }}
                  className="px-4 py-2 border border-main rounded-md hover:bg-dim"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <Plus size={20} />
          Add Message
        </button>
      )}

      {/* Default Messages Suggestion */}
      {messages.length === 0 && !isAdding && (
        <div className="bg-main border border-main rounded-lg p-4">
          <h3 className="font-semibold text-main mb-3">Suggested default messages:</h3>
          <ul className="space-y-2 text-sm text-medium">
            <li>• "The best place for your documentation needs"</li>
            <li>• "A magician pulls a rabbit out of a hat, an ER doctor pulls a rabbit out of a body cavity"</li>
            <li>• "Love your neighbors like Dr. Gromis loves his US machine"</li>
          </ul>
        </div>
      )}
    </div>
  );
}
