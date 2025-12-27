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
        class: `callout callout-${type}`,
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
