CREATE TABLE "update" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" jsonb,
	"layout" jsonb,
	"featuredImage" text,
	"author" text DEFAULT 'Admin' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"publishedAt" timestamp,
	CONSTRAINT "update_slug_unique" UNIQUE("slug")
);
