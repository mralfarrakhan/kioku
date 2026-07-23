import { marked, type TokenizerAndRendererExtension } from 'marked';
import { stringToColor } from '$lib/color';

// Custom extension for [text]{color}
const colorExtension: TokenizerAndRendererExtension = {
	name: 'colorText',
	level: 'inline',
	start(src: string) {
		return src.match(/\[/)?.index;
	},
	tokenizer(src: string, tokens: any) {
		const rule = /^\[([^\]]+)\]\{([^}]+)\}/;
		const match = rule.exec(src);
		if (match) {
			return {
				type: 'colorText',
				raw: match[0],
				text: match[1],
				color: match[2],
				tokens: this.lexer.inlineTokens(match[1]) // parse inner content (bold, etc.)
			};
		}
	},
	renderer(token: any) {
		// sanitize color value, allow @ for seed indicator
		let safeColor = token.color.replace(/[^a-zA-Z0-9#\(\),.\s-@]/g, '').trim();

		if (safeColor.startsWith('@')) {
			let seed = safeColor.slice(1).trim();
			if (!seed) {
				seed = token.text; // fallback to text itself if just {@}
			}
			// Use a higher saturation and lower lightness for better text contrast
			safeColor = stringToColor(seed, 80, 50);
		}

		return `<span style="color: ${safeColor};">${this.parser.parseInline(token.tokens)}</span>`;
	}
};

marked.use({ extensions: [colorExtension] });

export function parseMarkdown(text: string | null | undefined): string {
	if (!text) return '';

	// Escape HTML
	const escapedText = text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');

	const rawHtml = marked.parseInline(escapedText, { async: false, breaks: true }) as string;

	return rawHtml;
}
