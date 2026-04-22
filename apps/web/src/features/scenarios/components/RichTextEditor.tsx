// ============================================================================
// File: apps/web/src/features/scenarios/components/RichTextEditor.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Shared TipTap editor for scenario patient presentation and objectives.
// Env / Identity: Web (browser runtime)
// ============================================================================

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading1, Heading2, Italic, List, ListOrdered } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@imedica/ui';

import { cn } from '@/lib/cn.js';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string | undefined;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
  error,
}: RichTextEditorProps): JSX.Element {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[180px] rounded-b-xl border border-border bg-surface px-4 py-3 text-text focus:outline-none dark:prose-invert',
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div className="space-y-2">
      {label ? <label className="block text-sm font-medium text-text">{label}</label> : null}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-border bg-surface-muted/80 p-2">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor?.isActive('heading', { level: 1 }) ?? false}
            ariaLabel="Heading level 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive('heading', { level: 2 }) ?? false}
            ariaLabel="Heading level 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold') ?? false}
            ariaLabel="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic') ?? false}
            ariaLabel="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList') ?? false}
            ariaLabel="Bullet list"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList') ?? false}
            ariaLabel="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <EditorContent
          editor={editor}
          aria-label={label ?? placeholder ?? 'Rich text editor'}
          className={cn(
            '[&_.tiptap]:min-h-[180px]',
            '[&_.tiptap]:rounded-b-xl',
            '[&_p.is-editor-empty:first-child::before]:pointer-events-none',
            '[&_p.is-editor-empty:first-child::before]:h-0',
            '[&_p.is-editor-empty:first-child::before]:float-left',
            '[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          )}
        />
      </div>

      {placeholder ? <p className="text-xs text-text-subtle">{placeholder}</p> : null}
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn('h-9 w-9 px-0', active && 'ring-1 ring-primary-400')}
    >
      {children}
    </Button>
  );
}
