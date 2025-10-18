
-- CreateEnum for STT Provider types
CREATE TYPE "STTProvider" AS ENUM ('OPENAI', 'KB_WHISPER_PUDUN', 'KB_WHISPER_FLOW_SPEAK');

-- STT Provider Configuration table
CREATE TABLE "stt_provider_config" (
  "id" TEXT NOT NULL,
  "provider_name" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "api_endpoint" TEXT,
  "port" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "priority_order" INTEGER NOT NULL,
  "max_retry_attempts" INTEGER NOT NULL DEFAULT 3,
  "timeout_seconds" INTEGER NOT NULL DEFAULT 30,
  "config_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stt_provider_config_pkey" PRIMARY KEY ("id")
);

-- STT Provider Usage Logs table
CREATE TABLE "stt_provider_usage_logs" (
  "id" TEXT NOT NULL,
  "clinic_id" TEXT,
  "provider_id" TEXT NOT NULL,
  "audio_duration_seconds" DECIMAL(10,2),
  "processing_time_seconds" DECIMAL(10,2),
  "success" BOOLEAN NOT NULL,
  "error_message" TEXT,
  "fallback_used" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stt_provider_usage_logs_pkey" PRIMARY KEY ("id")
);

-- Create unique index for priority_order
CREATE UNIQUE INDEX "stt_provider_config_priority_order_key" ON "stt_provider_config"("priority_order");

-- Create indexes for performance
CREATE INDEX "stt_provider_usage_logs_clinic_id_idx" ON "stt_provider_usage_logs"("clinic_id");
CREATE INDEX "stt_provider_usage_logs_provider_id_idx" ON "stt_provider_usage_logs"("provider_id");
CREATE INDEX "stt_provider_usage_logs_created_at_idx" ON "stt_provider_usage_logs"("created_at");

-- Add foreign key constraints
ALTER TABLE "stt_provider_usage_logs" ADD CONSTRAINT "stt_provider_usage_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stt_provider_usage_logs" ADD CONSTRAINT "stt_provider_usage_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "stt_provider_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default providers
INSERT INTO "stt_provider_config" ("id", "provider_name", "display_name", "api_endpoint", "port", "priority_order", "config_json") VALUES
('stt_kb_flow_speak', 'KB_WHISPER_FLOW_SPEAK', 'KB-Whisper Flow-Speak (Telefoni)', 'http://69.62.126.30', 5001, 1, '{"language": "sv", "beam_size": 8, "best_of": 7}'),
('stt_openai', 'OPENAI', 'OpenAI Whisper API', null, null, 2, '{"model": "whisper-1", "language": "sv"}'),
('stt_kb_pudun', 'KB_WHISPER_PUDUN', 'KB-Whisper Pudun (High Quality)', 'http://69.62.126.30', 5000, 3, '{"language": "sv", "beam_size": 15, "best_of": 5}');
