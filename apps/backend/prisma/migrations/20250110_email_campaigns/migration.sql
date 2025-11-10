-- CreateEnum for contact sources
CREATE TYPE "ContactSource" AS ENUM ('SOCIAL_MEDIA', 'CSV_IMPORT', 'MANUAL', 'API', 'INTEGRATION');

-- CreateEnum for campaign status
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'GENERATING', 'READY', 'SCHEDULED', 'SENDING', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum for email status
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED', 'SPAM');

-- CreateEnum for AI model type
CREATE TYPE "AIModelType" AS ENUM ('LOCAL_LLM', 'OPENAI', 'ANTHROPIC');

-- Contacts table
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "full_name" TEXT,
    "company" TEXT,
    "job_title" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "source" "ContactSource" NOT NULL DEFAULT 'MANUAL',
    "source_id" TEXT,
    "profile_data" JSONB,
    "custom_fields" JSONB,
    "is_subscribed" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribed_at" TIMESTAMP(3),
    "last_contacted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- Contact tags table
CREATE TABLE "contact_tags" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("id")
);

-- Contact interactions table (social media, emails, etc.)
CREATE TABLE "contact_interactions" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "platform" TEXT,
    "interaction_data" JSONB,
    "summary" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_interactions_pkey" PRIMARY KEY ("id")
);

-- Email campaigns table
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject_template" TEXT NOT NULL,
    "campaign_goal" TEXT,
    "target_tags" TEXT[],
    "ai_model_type" "AIModelType" NOT NULL DEFAULT 'LOCAL_LLM',
    "ai_model_name" TEXT NOT NULL DEFAULT 'llama3',
    "personalization_instructions" TEXT,
    "personalization_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "include_social_context" BOOLEAN NOT NULL DEFAULT true,
    "include_interaction_history" BOOLEAN NOT NULL DEFAULT true,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "total_contacts" INTEGER NOT NULL DEFAULT 0,
    "emails_generated" INTEGER NOT NULL DEFAULT 0,
    "emails_sent" INTEGER NOT NULL DEFAULT 0,
    "emails_delivered" INTEGER NOT NULL DEFAULT 0,
    "emails_opened" INTEGER NOT NULL DEFAULT 0,
    "emails_clicked" INTEGER NOT NULL DEFAULT 0,
    "emails_bounced" INTEGER NOT NULL DEFAULT 0,
    "emails_failed" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- Email templates for campaigns
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "base_template" TEXT NOT NULL,
    "placeholders" JSONB,
    "html_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- Campaign contacts (many-to-many with personalized content)
CREATE TABLE "campaign_contacts" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "personalized_subject" TEXT,
    "personalized_content" TEXT,
    "html_content" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "ai_generation_time_ms" INTEGER,
    "send_attempts" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "bounced_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_contacts_pkey" PRIMARY KEY ("id")
);

-- Email tracking for analytics
CREATE TABLE "email_tracking" (
    "id" TEXT NOT NULL,
    "campaign_contact_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_tracking_pkey" PRIMARY KEY ("id")
);

-- Contact lists for organization
CREATE TABLE "contact_lists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_dynamic" BOOLEAN NOT NULL DEFAULT false,
    "filter_criteria" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_lists_pkey" PRIMARY KEY ("id")
);

-- Contact list members
CREATE TABLE "contact_list_members" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_list_members_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "contacts_user_id_idx" ON "contacts"("user_id");
CREATE INDEX "contacts_email_idx" ON "contacts"("email");
CREATE INDEX "contacts_source_idx" ON "contacts"("source");
CREATE UNIQUE INDEX "contacts_user_email_unique" ON "contacts"("user_id", "email");

CREATE INDEX "contact_tags_contact_id_idx" ON "contact_tags"("contact_id");
CREATE INDEX "contact_tags_tag_idx" ON "contact_tags"("tag");
CREATE UNIQUE INDEX "contact_tags_contact_tag_unique" ON "contact_tags"("contact_id", "tag");

CREATE INDEX "contact_interactions_contact_id_idx" ON "contact_interactions"("contact_id");
CREATE INDEX "contact_interactions_platform_idx" ON "contact_interactions"("platform");

CREATE INDEX "email_campaigns_user_id_idx" ON "email_campaigns"("user_id");
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");

CREATE INDEX "email_templates_campaign_id_idx" ON "email_templates"("campaign_id");

CREATE INDEX "campaign_contacts_campaign_id_idx" ON "campaign_contacts"("campaign_id");
CREATE INDEX "campaign_contacts_contact_id_idx" ON "campaign_contacts"("contact_id");
CREATE INDEX "campaign_contacts_status_idx" ON "campaign_contacts"("status");
CREATE UNIQUE INDEX "campaign_contacts_unique" ON "campaign_contacts"("campaign_id", "contact_id");

CREATE INDEX "email_tracking_campaign_contact_id_idx" ON "email_tracking"("campaign_contact_id");
CREATE INDEX "email_tracking_event_type_idx" ON "email_tracking"("event_type");

CREATE INDEX "contact_lists_user_id_idx" ON "contact_lists"("user_id");

CREATE INDEX "contact_list_members_list_id_idx" ON "contact_list_members"("list_id");
CREATE INDEX "contact_list_members_contact_id_idx" ON "contact_list_members"("contact_id");
CREATE UNIQUE INDEX "contact_list_members_unique" ON "contact_list_members"("list_id", "contact_id");

-- Foreign keys
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_interactions" ADD CONSTRAINT "contact_interactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_contacts" ADD CONSTRAINT "campaign_contacts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_contacts" ADD CONSTRAINT "campaign_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_campaign_contact_id_fkey" FOREIGN KEY ("campaign_contact_id") REFERENCES "campaign_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_lists" ADD CONSTRAINT "contact_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_list_members" ADD CONSTRAINT "contact_list_members_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "contact_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_list_members" ADD CONSTRAINT "contact_list_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
