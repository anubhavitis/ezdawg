-- Add approved column to agent_wallets
ALTER TABLE agent_wallets
ADD COLUMN approved boolean DEFAULT false NOT NULL;
