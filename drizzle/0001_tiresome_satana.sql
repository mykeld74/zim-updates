CREATE TABLE "kid" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birthday" timestamp,
	"gender" text,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"phoneNumber" text NOT NULL,
	"email" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsorKid" (
	"sponsorId" text NOT NULL,
	"kidId" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "sponsorKid_sponsorId_kidId_pk" PRIMARY KEY("sponsorId","kidId")
);
--> statement-breakpoint
ALTER TABLE "sponsorKid" ADD CONSTRAINT "sponsorKid_sponsorId_sponsor_id_fk" FOREIGN KEY ("sponsorId") REFERENCES "public"."sponsor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorKid" ADD CONSTRAINT "sponsorKid_kidId_kid_id_fk" FOREIGN KEY ("kidId") REFERENCES "public"."kid"("id") ON DELETE cascade ON UPDATE no action;