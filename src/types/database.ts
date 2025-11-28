export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          wallet_address: string
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          wallet_address?: string
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      agent_wallets: {
        Row: {
          id: string
          user_id: string
          wallet_address: string
          encrypted_private_key: string
          name: string | null
          is_active: boolean
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          wallet_address: string
          encrypted_private_key: string
          name?: string | null
          is_active?: boolean
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          wallet_address?: string
          encrypted_private_key?: string
          name?: string | null
          is_active?: boolean
          created_at?: string
          deleted_at?: string | null
        }
      }
      systematic_investment_plans: {
        Row: {
          id: string
          user_id: string
          agent_wallet_id: string
          asset_name: string
          asset_index: number
          amount_usdc: string
          interval: 'h' | '12h' | '24h'
          status: 'active' | 'paused' | 'completed' | 'cancelled'
          start_date: string
          end_date: string | null
          next_execution_at: string
          last_execution_at: string | null
          total_invested: string
          total_tokens_acquired: string
          execution_count: number
          failed_execution_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_wallet_id: string
          asset_name: string
          asset_index: number
          amount_usdc: string
          interval: '8h' | '12h' | '24h'
          status?: 'active' | 'paused' | 'completed' | 'cancelled'
          start_date?: string
          end_date?: string | null
          next_execution_at: string
          last_execution_at?: string | null
          total_invested?: string
          total_tokens_acquired?: string
          execution_count?: number
          failed_execution_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_wallet_id?: string
          asset_name?: string
          asset_index?: number
          amount_usdc?: string
          interval?: '8h' | '12h' | '24h'
          status?: 'active' | 'paused' | 'completed' | 'cancelled'
          start_date?: string
          end_date?: string | null
          next_execution_at?: string
          last_execution_at?: string | null
          total_invested?: string
          total_tokens_acquired?: string
          execution_count?: number
          failed_execution_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      sip_executions: {
        Row: {
          id: string
          sip_id: string
          executed_at: string
          status: 'success' | 'failed' | 'pending'
          amount_usdc: string | null
          tokens_acquired: string | null
          execution_price: string | null
          transaction_hash: string | null
          order_id: string | null
          error_message: string | null
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          sip_id: string
          executed_at?: string
          status: 'success' | 'failed' | 'pending'
          amount_usdc?: string | null
          tokens_acquired?: string | null
          execution_price?: string | null
          transaction_hash?: string | null
          order_id?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          sip_id?: string
          executed_at?: string
          status?: 'success' | 'failed' | 'pending'
          amount_usdc?: string | null
          tokens_acquired?: string | null
          execution_price?: string | null
          transaction_hash?: string | null
          order_id?: string | null
          error_message?: string | null
          retry_count?: number
          created_at?: string
        }
      }
      hyperliquid_spot_metadata: {
        Row: {
          id: string
          asset_name: string
          asset_index: number
          token_id: string | null
          sz_decimals: number | null
          wei_decimals: number | null
          is_canonical: boolean | null
          min_lot_size: string | null
          last_updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          asset_name: string
          asset_index: number
          token_id?: string | null
          sz_decimals?: number | null
          wei_decimals?: number | null
          is_canonical?: boolean | null
          min_lot_size?: string | null
          last_updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          asset_name?: string
          asset_index?: number
          token_id?: string | null
          sz_decimals?: number | null
          wei_decimals?: number | null
          is_canonical?: boolean | null
          min_lot_size?: string | null
          last_updated_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      interval_type: '8h' | '12h' | '24h'
      sip_status: 'active' | 'paused' | 'completed' | 'cancelled'
      execution_status: 'success' | 'failed' | 'pending'
    }
  }
}
