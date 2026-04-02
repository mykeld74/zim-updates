import { load, type Element } from 'cheerio';

/**
 * Strips inline styles and presentation attributes so markup relies on semantic
 * tags only. Matches the rules in `RichTextEditor.svelte` (keep both in sync).
 */
export function sanitizeRichHtml(html: string): string {
	if (!html || !html.trim()) {
		return html;
	}

	const $ = load(html, null, false);

	while ($('font').length > 0) {
		$('font').each((_, el) => {
			const $el = $(el);
			$el.replaceWith($el.contents());
		});
	}

	$('*').each((_, el) => {
		const $el = $(el);
		$el.removeAttr('style');
		$el.removeAttr('class');
		$el.removeAttr('color');
		$el.removeAttr('bgcolor');
		$el.removeAttr('face');
		$el.removeAttr('size');
		$el.removeAttr('align');
	});

	for (let pass = 0; pass < 24; pass++) {
		const bareSpans = $('span').filter((_, el) => {
			const attribs = (el as Element).attribs;
			return !attribs || Object.keys(attribs).length === 0;
		});
		if (bareSpans.length === 0) break;
		bareSpans.each((_, el) => {
			const $el = $(el);
			$el.replaceWith($el.contents());
		});
	}

	return $.html();
}
