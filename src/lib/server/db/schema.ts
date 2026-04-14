import { pgTable, text, timestamp, boolean, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	role: text('role').notNull().default('sponsor'),
	emailVerified: boolean('emailVerified').notNull().default(false),
	approved: boolean('approved').notNull().default(false),
	/** Set when registering via sponsor portal API; controls auto-create of sponsor row after verification. */
	sponsorPortalSignup: boolean('sponsorPortalSignup').notNull().default(false),
	image: text('image'),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expiresAt').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId')
		.notNull()
		.references(() => user.id)
});

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => user.id),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull()
});

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt').notNull(),
	createdAt: timestamp('createdAt'),
	updatedAt: timestamp('updatedAt')
});

export const sponsor = pgTable('sponsor', {
	id: text('id').primaryKey(),
	userId: text('userId').unique().references(() => user.id, { onDelete: 'set null' }),
	firstName: text('firstName'),
	lastName: text('lastName').notNull(),
	phoneNumber: text('phoneNumber'),
	email: text('email').notNull(),
	sponsorshipType: text('sponsorshipType').notNull().default('individual'),
	subscribed: boolean('subscribed').notNull().default(true),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull()
});

export const kid = pgTable('kid', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	nickname: text('nickname'),
	tagline: text('tagline'),
	birthday: timestamp('birthday'),
	gender: text('gender'),
	image: text('image'),
	description: text('description'),
	featuredImage: text('featuredImage'),
	images: jsonb('images').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
	archived: boolean('archived').notNull().default(false),
	archiveReason: text('archiveReason'),
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull()
});

export const sponsorKid = pgTable(
	'sponsorKid',
	{
		sponsorId: text('sponsorId')
			.notNull()
			.references(() => sponsor.id, { onDelete: 'cascade' }),
		kidId: text('kidId')
			.notNull()
			.references(() => kid.id, { onDelete: 'cascade' }),
		createdAt: timestamp('createdAt').notNull()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.sponsorId, table.kidId] })
	})
);

export const sponsorRelations = relations(sponsor, ({ many }) => ({
	sponsorKids: many(sponsorKid)
}));

export const kidRelations = relations(kid, ({ many }) => ({
	sponsorKids: many(sponsorKid)
}));

export const sponsorKidRelations = relations(sponsorKid, ({ one }) => ({
	sponsor: one(sponsor, {
		fields: [sponsorKid.sponsorId],
		references: [sponsor.id]
	}),
	kid: one(kid, {
		fields: [sponsorKid.kidId],
		references: [kid.id]
	})
}));

// Updates/Posts table
export const update = pgTable('update', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	excerpt: text('excerpt'),
	content: jsonb('content'), // Lexical rich text content
	layout: jsonb('layout'), // Blocks array for block-based content
	featuredImage: text('featuredImage'), // Cloudinary public ID
	author: text('author').notNull().default('Admin'),
	status: text('status').notNull().default('draft'), // 'draft' | 'published'
	createdAt: timestamp('createdAt').notNull(),
	updatedAt: timestamp('updatedAt').notNull(),
	publishedAt: timestamp('publishedAt')
});
