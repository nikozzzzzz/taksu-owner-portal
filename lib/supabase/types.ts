export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      owners: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          email_verified: boolean;
          full_name: string;
          passport_number: string | null;
          passport_country: string | null;
          date_of_birth: string | null;
          country_of_residence: string;
          tax_residency_country: string;
          role: 'root' | 'admin' | 'accountant' | 'investor' | 'service' | 'guest';
          npwp_indonesia: string | null;
          dgt1_status: 'valid' | 'expired' | 'pending_review' | 'none';
          dgt1_valid_until: string | null;
          dgt1_document_url: string | null;
          dgt1_uploaded_at: string | null;
          dgt1_verified_at: string | null;
          dgt1_verified_by_id: string | null;
          pph26_effective_rate: number;
          bank_name: string | null;
          bank_account_iban: string | null;
          bank_account_swift: string | null;
          bank_account_holder: string | null;
          bank_address: string | null;
          payout_currency: 'USD' | 'EUR' | 'AUD' | 'GBP' | 'SGD';
          banking_last_changed_at: string | null;
          banking_last_changed_by_id: string | null;
          preferred_language: string;
          citizenship: string | null;
          passport_issue_date: string | null;
          passport_expiry_date: string | null;
          passport_document_url: string | null;
          npwp_document_url: string | null;
          tin_number: string | null;
          tin_document_url: string | null;
          registration_address: string | null;
          actual_address: string | null;
          phone_whatsapp: string | null;
          phone_telegram: string | null;
          dgt1_issue_date: string | null;
          p3b_treaty_number: string | null;
          p3b_document_url: string | null;
          bank_country: string | null;
          intermediary_bank_details: Json | null;
          alternative_payment_details: Json | null;
          crypto_wallet_address: string | null;
          crypto_network: string | null;
          statement_email: string | null;
          report_frequency: Database['public']['Enums']['report_frequency'] | null;
          statement_language: string | null;
          booking_notifications_enabled: boolean | null;
          dgt1_notifications_enabled: boolean | null;
          management_agreement_signed_at: string | null;
          management_agreement_expires_at: string | null;
          management_agreement_document_url: string | null;
          last_login_at: string | null;
          total_logins: number;
          status: 'active' | 'suspended' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['owners']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['owners']['Insert']>;
      };
      villas: {
        Row: {
          id: string;
          internal_code: string;
          display_name: string;
          villa_type: 'studio' | '1br' | '2br' | '3br' | '1br_l' | '1br_xl' | '2br_l' | '2br_xl' | '4br';
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          has_private_pool: boolean;
          view_type: string | null;
          square_meters: number | null;
          phase: number;
          ownership_type: 'investor_owned' | 'pt_owned';
          owner_id: string | null;
          pool_id: string | null;
          hostaway_listing_id: number | null;
          base_price_usd: number | null;
          premium_multiplier: number;
          estimated_market_value_usd: number | null;
          estimated_capex_usd: number | null;
          land_area_sqm: number | null;
          build_year: number | null;
          physical_address: string | null;
          google_maps_url: string | null;
          photo_urls: Json | null;
          amenities: Json | null;
          smart_lock_id: string | null;
          cadastral_number: string | null;
          pbg_number: string | null;
          pbg_document_url: string | null;
          slf_number: string | null;
          slf_status: Database['public']['Enums']['slf_status'] | null;
          slf_issue_date: string | null;
          slf_expiry_date: string | null;
          slf_document_url: string | null;
          pln_id: string | null;
          pln_tariff: string | null;
          pdam_id: string | null;
          water_source: string | null;
          pricelabs_id: string | null;
          turno_id: string | null;
          airbnb_id: string | null;
          booking_com_id: string | null;
          wifi_network: string | null;
          wifi_password: string | null;
          default_management_fee_rate: number | null;
          min_payout_threshold_usd: number | null;
          owner_nights_limit_per_year: number | null;
          start_float_usd: number | null;
          payout_type: Database['public']['Enums']['payout_type'] | null;
          status: 'pre_launch' | 'active' | 'maintenance' | 'paused' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['villas']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['villas']['Insert']>;
      };
      pools: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          villa_type: 'studio' | '1br' | '2br' | '3br' | '1br_l' | '1br_xl' | '2br_l' | '2br_xl' | '4br';
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pools']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['pools']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          hostaway_reservation_id: string | null;
          villa_id: string;
          pool_id: string | null;
          pool_assignment_method: string | null;
          pool_assignment_score: number | null;
          check_in_date: string;
          check_out_date: string;
          nights: number;
          guest_full_name: string;
          guest_initials: string;
          guest_country: string | null;
          guest_email: string | null;
          guest_phone: string | null;
          guests_count: number;
          channel: 'airbnb' | 'booking' | 'agoda' | 'expedia' | 'direct' | 'other';
          channel_reservation_code: string | null;
          total_paid_by_guest_usd: number;
          channel_commission_usd: number;
          phr_tax_usd: number;
          net_to_villa_usd: number;
          status: string;
          booked_at: string;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['bookings']['Row'],
          'nights' | 'guest_initials' | 'net_to_villa_usd' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      monthly_statements: {
        Row: {
          id: string;
          villa_id: string;
          owner_id: string;
          billing_month: string;
          gross_revenue_usd: number;
          revenue_by_channel: Json;
          channel_commission_usd: number;
          phr_tax_usd: number;
          net_revenue_usd: number;
          total_opex_usd: number;
          opex_breakdown: Json;
          net_profit_usd: number;
          management_fee_usd: number;
          management_fee_rate: number;
          owner_gross_payout_usd: number;
          pph26_rate: number;
          pph26_amount_usd: number;
          owner_net_payout_usd: number;
          bookings_count: number;
          occupied_nights: number;
          available_nights: number;
          occupancy_rate: number;
          adr_usd: number | null;
          revpar_usd: number | null;
          statement_pdf_url: string | null;
          bukti_potong_pdf_url: string | null;
          excel_export_url: string | null;
          status:
            | 'draft'
            | 'awaiting_admin_approval'
            | 'approved'
            | 'sent_to_owner'
            | 'paid'
            | 'disputed';
          approved_at: string | null;
          approved_by_id: string | null;
          sent_to_owner_at: string | null;
          payment_scheduled_at: string | null;
          payment_sent_at: string | null;
          payment_reference: string | null;
          payment_proof_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['monthly_statements']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['monthly_statements']['Insert']>;
      };
      operating_expenses: {
        Row: {
          id: string;
          villa_id: string;
          statement_id: string | null;
          category: string;
          subcategory: string | null;
          description: string;
          amount_usd: number;
          amount_idr: number | null;
          fx_rate: number | null;
          receipt_urls: string[];
          vendor_name: string | null;
          invoice_number: string | null;
          added_by_id: string;
          approval_status: string;
          expense_date: string;
          billing_month: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['operating_expenses']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['operating_expenses']['Insert']>;
      };
      owner_requests: {
        Row: {
          id: string;
          owner_id: string;
          villa_id: string | null;
          category:
            | 'personal_stay'
            | 'maintenance_request'
            | 'amenity_addition'
            | 'pricing_inquiry'
            | 'payout_inquiry'
            | 'document_request'
            | 'contract_inquiry'
            | 'general';
          subject: string;
          description: string;
          preferred_dates_start: string | null;
          preferred_dates_end: string | null;
          attachments: string[];
          status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';
          priority: 'low' | 'normal' | 'high' | 'urgent';
          assigned_to_id: string | null;
          assigned_at: string | null;
          admin_response: string | null;
          resolved_at: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['owner_requests']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['owner_requests']['Insert']>;
      };
      request_comments: {
        Row: {
          id: string;
          request_id: string;
          author_type: 'owner' | 'admin';
          author_id: string;
          content: string;
          attachments: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['request_comments']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['request_comments']['Insert']>;
      };
      owner_documents: {
        Row: {
          id: string;
          owner_id: string;
          villa_id: string | null;
          document_type:
            | 'management_agreement'
            | 'dgt1'
            | 'bukti_potong_pph26'
            | 'monthly_statement'
            | 'annual_tax_summary'
            | 'property_insurance'
            | 'leasehold_agreement'
            | 'pbg_certificate'
            | 'slf_certificate'
            | 'tdup_license'
            | 'other';
          title: string;
          description: string | null;
          file_url: string;
          file_size_bytes: number | null;
          file_mime_type: string | null;
          valid_from: string | null;
          valid_until: string | null;
          download_count: number;
          last_downloaded_at: string | null;
          visible_to_owner: boolean;
          created_at: string;
          uploaded_by_id: string | null;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['owner_documents']['Row'],
          'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['owner_documents']['Insert']>;
      };
      pool_rotation_state: {
        Row: {
          id: string;
          pool_id: string;
          villa_id: string;
          revenue_last_90_days_usd: number;
          nights_booked_last_90_days: number;
          priority_score: number;
          fair_share_metric: number;
          last_booking_at: string | null;
          last_calculated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pool_rotation_state']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['pool_rotation_state']['Insert']>;
      };
      owner_portal_audit: {
        Row: {
          id: string;
          owner_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          changes: Json | null;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['owner_portal_audit']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      villa_agreements: {
        Row: {
          id: string;
          villa_id: string;
          owner_id: string;
          hak_sewa_number: string | null;
          hak_sewa_start_date: string | null;
          hak_sewa_end_date: string | null;
          hak_sewa_document_url: string | null;
          hak_sewa_extension_terms: string | null;
          annual_rent_amount: number | null;
          management_agreement_number: string | null;
          ma_signed_date: string | null;
          ma_document_url: string | null;
          ma_term_months: number | null;
          pbb_tax_amount: number | null;
          status: 'active' | 'expired' | 'terminated';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['villa_agreements']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['villa_agreements']['Insert']>;
      };
    };
    Views: {
      v_bookings_anonymized: {
        Row: {
          id: string;
          villa_id: string;
          pool_id: string | null;
          check_in_date: string;
          check_out_date: string;
          nights: number;
          guest_initials: string;
          guest_country: string | null;
          guests_count: number;
          channel: 'airbnb' | 'booking' | 'agoda' | 'expedia' | 'direct' | 'other';
          total_paid_by_guest_usd: number;
          channel_commission_usd: number;
          phr_tax_usd: number;
          net_to_villa_usd: number;
          status: string;
          booked_at: string;
          guest_full_name: null;
          guest_email: null;
          guest_phone: null;
        };
      };
    };
    Functions: {
      current_owner_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_owner_dashboard: {
        Args: { p_owner_id: string };
        Returns: Json;
      };
    };
    Enums: {
      owner_status: 'active' | 'suspended' | 'closed';
      dgt1_status: 'valid' | 'expired' | 'pending_review' | 'none';
      payout_currency: 'USD' | 'EUR' | 'AUD' | 'GBP' | 'SGD';
      statement_status:
        | 'draft'
        | 'awaiting_admin_approval'
        | 'approved'
        | 'sent_to_owner'
        | 'paid'
        | 'disputed';
      booking_channel: 'airbnb' | 'booking' | 'agoda' | 'expedia' | 'direct' | 'other';
      request_category:
        | 'personal_stay'
        | 'maintenance_request'
        | 'amenity_addition'
        | 'pricing_inquiry'
        | 'payout_inquiry'
        | 'document_request'
        | 'contract_inquiry'
        | 'general';
      request_status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';
      request_priority: 'low' | 'normal' | 'high' | 'urgent';
      document_type:
        | 'management_agreement'
        | 'dgt1'
        | 'bukti_potong_pph26'
        | 'monthly_statement'
        | 'annual_tax_summary'
        | 'property_insurance'
        | 'leasehold_agreement'
        | 'pbg_certificate'
        | 'slf_certificate'
        | 'tdup_license'
        | 'other';
      villa_type: 'studio' | '1br' | '2br' | '3br' | '1br_l' | '1br_xl' | '2br_l' | '2br_xl' | '4br';
      villa_status: 'pre_launch' | 'active' | 'maintenance' | 'paused' | 'closed';
      slf_status: 'received' | 'in_progress' | 'not_submitted';
      payout_type: 'net_profit_share' | 'gross';
      agreement_status: 'active' | 'expired' | 'terminated';
      report_frequency: 'monthly' | 'quarterly';
    };
  };
}
