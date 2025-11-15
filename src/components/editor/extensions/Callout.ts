import { Node, mergeAttributes } from '@tiptap/core';

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Set a callout node
       */
      setCallout: (type?: 'info' | 'warning' | 'success' | 'error') => ReturnType;
      /**
       * Toggle a callout node
       */
      toggleCallout: (type?: 'info' | 'warning' | 'success' | 'error') => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-type'),
        renderHTML: (attributes) => {
          return {
            'data-type': attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes['data-type'] || 'info';

    const typeStyles = {
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
      success: 'bg-green-50 dark:bg-green-900/20 border-green-500',
      error: 'bg-red-50 dark:bg-red-900/20 border-red-500',
    };

    const typeIcons = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-callout': '',
        class: `callout callout-${type} ${typeStyles[type as keyof typeof typeStyles]} border-l-4 p-4 my-4 rounded-r-lg`,
      }),
      [
        'div',
        {
          class: 'flex items-start gap-3',
        },
        [
          'span',
          {
            class: 'text-xl select-none',
            contenteditable: 'false',
          },
          typeIcons[type as keyof typeof typeIcons],
        ],
        [
          'div',
          {
            class: 'flex-1',
          },
          0,
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (type = 'info') =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type });
        },
      toggleCallout:
        (type = 'info') =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { type });
        },
    };
  },
});
