-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Agent wallets table
CREATE TABLE agent_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) UNIQUE NOT NULL,
  agent_address text NOT NULL,
  encrypted_private_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now - will tighten in production)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on agent_wallets" ON agent_wallets FOR ALL USING (true);
