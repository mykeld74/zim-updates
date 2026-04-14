ALTER TABLE "sponsor" ALTER COLUMN "phoneNumber" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsor" ADD COLUMN "userId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "sponsorPortalSignup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_userId_unique" UNIQUE("userId");--> statement-breakpoint
-- Grandfather existing accounts so requireEmailVerification does not lock out current users
UPDATE "user" SET "emailVerified" = true;