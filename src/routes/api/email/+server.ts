import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail, generateUpdateAnnouncementEmail, generateCustomEmail, type EmailRecipient } from '$lib/server/email';
import { getAllSponsors, getSubscribedSponsors } from '$lib/server/sponsors';
import { getUpdateById } from '$lib/server/updates';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const body = await request.json();
		const { type, updateId, subject, content, recipientIds, message } = body;

		if (!type) {
			return json({ error: 'Email type is required' }, { status: 400 });
		}

		// Get recipients based on selection
		let recipients: EmailRecipient[] = [];

		if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
			// Send to specific selected sponsors
			const allSponsors = await getAllSponsors();
			const selectedSponsors = allSponsors.filter((s) => recipientIds.includes(s.id));
			recipients = selectedSponsors.map((s) => ({
				email: s.email,
				name: `${s.firstName} ${s.lastName}`
			}));
		} else if (type === 'announcement') {
			// Default for announcements: send to all subscribed sponsors
			const sponsors = await getSubscribedSponsors();
			recipients = sponsors.map((s) => ({
				email: s.email,
				name: `${s.firstName} ${s.lastName}`
			}));
		}

		if (recipients.length === 0) {
			return json({ error: 'No recipients selected or no subscribed sponsors found' }, { status: 400 });
		}

		let emailContent: { subject: string; html: string };

		if (type === 'announcement') {
			// New update announcement
			if (!updateId) {
				return json({ error: 'Update ID is required for announcements' }, { status: 400 });
			}

			const update = await getUpdateById(updateId);
			if (!update) {
				return json({ error: 'Update not found' }, { status: 404 });
			}

			// Build site URL
			const siteUrl = `${url.protocol}//${url.host}`;
			emailContent = generateUpdateAnnouncementEmail(update, siteUrl, message || undefined);
		} else if (type === 'custom') {
			// Custom email
			if (!subject || !content) {
				return json({ error: 'Subject and content are required for custom emails' }, { status: 400 });
			}

			emailContent = generateCustomEmail(subject, content);
		} else {
			return json({ error: 'Invalid email type. Use "announcement" or "custom"' }, { status: 400 });
		}

		// Send the email
		const result = await sendEmail({
			to: recipients,
			subject: emailContent.subject,
			html: emailContent.html
		});

		if (result.success) {
			return json({
				success: true,
				message: `Email sent successfully to ${recipients.length} recipient(s)`,
				recipientCount: recipients.length,
				messageId: result.messageId
			});
		} else {
			return json({
				error: result.error || 'Failed to send email',
				failedRecipients: result.failedRecipients
			}, { status: 500 });
		}
	} catch (error) {
		console.error('Email API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
