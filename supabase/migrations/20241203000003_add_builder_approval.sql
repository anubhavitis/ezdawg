-- Add builder approval tracking to agent_wallets table
ALTER TABLE agent_wallets
ADD COLUMN IF NOT EXISTS builder_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS builder_fee INTEGER DEFAULT 0;

-- Add comment to explain the builder_fee column
COMMENT ON COLUMN agent_wallets.builder_fee IS 'Builder fee in 0.1 basis points format (10000 = 1%)';
