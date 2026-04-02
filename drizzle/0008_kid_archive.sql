ALTER TABLE "kid" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;
ALTER TABLE "kid" ADD COLUMN "archiveReason" text;
