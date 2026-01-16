import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { GOOGLE_EMAIL, GOOGLE_EMAIL_PASSWORD } from '$env/static/private';

// ============================================================================
// Types
// ============================================================================

export interface EmailRecipient {
	email: string;
	name: string;
}

export interface SendEmailOptions {
	to: EmailRecipient[];
	subject: string;
	html: string;
	text?: string;
}

export interface SendEmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
	failedRecipients?: string[];
}

// ============================================================================
// Transporter Configuration
// ============================================================================

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
	if (!transporter) {
		if (!GOOGLE_EMAIL || !GOOGLE_EMAIL_PASSWORD) {
			throw new Error(
				'Gmail credentials not configured. Set GOOGLE_EMAIL and GOOGLE_EMAIL_PASSWORD in .env'
			);
		}

		transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: GOOGLE_EMAIL,
				pass: GOOGLE_EMAIL_PASSWORD
			}
		});
	}

	return transporter;
}

// ============================================================================
// Email Sending Functions
// ============================================================================

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
	try {
		const transport = getTransporter();

		// Format recipients
		const toAddresses = options.to.map((r) => `"${r.name}" <${r.email}>`);

		const mailOptions = {
			from: `"Zimbabwe Updates" <${GOOGLE_EMAIL}>`,
			bcc: toAddresses, // Use BCC to hide recipient list from each other
			subject: options.subject,
			html: options.html,
			text: options.text || stripHtml(options.html)
		};

		const info = await transport.sendMail(mailOptions);

		return {
			success: true,
			messageId: info.messageId
		};
	} catch (error) {
		console.error('Error sending email:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

// ============================================================================
// Email Templates
// ============================================================================

export function generateUpdateAnnouncementEmail(
	update: {
		title: string;
		excerpt?: string | null;
		slug: string;
	},
	siteUrl: string
): { subject: string; html: string } {
	const updateUrl = `${siteUrl}/updates/${update.slug}`;

	const subject = `New Update: ${update.title}`;

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); border-radius: 12px 12px 0 0;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">New Update Available!</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 40px;">
							<h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">${update.title}</h2>

							${
								update.excerpt
									? `
							<p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6;">
								${update.excerpt}
							</p>
							`
									: ''
							}

							<a href="${updateUrl}" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
								Read Full Update
							</a>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #9ca3af; font-size: 14px; text-align: center;">
								You're receiving this because you're a sponsor of a child in Zimabwe.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`;

	return { subject, html };
}

export function generateCustomEmail(
	subject: string,
	content: string
): { subject: string; html: string } {
	// Add inline styles to common HTML elements for email compatibility
	const styledContent = content
		.replace(
			/<h2>/g,
			'<h2 style="margin: 24px 0 16px; color: #1f2937; font-size: 22px; font-weight: 600;">'
		)
		.replace(
			/<h3>/g,
			'<h3 style="margin: 20px 0 12px; color: #1f2937; font-size: 18px; font-weight: 600;">'
		)
		.replace(
			/<p>/g,
			'<p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.7;">'
		)
		.replace(/<ul>/g, '<ul style="margin: 0 0 16px; padding-left: 24px; color: #374151;">')
		.replace(/<ol>/g, '<ol style="margin: 0 0 16px; padding-left: 24px; color: #374151;">')
		.replace(/<li>/g, '<li style="margin-bottom: 8px; font-size: 16px; line-height: 1.6;">')
		.replace(
			/<blockquote>/g,
			'<blockquote style="border-left: 4px solid #4f46e5; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280;">'
		)
		.replace(/<a /g, '<a style="color: #4f46e5; text-decoration: underline;" ')
		.replace(/<strong>/g, '<strong style="font-weight: 600; color: #1f2937;">')
		.replace(/<em>/g, '<em style="font-style: italic;">');

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #025990 0%, #0099FB 100%); border-radius: 12px 12px 0 0;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Fountain of Hope Updates</h1>
						</td>
					</tr>

					<!-- Content -->
					<tr>
						<td style="padding: 40px;">
							<h2 style="margin: 0 0 24px; color: #025990; font-size: 24px; font-weight: 600;">${subject}</h2>
							<div style="color: #374151; font-size: 16px; line-height: 1.7;">
								${styledContent}
							</div>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #9ca3af; font-size: 14px; text-align: center;">
								You're receiving this because you're subscribed to updates from Zim Updates.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
`;

	return { subject, html };
}

// ============================================================================
// Utility Functions
// ============================================================================

function stripHtml(html: string): string {
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}
