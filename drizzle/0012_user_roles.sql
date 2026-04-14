ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'sponsor' NOT NULL;
UPDATE "user" SET "role" = 'admin' WHERE lower(trim("email")) = 'mike@msdweb.pro';
