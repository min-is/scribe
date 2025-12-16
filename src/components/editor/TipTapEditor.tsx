'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Youtube } from '@tiptap/extension-youtube';
import { Callout } from './extensions/Callout';
import { Collapsible } from './extensions/Collapsible';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  ImageIcon,
  Table as TableIcon,
  Youtube as YoutubeIcon,
  Highlighter,
  Code2,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { clsx } from 'clsx/lite';
import { useCallback, useState, useEffect, useMemo, memo } from 'react';

interface TipTapEditorProps {
  content?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl('');
      setIsLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setIsImageDialogOpen(false);
    }
  }, [editor, imageUrl]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl && editor) {
      editor.commands.setYoutubeVideo({
        src: youtubeUrl,
        width: 640,
        height: 480,
      });
      setYoutubeUrl('');
      setIsYoutubeDialogOpen(false);
    }
  }, [editor, youtubeUrl]);

  if (!editor) {
    return null;
  }

  const textColors = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
  ];

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    title
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'relative p-2.5 rounded-lg transition-all duration-200 border-0 outline-none',
        'before:absolute before:inset-0 before:rounded-lg before:opacity-0 before:transition-opacity before:duration-200',
        active && [
          'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10',
          'text-blue-600 dark:text-blue-400',
          'before:bg-gradient-to-br before:from-blue-500/20 before:via-purple-500/20 before:to-pink-500/20 before:opacity-100'
        ],
        disabled && 'opacity-30 cursor-not-allowed',
        !active && !disabled && [
          'text-zinc-600 dark:text-zinc-400',
          'hover:bg-gradient-to-br hover:from-zinc-100 hover:via-zinc-50 hover:to-zinc-100',
          'dark:hover:bg-gradient-to-br dark:hover:from-zinc-800 dark:hover:via-zinc-700 dark:hover:to-zinc-800',
          'hover:text-zinc-900 dark:hover:text-zinc-100',
          'hover:before:opacity-100'
        ]
      )}
      type="button"
      style={{
        boxShadow: 'none',
        border: 'none'
      }}
    >
      {children}
    </button>
  );

  const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-1 px-1.5 py-1.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
      {children}
    </div>
  );

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10 backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90">
      <div className="flex flex-wrap gap-2.5 p-4">
        {/* Text Formatting */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold (Cmd+B)"
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic (Cmd+I)"
          >
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline (Cmd+U)"
          >
            <UnderlineIcon size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline Code"
          >
            <Code size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            active={isColorPickerOpen}
            title="Text Color"
          >
            <Palette size={18} />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Headings */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Lists */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code2 size={18} />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Callouts */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCallout('info').run()}
            active={editor.isActive('callout', { type: 'info' })}
            title="Info Callout"
          >
            <Info size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCallout('warning').run()}
            active={editor.isActive('callout', { type: 'warning' })}
            title="Warning Callout"
          >
            <AlertTriangle size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCallout('success').run()}
            active={editor.isActive('callout', { type: 'success' })}
            title="Success Callout"
          >
            <CheckCircle size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCallout('error').run()}
            active={editor.isActive('callout', { type: 'error' })}
            title="Error Callout"
          >
            <XCircle size={18} />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Insert */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => setIsLinkDialogOpen(true)}
            active={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setIsImageDialogOpen(true)}
            title="Insert Image"
          >
            <ImageIcon size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setIsYoutubeDialogOpen(true)}
            title="Embed YouTube Video"
          >
            <YoutubeIcon size={18} />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Undo/Redo */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Cmd+Z)"
          >
            <Undo size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo size={18} />
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      {/* Link Dialog */}
      {isLinkDialogOpen && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addLink();
                } else if (e.key === 'Escape') {
                  setIsLinkDialogOpen(false);
                }
              }}
            />
            <button
              onClick={addLink}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Add
            </button>
            <button
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setIsLinkDialogOpen(false);
              }}
              className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
            >
              Remove
            </button>
            <button
              onClick={() => setIsLinkDialogOpen(false)}
              className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {isImageDialogOpen && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL..."
              className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addImage();
                } else if (e.key === 'Escape') {
                  setIsImageDialogOpen(false);
                }
              }}
            />
            <button
              onClick={addImage}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Insert
            </button>
            <button
              onClick={() => setIsImageDialogOpen(false)}
              className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* YouTube Dialog */}
      {isYoutubeDialogOpen && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Enter YouTube URL..."
              className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addYoutube();
                } else if (e.key === 'Escape') {
                  setIsYoutubeDialogOpen(false);
                }
              }}
            />
            <button
              onClick={addYoutube}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Embed
            </button>
            <button
              onClick={() => setIsYoutubeDialogOpen(false)}
              className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Color Picker */}
      {isColorPickerOpen && (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
          <div className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">Text Color</div>
          <div className="grid grid-cols-10 gap-2">
            {textColors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  editor.chain().focus().setColor(color.value).run();
                }}
                className="w-9 h-9 rounded-lg border-2 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all hover:scale-110 shadow-sm"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setIsColorPickerOpen(false);
              }}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
            >
              Remove Color
            </button>
            <button
              onClick={() => setIsColorPickerOpen(false)}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-700 dark:text-zinc-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TipTapEditor = memo(function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  className,
}: TipTapEditorProps) {
  // Memoize the onChange callback to keep it stable across renders
  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
    [onChange]
  );

  // Memoize extensions array to prevent recreation on every render
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-500 underline hover:text-blue-600 cursor-pointer',
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg my-4',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full my-4',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 dark:border-gray-700',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 dark:border-gray-700 px-3 py-2',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-100 dark:bg-gray-800 font-bold',
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
    Youtube.configure({
      HTMLAttributes: {
        class: 'w-full aspect-video my-4 rounded-lg',
      },
    }),
    Callout,
    Collapsible,
  ], [placeholder]);

  // Memoize editor props to prevent recreation
  const editorProps = useMemo(() => ({
    attributes: {
      class: clsx(
        'max-w-none',
        'focus:outline-none',
        editable ? 'min-h-[300px]' : 'min-h-0',
        'p-4',
        'text-main leading-relaxed',
        '[&_p]:mb-3 [&_p]:text-main [&_p]:leading-relaxed',
        '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-main',
        '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-main',
        '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-main',
        '[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3 [&_ul]:text-main',
        '[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3 [&_ol]:text-main',
        '[&_li]:mb-1 [&_li]:text-main',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:dark:border-gray-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-medium [&_blockquote]:my-4',
        '[&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-main [&_code]:font-mono',
        '[&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:text-main',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_a]:text-blue-500 [&_a]:underline [&_a]:hover:text-blue-600 [&_a]:cursor-pointer',
        '[&_strong]:font-bold [&_strong]:text-main',
        '[&_em]:italic [&_em]:text-main',
        '[&_table]:border-collapse [&_table]:w-full [&_table]:my-4',
        '[&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-700 [&_td]:px-3 [&_td]:py-2 [&_td]:text-main',
        '[&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-700 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:dark:bg-gray-800 [&_th]:font-bold [&_th]:text-main',
      ),
    },
  }), [editable]);

  const editor = useEditor({
    extensions,
    editable,
    onUpdate: handleUpdate,
    editorProps,
  });

  // Handle content updates properly via useEffect
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getJSON();
      // Only update if content is different to avoid unnecessary re-renders
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  return (
    <div className={clsx('border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm', className)}>
      {editable && editor && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
});

export default TipTapEditor;
