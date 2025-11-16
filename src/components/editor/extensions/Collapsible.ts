import { Node, mergeAttributes } from '@tiptap/core';

export interface CollapsibleOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collapsible: {
      /**
       * Set a collapsible section
       */
      setCollapsible: (title?: string) => ReturnType;
      /**
       * Toggle a collapsible section
       */
      toggleCollapsible: (title?: string) => ReturnType;
    };
  }
}

export const Collapsible = Node.create<CollapsibleOptions>({
  name: 'collapsible',

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
      title: {
        default: 'Toggle',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => {
          return {
            'data-title': attributes.title,
          };
        },
      },
      open: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-open') === 'true',
        renderHTML: (attributes) => {
          return {
            'data-open': attributes.open,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details[data-collapsible]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const title = HTMLAttributes['data-title'] || 'Toggle';
    const open = HTMLAttributes['data-open'] === 'true';

    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-collapsible': '',
        class: 'collapsible border border-main rounded-lg p-4 my-4',
        open: open ? 'open' : undefined,
      }),
      [
        'summary',
        {
          class: 'font-semibold cursor-pointer select-none text-main hover:text-dim transition-colors list-none flex items-center gap-2',
          contenteditable: 'false',
        },
        [
          'span',
          {
            class: 'inline-block transform transition-transform',
          },
          '▶',
        ],
        title,
      ],
      [
        'div',
        {
          class: 'mt-3 pt-3 border-t border-main',
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setCollapsible:
        (title = 'Toggle') =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { title, open: false });
        },
      toggleCollapsible:
        (title = 'Toggle') =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { title, open: false });
        },
    };
  },
});
