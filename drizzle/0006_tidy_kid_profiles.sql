ALTER TABLE "kid" ADD COLUMN "description" text;
ALTER TABLE "kid" ADD COLUMN "featuredImage" text;
ALTER TABLE "kid" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;
