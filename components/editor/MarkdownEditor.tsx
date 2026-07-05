"use client";

import { useState, KeyboardEvent, useRef } from "react";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import MarkdownRenderer from "@/components/articles/MarkdownRenderer";

interface MarkdownEditorProps {
	initialTitle?: string;
	initialContent?: string;
	initialTags?: string[];
	mode?: "create" | "edit";
	onCancel?: () => void;
	onSubmit?: (title: string, content: string, tags: string[]) => void;
}

const toolbarItems = [
	{
		label: "B",
		hint: "粗体",
		prefix: "**",
		suffix: "**",
		placeholder: "粗体文本",
	},
	{
		label: "I",
		hint: "斜体",
		prefix: "*",
		suffix: "*",
		placeholder: "斜体文本",
	},
	{
		label: "H",
		hint: "标题",
		prefix: "## ",
		suffix: "",
		placeholder: "标题文本",
	},
	{
		label: "<>",
		hint: "代码",
		prefix: "`",
		suffix: "`",
		placeholder: "代码",
	},
	{
		label: "❝",
		hint: "引用",
		prefix: "> ",
		suffix: "",
		placeholder: "引用文本",
	},
	{
		label: "🔗",
		hint: "链接",
		prefix: "[",
		suffix: "](url)",
		placeholder: "链接文本",
	},
	{
		label: "🖼",
		hint: "图片",
		prefix: "![",
		suffix: "](url)",
		placeholder: "图片描述",
	},
	{
		label: "—",
		hint: "分隔线",
		prefix: "\n---\n",
		suffix: "",
		placeholder: "",
	},
];

export default function MarkdownEditor({
	initialTitle = "",
	initialContent = "",
	initialTags = [],
	mode = "create",
	onCancel,
	onSubmit,
}: MarkdownEditorProps) {
	const [title, setTitle] = useState(initialTitle);
	const [content, setContent] = useState(initialContent);
	const [tags, setTags] = useState<string[]>(initialTags);
	const [tagInput, setTagInput] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			if (!tags.includes(tagInput.trim())) {
				setTags([...tags, tagInput.trim()]);
			}
			setTagInput("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((t) => t !== tagToRemove));
	};

	const handleSubmit = () => {
		onSubmit?.(title, content, tags);
	};

	// 点击上传 .md 文件按钮 → 触发隐藏的 file input
	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	// 读取 .md 文件内容
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith(".md")) {
			alert("请上传 .md 格式的文件");
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			// 如果标题为空，尝试从文件第一行提取标题（# 开头的行）
			if (!title) {
				const lines = text.split("\n");
				const firstHeading = lines.find((l) => l.startsWith("# "));
				if (firstHeading) {
					setTitle(firstHeading.replace(/^# /, "").trim());
					// 去掉标题行后的内容作为正文
					const bodyLines = lines.slice(
						lines.indexOf(firstHeading) + 1,
					);
					setContent(bodyLines.join("\n").trim());
					return;
				}
			}
			setContent(text);
		};
		reader.readAsText(file);
		// 清空 input 以便重复上传同一文件
		e.target.value = "";
	};

	// 工具栏按钮 → 在光标位置插入 Markdown 语法
	const handleToolbarClick = (item: (typeof toolbarItems)[number]) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = content.slice(start, end);
		const insertText = selectedText || item.placeholder;

		const newContent =
			content.slice(0, start) +
			item.prefix +
			insertText +
			item.suffix +
			content.slice(end);

		setContent(newContent);

		// 恢复光标位置，选中插入的文本
		requestAnimationFrame(() => {
			textarea.focus();
			const selectStart = start + item.prefix.length;
			const selectEnd = selectStart + insertText.length;
			textarea.setSelectionRange(selectStart, selectEnd);
		});
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
					{mode === "create" && (
						<>
							<input
								ref={fileInputRef}
								type="file"
								accept=".md"
								style={{ display: "none" }}
								onChange={handleFileChange}
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={handleUploadClick}
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									style={{ width: "14px", height: "14px" }}
								>
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
									<polyline points="17 8 12 3 7 8" />
									<line x1="12" y1="3" x2="12" y2="15" />
								</svg>
								上传 .md 文件
							</Button>
						</>
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
					{toolbarItems.map((item) => (
						<button
							key={item.label}
							className="toolbar-btn"
							title={item.hint}
							type="button"
							onClick={() => handleToolbarClick(item)}
						>
							{item.label}
						</button>
					))}
				</div>

				<textarea
					ref={textareaRef}
					className="editor-textarea"
					placeholder="在这里撰写 Markdown 内容...&#10;&#10;支持标准 Markdown 语法，实时预览在右侧面板中显示。"
					value={content}
					onChange={(e) => setContent(e.target.value)}
				/>

				<div className="editor-footer">
					<div className="tag-input-container">
						{tags.map((tag) => (
							<Tag
								key={tag}
								onRemove={() => handleRemoveTag(tag)}
							>
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
						{mode === "edit" ? (
							<>
								<Button variant="outline" onClick={onCancel}>
									取消
								</Button>
								<Button
									variant="primary"
									onClick={handleSubmit}
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										style={{
											width: "14px",
											height: "14px",
										}}
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
									更新文章
								</Button>
							</>
						) : (
							<>
								<Button
									variant="primary"
									onClick={handleSubmit}
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										style={{
											width: "14px",
											height: "14px",
										}}
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
									width: "32px",
									height: "32px",
									opacity: 0.3,
									marginBottom: "12px",
									display: "block",
									marginLeft: "auto",
									marginRight: "auto",
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
