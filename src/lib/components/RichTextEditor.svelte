<script lang="ts">
	import { onMount, tick } from 'svelte';

	interface Props {
		content: string;
		onchange?: (html: string) => void;
		placeholder?: string;
	}

	let { content = '', onchange, placeholder = 'Start writing...' }: Props = $props();

	let editorRef: HTMLDivElement;
	let isFocused = $state(false);
	let isUserEditing = $state(false);
	let initialized = $state(false);

	onMount(async () => {
		await tick(); // Ensure DOM is ready
		if (editorRef && content) {
			editorRef.innerHTML = content;
		}
		initialized = true;
	});

	// Sync prop changes to editor (but not during user editing and after init)
	$effect(() => {
		if (initialized && editorRef && !isUserEditing) {
			// Only update if content is different from what's displayed
			if (editorRef.innerHTML !== content) {
				editorRef.innerHTML = content;
			}
		}
	});

	function execCommand(command: string, value?: string) {
		document.execCommand(command, false, value);
		editorRef?.focus();
		handleInput();
	}

	function handleInput() {
		if (onchange && editorRef) {
			onchange(editorRef.innerHTML);
		}
	}

	function handleFocus() {
		isFocused = true;
		isUserEditing = true;
	}

	function handleBlur() {
		isFocused = false;
		// Delay resetting isUserEditing to allow any pending saves to complete
		setTimeout(() => {
			isUserEditing = false;
		}, 100);
	}

	function insertHeading(level: number) {
		execCommand('formatBlock', `h${level}`);
	}

	function insertParagraph() {
		execCommand('formatBlock', 'p');
	}

	function insertList(ordered: boolean) {
		execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
	}

	function insertLink() {
		const url = prompt('Enter URL:');
		if (url) {
			execCommand('createLink', url);
		}
	}

	function toggleBlockquote() {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		// Check if we're currently inside a blockquote
		let node: Node | null = selection.anchorNode;
		let inBlockquote = false;

		while (node && node !== editorRef) {
			if (node.nodeName === 'BLOCKQUOTE') {
				inBlockquote = true;
				break;
			}
			node = node.parentNode;
		}

		if (inBlockquote) {
			// Remove blockquote by converting to paragraph
			execCommand('formatBlock', 'p');
		} else {
			// Add blockquote
			execCommand('formatBlock', 'blockquote');
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		// Handle Enter key inside blockquote
		if (e.key === 'Enter' && !e.shiftKey) {
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				let node: Node | null = selection.anchorNode;
				let blockquote: HTMLElement | null = null;

				// Find if we're in a blockquote
				while (node && node !== editorRef) {
					if (node.nodeName === 'BLOCKQUOTE') {
						blockquote = node as HTMLElement;
						break;
					}
					node = node.parentNode;
				}

				// If in blockquote and the current line is empty, exit blockquote
				if (blockquote) {
					const range = selection.getRangeAt(0);
					const textContent = selection.anchorNode?.textContent || '';
					
					// Check if we're at an empty line or at the end with empty content
					if (textContent.trim() === '' || (range.collapsed && textContent === '\n')) {
						e.preventDefault();
						
						// Create a new paragraph after the blockquote
						const p = document.createElement('p');
						p.innerHTML = '<br>';
						blockquote.parentNode?.insertBefore(p, blockquote.nextSibling);
						
						// Move cursor to the new paragraph
						const newRange = document.createRange();
						newRange.setStart(p, 0);
						newRange.collapse(true);
						selection.removeAllRanges();
						selection.addRange(newRange);
						
						// Clean up empty blockquote content if needed
						if (blockquote.textContent?.trim() === '') {
							blockquote.remove();
						}
						
						handleInput();
						return;
					}
				}
			}
		}

		// Handle keyboard shortcuts
		if (e.metaKey || e.ctrlKey) {
			switch (e.key.toLowerCase()) {
				case 'b':
					e.preventDefault();
					execCommand('bold');
					break;
				case 'i':
					e.preventDefault();
					execCommand('italic');
					break;
				case 'u':
					e.preventDefault();
					execCommand('underline');
					break;
			}
		}
	}
</script>

