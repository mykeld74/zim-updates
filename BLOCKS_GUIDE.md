# Payload Blocks Implementation Guide

This guide explains how to use Payload's Blocks field pattern for flexible content layouts in your updates.

## Overview

Blocks allow you to create reusable, composable content sections that can be arranged in any order. Each update can have a `layout` field containing an array of blocks.

## Available Block Types

### 1. **Hero Block**

A full-width hero section with optional background image.

**Payload fields:**

- `blockType: 'hero'`
- `heading` (string) - Main heading text
- `subheading` (string) - Subtitle text
- `backgroundImage` or `background_image` (string) - Cloudinary image ID

### 2. **Content Block**

Rich text content block.

**Payload fields:**

- `blockType: 'content'` or `'richText'`
- `content` or `richText` (Lexical) - Rich text content

**Supports:**

- Paragraphs, headings, lists (ul/ol)
- Bold, italic, underline, strikethrough, inline code
- Links, blockquotes

### 3. **Image Block**

Standalone image with optional caption.

**Payload fields:**

- `blockType: 'image'`
- `image` (string or object) - Cloudinary image ID or upload
- `caption` (string) - Image caption
- `width` ('full' | 'wide' | 'normal') - Width style

### 4. **Callout Block**

Highlighted message box.

**Payload fields:**

- `blockType: 'callout'`
- `message` (string) - Callout text
- `type` ('info' | 'warning' | 'success' | 'error') - Visual style

## Payload Configuration

Add a blocks field to your Updates collection:

```typescript
{
  name: 'layout',
  type: 'blocks',
  blocks: [
    {
      slug: 'hero',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'subheading', type: 'text' },
        { name: 'backgroundImage', type: 'text' }
      ]
    },
    {
      slug: 'content',
      fields: [
        { name: 'content', type: 'richText' }
      ]
    },
    {
      slug: 'image',
      fields: [
        { name: 'image', type: 'text' },
        { name: 'caption', type: 'text' },
        {
          name: 'width',
          type: 'select',
          options: ['full', 'wide', 'normal']
        }
      ]
    },
    {
      slug: 'callout',
      fields: [
        { name: 'message', type: 'text' },
        {
          name: 'type',
          type: 'select',
          options: ['info', 'warning', 'success', 'error']
        }
      ]
    }
  ]
}
```

## How It Works

### 1. API Request

The updates page fetches posts with `depth=2` to resolve nested data:

```typescript
fetch(`${PAYLOAD_API_URL}/updates?where[slug][equals]=${slug}&limit=1&depth=2`);
```

### 2. Block Rendering

The `BlockRenderer` component dynamically loads the appropriate block component:

```svelte
<BlockRenderer blocks={post.layout || []} />
```

### 3. Component Mapping

Block types are mapped to Svelte components:

```typescript
{
  hero: () => import('$lib/blocks/Hero.svelte'),
  content: () => import('$lib/blocks/Content.svelte'),
  image: () => import('$lib/blocks/ImageBlock.svelte'),
  callout: () => import('$lib/blocks/Callout.svelte')
}
```

## Creating Custom Blocks

### 1. Create Block Component

```svelte
<!-- src/lib/blocks/MyBlock.svelte -->
<script lang="ts">
	import type { Block } from '$lib/server/updates';

	interface Props extends Block {
		myField?: string;
	}

	let { myField }: Props = $props();
</script>

<div class="myBlock">
	{myField}
</div>

<style>
	.myBlock {
		/* styles */
	}
</style>
```

### 2. Register in BlockRenderer

Add to `src/lib/components/BlockRenderer.svelte`:

```typescript
const componentLoaders = {
	// ... existing
	myBlock: () => import('$lib/blocks/MyBlock.svelte')
};
```

### 3. Add to Payload Config

Add the block definition to your Payload Updates collection.

## Backward Compatibility

The system supports both:

- **New blocks** - Uses `layout` field with blocks
- **Legacy content** - Falls back to `content` field with rich text

The update post page checks:

```svelte
{#if useBlocks}
	<BlockRenderer blocks={post.layout || []} />
{:else if post.content}
	<div class="richText">
		{@html renderLexicalContent(post.content)}
	</div>
{/if}
```

## Best Practices

1. **Use semantic blocks** - Create blocks for specific purposes (hero, testimonial, etc.)
2. **Keep blocks focused** - Each block should do one thing well
3. **Style consistently** - Follow the design system spacing and colors
4. **Handle errors** - Blocks gracefully handle missing data
5. **Type safety** - Extend the `Block` interface for each block type

## Example Update Structure

```json
{
	"title": "My Post",
	"slug": "my-post",
	"layout": [
		{
			"blockType": "hero",
			"heading": "Welcome",
			"subheading": "This is a hero section"
		},
		{
			"blockType": "content",
			"content": {
				/* lexical rich text */
			}
		},
		{
			"blockType": "image",
			"image": "cloudinary-id",
			"caption": "Beautiful image"
		},
		{
			"blockType": "callout",
			"message": "Important note!",
			"type": "warning"
		}
	]
}
```

This creates a flexible, composable content system while maintaining backward compatibility with existing updates.
