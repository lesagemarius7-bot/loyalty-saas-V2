// Placeholder hand-written types matching supabase/migrations/0001_init.sql.
// Regenerate the real thing once the local DB is running:
//   npm run supabase:types
// which overwrites this file from introspection — keep it out of sync only until then.
//
// Every table needs Row/Insert/Update/Relationships to satisfy supabase-js's
// GenericTable constraint, and the schema needs Tables/Views/Functions to satisfy
// GenericSchema. Row aliases are declared standalone (not indexed back into
// `Database` from within its own declaration) — self-referencing `Database[...]`
// while `Database` is still being defined resolves to `never` for every query.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type MerchantRow = {
  id: string
  owner_id: string
  business_name: string
  slug: string
  logo_url: string | null
  brand_color: string
  card_text_color: string
  city: string | null
  avg_basket_value: number | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'
  plan: string
  poc_start_date: string
  poc_duration_days: number
  subscription_plan: 'essentiel' | 'performance_ia'
  billing_status: 'poc_active' | 'active' | 'past_due' | 'canceled'
  api_key: string
  created_at: string
  updated_at: string
}

type StaffMemberRow = {
  id: string
  merchant_id: string
  user_id: string
  role: 'owner' | 'manager' | 'staff'
  created_at: string
}

type LoyaltyProgramRow = {
  id: string
  merchant_id: string
  name: string
  points_per_euro: number
  reward_threshold: number
  reward_description: string
  stamp_icon: string
  is_active: boolean
  inactivity_reminder_enabled: boolean
  inactivity_threshold_days: number
  inactivity_message: string
  smart_engagement_enabled: boolean
  background_style: 'solid' | 'gradient'
  gradient_secondary_color: string
  banner_image_url: string | null
  back_address: string | null
  back_phone: string | null
  back_hours: string | null
  back_instagram_url: string | null
  back_google_review_url: string | null
  back_terms: string
  latitude: number | null
  longitude: number | null
  auto_send_on_payment_enabled: boolean
  auto_send_channel: 'email' | 'link_only'
  created_at: string
}

type CustomerRow = {
  id: string
  merchant_id: string
  full_name: string
  email: string | null
  phone: string | null
  created_at: string
}

type LoyaltyCardRow = {
  id: string
  merchant_id: string
  customer_id: string
  program_id: string
  serial_number: string
  points_balance: number
  status: 'active' | 'suspended'
  apple_pass_updated_at: string | null
  google_object_id: string | null
  last_message: string | null
  last_message_at: string | null
  last_visit_at: string | null
  last_inactivity_notification_at: string | null
  last_smart_engagement_at: string | null
  created_at: string
}

type TransactionRow = {
  id: string
  merchant_id: string
  card_id: string
  staff_user_id: string | null
  type: 'earn' | 'redeem' | 'adjust'
  points_delta: number
  note: string | null
  created_at: string
}

type AppleWalletRegistrationRow = {
  id: string
  card_id: string
  device_library_identifier: string
  push_token: string
  created_at: string
}

type CardPreviewSessionRow = {
  merchant_id: string
  payload: Json
  updated_at: string
}

type NotificationCampaignRow = {
  id: string
  merchant_id: string
  message: string
  recipient_count: number
  type: 'manual' | 'inactivity' | 'smart_engagement' | 'targeted'
  target_summary: string | null
  created_at: string
}

type CustomerPurchaseHabitsRow = {
  customer_id: string
  merchant_id: string
  preferred_time_of_day: 'morning' | 'midday' | 'evening' | null
  visit_frequency_days: number | null
  avg_points_per_visit: number | null
  favorite_category: string | null
  last_purchased_category: string | null
  last_transaction_at: string | null
  updated_at: string
}

type PosTransactionEventRow = {
  id: string
  merchant_id: string
  customer_id: string | null
  source: string
  payload: Json
  received_at: string
}

type NotificationTemplateRow = {
  id: string
  merchant_id: string
  name: string
  title_template: string
  body_template: string
  category_target: string | null
  created_at: string
  updated_at: string
}

