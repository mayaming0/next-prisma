'use client';

import { useState, KeyboardEvent } from 'react';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import MarkdownRenderer from '@/components/articles/MarkdownRenderer';

interface MarkdownEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  onSubmit?: (title: string, content: string, tags: string[]) => void;
}

const toolbarHints = ['**粗体**', '*斜体*', '# 标题', '`代码`', '> 引用', '[链接](url)', '![图片](url)'];

export default function MarkdownEditor({
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  mode = 'create',
  onCancel,
  onSubmit,
}: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = () => {
    onSubmit?.(title, content, tags);
  };

  return (
    <div className="editor-layout">
      <div className="editor-panel">
        <div className="editor-panel-header">
          <h3>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            编辑器
          </h3>
          {mode === 'create' && (
            <Button variant="outline" size="sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: '14px', height: '14px' }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              上传 .md 文件
            </Button>
          )}
        </div>

        <input
          className="editor-title-input"
          type="text"
          placeholder="文章标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="editor-toolbar">
          {toolbarHints.map((hint) => (
            <span key={hint} className="toolbar-hint">
              {hint}
            </span>
          ))}
        </div>

        <textarea
          className="editor-textarea"
          placeholder="在这里撰写 Markdown 内容...&#10;&#10;支持标准 Markdown 语法，实时预览在右侧面板中显示。"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="editor-footer">
          <div className="tag-input-container">
            {tags.map((tag) => (
              <Tag key={tag} onRemove={() => handleRemoveTag(tag)}>
                {tag}
              </Tag>
            ))}
            <input
              className="tag-input-field"
              type="text"
              placeholder="添加标签..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>
          <div className="flex gap-2">
            {mode === 'edit' ? (
              <>
                <Button variant="outline" onClick={onCancel}>
                  取消
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: '14px', height: '14px' }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  更新文章
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary">保存草稿</Button>
                <Button variant="primary" onClick={handleSubmit}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: '14px', height: '14px' }}
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  发布文章
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="editor-panel">
        <div className="editor-panel-header">
          <h3>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            预览
          </h3>
        </div>
        <div className="preview-panel">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <div className="preview-placeholder">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: '32px',
                  height: '32px',
                  opacity: 0.3,
                  marginBottom: '12px',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              在编辑器中输入内容，预览将实时显示
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