<div class="richTextEditor" class:focused={isFocused}>
	<div class="toolbar">
		<div class="toolbarGroup">
			<button type="button" onclick={() => insertHeading(2)} title="Heading 2" class="toolbarBtn">
				H2
			</button>
			<button type="button" onclick={() => insertHeading(3)} title="Heading 3" class="toolbarBtn">
				H3
			</button>
			<button type="button" onclick={insertParagraph} title="Paragraph" class="toolbarBtn">
				P
			</button>
		</div>

		<div class="toolbarDivider"></div>

		<div class="toolbarGroup">
			<button
				type="button"
				onclick={() => execCommand('bold')}
				title="Bold (Cmd+B)"
				class="toolbarBtn"
			>
				<strong>B</strong>
			</button>
			<button
				type="button"
				onclick={() => execCommand('italic')}
				title="Italic (Cmd+I)"
				class="toolbarBtn"
			>
				<em>I</em>
			</button>
			<button
				type="button"
				onclick={() => execCommand('underline')}
				title="Underline (Cmd+U)"
				class="toolbarBtn"
			>
				<u>U</u>
			</button>
			<button
				type="button"
				onclick={() => execCommand('strikeThrough')}
				title="Strikethrough"
				class="toolbarBtn"
			>
				<s>S</s>
			</button>
		</div>

		<div class="toolbarDivider"></div>

		<div class="toolbarGroup">
			<button
				type="button"
				onclick={() => insertList(false)}
				title="Bullet List"
				class="toolbarBtn"
			>
				• List
			</button>
			<button
				type="button"
				onclick={() => insertList(true)}
				title="Numbered List"
				class="toolbarBtn"
			>
				1. List
			</button>
		</div>

		<div class="toolbarDivider"></div>

		<div class="toolbarGroup">
		<button type="button" onclick={insertLink} title="Insert Link" class="toolbarBtn">
			🔗 Link
		</button>
		<button
			type="button"
			onclick={toggleBlockquote}
			title="Quote (toggle)"
			class="toolbarBtn"
		>
			" Quote
		</button>
		</div>
	</div>

	<div
		id="content-editor"
		class="editorContent"
		contenteditable="true"
		bind:this={editorRef}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		onfocus={handleFocus}
		onblur={handleBlur}
		data-placeholder={placeholder}
		role="textbox"
		tabindex="0"
		aria-multiline="true"
		aria-label="Rich text editor"
	></div>
</div>

<style>
	.richTextEditor {
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--backgroundColor);
		transition: border-color var(--transition-base);
	}

	.richTextEditor.focused {
		border-color: var(--primaryColor);
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		background: var(--surfaceColor);
		border-bottom: 1px solid var(--borderColor);
	}

	.toolbarGroup {
		display: flex;
		gap: 2px;
	}

	.toolbarDivider {
		width: 1px;
		background: var(--borderColor);
		margin: 0 var(--spacing-xs);
	}

	.toolbarBtn {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--textColor);
		transition: all var(--transition-fast);
		min-width: 32px;
	}

	.toolbarBtn:hover {
		background: var(--backgroundColor);
		border-color: var(--borderColor);
	}

	.toolbarBtn:active {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.editorContent {
		min-height: 300px;
		padding: var(--spacing-lg);
		outline: none;
		line-height: 1.8;
		color: var(--textColor);
	}

	.editorContent:empty::before {
		content: attr(data-placeholder);
		color: var(--textMuted);
		pointer-events: none;
	}

	.editorContent :global(h2) {
		font-size: 1.75rem;
		margin: var(--spacing-lg) 0 var(--spacing-md);
		color: var(--primaryColor);
	}

	.editorContent :global(h3) {
		font-size: 1.4rem;
		margin: var(--spacing-md) 0 var(--spacing-sm);
		color: var(--primaryColor);
	}

	.editorContent :global(p) {
		margin: 0 0 var(--spacing-md);
	}

	.editorContent :global(ul),
	.editorContent :global(ol) {
		margin: 0 0 var(--spacing-md);
		padding-left: var(--spacing-xl);
	}

	.editorContent :global(li) {
		margin-bottom: var(--spacing-xs);
	}

	.editorContent :global(blockquote) {
		border-left: 4px solid var(--primaryColor);
		padding-left: var(--spacing-lg);
		margin: var(--spacing-lg) 0;
		font-style: italic;
		color: var(--textMuted);
	}

	.editorContent :global(a) {
		color: var(--primaryColor);
		text-decoration: underline;
	}
</style>