type NotificationDeliveryRow = {
  id: string
  campaign_id: string | null
  merchant_id: string
  customer_id: string
  platform: 'apple' | 'google'
  message_text: string
  status: 'pending' | 'success' | 'failed' | 'uninstalled'
  error_details: string | null
  sent_at: string
}

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: MerchantRow
        Insert: Partial<MerchantRow> & { owner_id: string; business_name: string; slug: string }
        Update: Partial<MerchantRow>
        Relationships: []
      }
      staff_members: {
        Row: StaffMemberRow
        Insert: Partial<StaffMemberRow> & { merchant_id: string; user_id: string }
        Update: Partial<StaffMemberRow>
        Relationships: [
          {
            foreignKeyName: 'staff_members_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
        ]
      }
      loyalty_programs: {
        Row: LoyaltyProgramRow
        Insert: Partial<LoyaltyProgramRow> & { merchant_id: string }
        Update: Partial<LoyaltyProgramRow>
        Relationships: [
          {
            foreignKeyName: 'loyalty_programs_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
        ]
      }
      customers: {
        Row: CustomerRow
        Insert: Partial<CustomerRow> & { merchant_id: string; full_name: string }
        Update: Partial<CustomerRow>
        Relationships: [
          {
            foreignKeyName: 'customers_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
        ]
      }
      loyalty_cards: {
        Row: LoyaltyCardRow
        Insert: Partial<LoyaltyCardRow> & { merchant_id: string; customer_id: string; program_id: string }
        Update: Partial<LoyaltyCardRow>
        Relationships: [
          {
            foreignKeyName: 'loyalty_cards_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'loyalty_cards_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'loyalty_cards_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'loyalty_programs'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: TransactionRow
        Insert: Partial<TransactionRow> & {
          merchant_id: string
          card_id: string
          type: 'earn' | 'redeem' | 'adjust'
          points_delta: number
        }
        Update: Partial<TransactionRow>
        Relationships: [
          {
            foreignKeyName: 'transactions_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'loyalty_cards'
            referencedColumns: ['id']
          },
        ]
      }
      apple_wallet_registrations: {
        Row: AppleWalletRegistrationRow
        Insert: Partial<AppleWalletRegistrationRow> & {
          card_id: string
          device_library_identifier: string
          push_token: string
        }
        Update: Partial<AppleWalletRegistrationRow>
        Relationships: [
          {
            foreignKeyName: 'apple_wallet_registrations_card_id_fkey'
            columns: ['card_id']
            isOneToOne: false
            referencedRelation: 'loyalty_cards'
            referencedColumns: ['id']
          },
        ]
      }
      card_preview_sessions: {
        Row: CardPreviewSessionRow
        Insert: Partial<CardPreviewSessionRow> & { merchant_id: string; payload: Json }
        Update: Partial<CardPreviewSessionRow>
        Relationships: [
          {
            foreignKeyName: 'card_preview_sessions_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: true
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
        ]
      }
      notification_campaigns: {
        Row: NotificationCampaignRow
        Insert: Partial<NotificationCampaignRow> & { merchant_id: string; message: string }
        Update: Partial<NotificationCampaignRow>
        Relationships: [
          {
            foreignKeyName: 'notification_campaigns_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
        ]
      }
      customer_purchase_habits: {
        Row: CustomerPurchaseHabitsRow
        Insert: Partial<CustomerPurchaseHabitsRow> & { customer_id: string; merchant_id: string }
        Update: Partial<CustomerPurchaseHabitsRow>
        Relationships: [
          {
            foreignKeyName: 'customer_purchase_habits_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: true
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'customer_purchase_habits_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
        ]
      }
      pos_transaction_events: {
        Row: PosTransactionEventRow
        Insert: Partial<PosTransactionEventRow> & { merchant_id: string; payload: Json }
        Update: Partial<PosTransactionEventRow>
        Relationships: [
          {
            foreignKeyName: 'pos_transaction_events_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pos_transaction_events_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      notification_templates: {
        Row: NotificationTemplateRow
        Insert: Partial<NotificationTemplateRow> & { merchant_id: string; name: string; title_template: string; body_template: string }
        Update: Partial<NotificationTemplateRow>
        Relationships: [
          {
            foreignKeyName: 'notification_templates_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
        ]
      }
      notification_deliveries: {
        Row: NotificationDeliveryRow
        Insert: Partial<NotificationDeliveryRow> & {
          merchant_id: string
          customer_id: string
          platform: 'apple' | 'google'
          message_text: string
        }
        Update: Partial<NotificationDeliveryRow>
        Relationships: [
          {
            foreignKeyName: 'notification_deliveries_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'notification_campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_deliveries_merchant_id_fkey'
            columns: ['merchant_id']
            isOneToOne: false
            referencedRelation: 'merchants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_deliveries_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
