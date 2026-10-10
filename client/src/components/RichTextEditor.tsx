import { useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  RemoveFormatting,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_BUTTONS = [
  { command: 'bold', icon: Bold, label: '加粗' },
  { command: 'italic', icon: Italic, label: '斜体' },
  { command: 'underline', icon: Underline, label: '下划线' },
  { command: 'formatBlock', value: 'h2', icon: Heading2, label: '标题2' },
  { command: 'formatBlock', value: 'h3', icon: Heading3, label: '标题3' },
  { command: 'insertUnorderedList', icon: List, label: '无序列表' },
  { command: 'insertOrderedList', icon: ListOrdered, label: '有序列表' },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '在此输入内容...',
  minHeight = 300,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // 初始化内容
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      editorRef.current.innerHTML = value || '';
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = window.prompt('输入链接地址:', 'https://');
    if (url) {
      exec('createLink', url);
    }
  }, [exec]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // 粘贴为纯文本，避免带入外部样式
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div className="rounded-md border border-input bg-background">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
        {TOOLBAR_BUTTONS.map((btn) => (
          <Button
            key={btn.label}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => exec(btn.command, btn.value)}
            title={btn.label}
          >
            <btn.icon className="size-4" />
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleLink}
          title="插入链接"
        >
          <Link className="size-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => exec('removeFormat')}
          title="清除格式"
        >
          <RemoveFormatting className="size-4" />
        </Button>
      </div>

      {/* 编辑区 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="rich-text-editor px-4 py-3 text-base leading-relaxed focus:outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
