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
} from 'lucide-react';
import { clsx } from 'clsx/lite';
import { useCallback, useState } from 'react';

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

  if (!editor) {
    return null;
  }

  const addLink = useCallback(() => {
    if (linkUrl) {
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
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setIsImageDialogOpen(false);
    }
  }, [editor, imageUrl]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl) {
      editor.commands.setYoutubeVideo({
        src: youtubeUrl,
        width: 640,
        height: 480,
      });
      setYoutubeUrl('');
      setIsYoutubeDialogOpen(false);
    }
  }, [editor, youtubeUrl]);

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
        'p-2 rounded-md transition-all',
        active && 'bg-primary text-white shadow-soft',
        disabled && 'opacity-40 cursor-not-allowed',
        !active && !disabled && 'text-dim hover:bg-dim hover:text-main'
      )}
      type="button"
    >
      {children}
    </button>
  );

  const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-0.5 px-2 py-1 bg-extra-dim rounded-lg">
      {children}
    </div>
  );

  return (
    <div className="border-b border-main bg-main sticky top-0 z-10 shadow-soft">
      <div className="flex flex-wrap gap-2 p-3">
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
        <div className="p-3 border-t border-main bg-dim">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-3 py-2 border border-main rounded-md bg-main text-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-md hover:opacity-90 transition-opacity text-sm"
            >
              Add
            </button>
            <button
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setIsLinkDialogOpen(false);
              }}
              className="px-4 py-2 border border-main rounded-md hover:bg-dim transition-colors text-sm"
            >
              Remove
            </button>
            <button
              onClick={() => setIsLinkDialogOpen(false)}
              className="px-4 py-2 border border-main rounded-md hover:bg-dim transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {isImageDialogOpen && (
        <div className="p-3 border-t border-main bg-dim">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL..."
              className="flex-1 px-3 py-2 border border-main rounded-md bg-main text-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-md hover:opacity-90 transition-opacity text-sm"
            >
              Insert
            </button>
            <button
              onClick={() => setIsImageDialogOpen(false)}
              className="px-4 py-2 border border-main rounded-md hover:bg-dim transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* YouTube Dialog */}
      {isYoutubeDialogOpen && (
        <div className="p-3 border-t border-main bg-dim">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Enter YouTube URL..."
              className="flex-1 px-3 py-2 border border-main rounded-md bg-main text-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-md hover:opacity-90 transition-opacity text-sm"
            >
              Embed
            </button>
            <button
              onClick={() => setIsYoutubeDialogOpen(false)}
              className="px-4 py-2 border border-main rounded-md hover:bg-dim transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
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
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
    editorProps: {
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
    },
  });

  return (
    <div className={clsx('border border-main rounded-lg overflow-hidden bg-main', className)}>
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
