export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_report_mapping: {
        Row: {
          account_id: string
          created_at: string
          id: number
          mandant_id: string
          mapping_source: string
          report_line_id: number
          skr_version: string
          tag: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: number
          mandant_id: string
          mapping_source: string
          report_line_id: number
          skr_version: string
          tag?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: number
          mandant_id?: string
          mapping_source?: string
          report_line_id?: number
          skr_version?: string
          tag?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_report_mapping_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_report_mapping_report_line_id_fkey"
            columns: ["report_line_id"]
            isOneToOne: false
            referencedRelation: "report_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          bezeichnung: string
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_wechselkonto: boolean
          kategorie: string
          konto_nr: string
          owner_id: string | null
          skr: string
          skr_version: string | null
          tags: string[] | null
          updated_at: string
          updated_by: string | null
          ust_satz: number | null
        }
        Insert: {
          bezeichnung: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_wechselkonto?: boolean
          kategorie: string
          konto_nr: string
          owner_id?: string | null
          skr?: string
          skr_version?: string | null
          tags?: string[] | null
          updated_at?: string
          updated_by?: string | null
          ust_satz?: number | null
        }
        Update: {
          bezeichnung?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_wechselkonto?: boolean
          kategorie?: string
          konto_nr?: string
          owner_id?: string | null
          skr?: string
          skr_version?: string | null
          tags?: string[] | null
          updated_at?: string
          updated_by?: string | null
          ust_satz?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_notes: {
        Row: {
          author_email: string | null
          author_user_id: string | null
          body: string
          client_id: string | null
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          author_email?: string | null
          author_user_id?: string | null
          body: string
          client_id?: string | null
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          author_email?: string | null
          author_user_id?: string | null
          body?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      afa_buchungen: {
        Row: {
          afa_betrag: number
          anlage_id: string
          created_at: string
          id: string
          jahr: number
          journal_entry_id: string | null
          restbuchwert: number
        }
        Insert: {
          afa_betrag: number
          anlage_id: string
          created_at?: string
          id?: string
          jahr: number
          journal_entry_id?: string | null
          restbuchwert: number
        }
        Update: {
          afa_betrag?: number
          anlage_id?: string
          created_at?: string
          id?: string
          jahr?: number
          journal_entry_id?: string | null
          restbuchwert?: number
        }
        Relationships: [
          {
            foreignKeyName: "afa_buchungen_anlage_id_fkey"
            columns: ["anlage_id"]
            isOneToOne: false
            referencedRelation: "anlagegueter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afa_buchungen_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      anlagegueter: {
        Row: {
          abgangsdatum: string | null
          abgangserloes: number | null
          afa_methode: string
          aktiv: boolean
          anschaffungsdatum: string
          anschaffungskosten: number
          bezeichnung: string
          client_id: string | null
          company_id: string
          created_at: string
          id: string
          inventar_nr: string
          konto_abschreibung_kumuliert: string | null
          konto_afa: string
          konto_anlage: string
          notizen: string | null
          nutzungsdauer_jahre: number
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          abgangsdatum?: string | null
          abgangserloes?: number | null
          afa_methode?: string
          aktiv?: boolean
          anschaffungsdatum: string
          anschaffungskosten: number
          bezeichnung: string
          client_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          inventar_nr: string
          konto_abschreibung_kumuliert?: string | null
          konto_afa: string
          konto_anlage: string
          notizen?: string | null
          nutzungsdauer_jahre: number
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          abgangsdatum?: string | null
          abgangserloes?: number | null
          afa_methode?: string
          aktiv?: boolean
          anschaffungsdatum?: string
          anschaffungskosten?: number
          bezeichnung?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          inventar_nr?: string
          konto_abschreibung_kumuliert?: string | null
          konto_afa?: string
          konto_anlage?: string
          notizen?: string | null
          nutzungsdauer_jahre?: number
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anlagegueter_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anlagegueter_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anlagegueter_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "anlagegueter"
            referencedColumns: ["id"]
          },
        ]
      }
      app_logs: {
        Row: {
          at: string
          company_id: string | null
          context: Json | null
          id: string
          level: string
          message: string
          user_id: string | null
        }
        Insert: {
          at?: string
          company_id?: string | null
          context?: Json | null
          id?: string
          level: string
          message: string
          user_id?: string | null
        }
        Update: {
          at?: string
          company_id?: string | null
          context?: Json | null
          id?: string
          level?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          at: string
          before: Json | null
          company_id: string | null
          created_by: string | null
          entity: string
          entity_id: string | null
          hash: string
          id: string
          owner_id: string | null
          prev_hash: string
          summary: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          company_id?: string | null
          created_by?: string | null
          entity: string
          entity_id?: string | null
          hash?: string
          id?: string
          owner_id?: string | null
          prev_hash?: string
          summary: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          at?: string
          before?: Json | null
          company_id?: string | null
          created_by?: string | null
          entity?: string
          entity_id?: string | null
          hash?: string
          id?: string
          owner_id?: string | null
          prev_hash?: string
          summary?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation_matches: {
        Row: {
          bank_transaction_fingerprint: string
          bank_transaction_id: string
          client_id: string
          company_id: string
          created_at: string
          id: string
          journal_entry_id: string | null
          match_confidence: number | null
          match_status: string
          matched_at: string
          matched_by_user_id: string | null
          notiz: string | null
          updated_at: string
        }
        Insert: {
          bank_transaction_fingerprint: string
          bank_transaction_id: string
          client_id: string
          company_id: string
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          match_confidence?: number | null
          match_status: string
          matched_at?: string
          matched_by_user_id?: string | null
          notiz?: string | null
          updated_at?: string
        }
        Update: {
          bank_transaction_fingerprint?: string
          bank_transaction_id?: string
          client_id?: string
          company_id?: string
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          match_confidence?: number | null
          match_status?: string
          matched_at?: string
          matched_by_user_id?: string | null
          notiz?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_matches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_matches_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      beleg_positionen: {
        Row: {
          beleg_id: string
          betrag: number
          id: string
          konto: string
          position: number
          soll_haben: string
          text: string | null
          ust_satz: number | null
        }
        Insert: {
          beleg_id: string
          betrag: number
          id?: string
          konto: string
          position: number
          soll_haben: string
          text?: string | null
          ust_satz?: number | null
        }
        Update: {
          beleg_id?: string
          betrag?: number
          id?: string
          konto?: string
          position?: number
          soll_haben?: string
          text?: string | null
          ust_satz?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "beleg_positionen_beleg_id_fkey"
            columns: ["beleg_id"]
            isOneToOne: false
            referencedRelation: "belege"
            referencedColumns: ["id"]
          },
        ]
      }
      belege: {
        Row: {
          belegart: string
          belegdatei_path: string | null
          belegdatum: string
          belegnummer: string
          beschreibung: string
          brutto: number | null
          buchungsdatum: string
          business_partner_id: string | null
          business_partner_version_id: string | null
          company_id: string
          erfasst_am: string
          erfasst_von: string | null
          id: string
          ist_ig_lieferung: boolean
          ist_reverse_charge: boolean
          journal_entry_ids: string[]
          leistungsdatum: string | null
          mandant_id: string | null
          netto: number | null
          partner_adresse: string | null
          partner_konto_nr: string | null
          partner_land: string | null
          partner_name: string
          partner_ustid: string | null
          skonto_prozent: number | null
          status: string
          steuerbetrag: number | null
          storniert_am: string | null
          storno_grund: string | null
          updated_am: string
          waehrung: string
          zahlungsart: string | null
          zahlungsbetrag: number | null
          zahlungsdatum: string | null
        }
        Insert: {
          belegart: string
          belegdatei_path?: string | null
          belegdatum: string
          belegnummer: string
          beschreibung?: string
          brutto?: number | null
          buchungsdatum: string
          business_partner_id?: string | null
          business_partner_version_id?: string | null
          company_id: string
          erfasst_am?: string
          erfasst_von?: string | null
          id?: string
          ist_ig_lieferung?: boolean
          ist_reverse_charge?: boolean
          journal_entry_ids?: string[]
          leistungsdatum?: string | null
          mandant_id?: string | null
          netto?: number | null
          partner_adresse?: string | null
          partner_konto_nr?: string | null
          partner_land?: string | null
          partner_name?: string
          partner_ustid?: string | null
          skonto_prozent?: number | null
          status?: string
          steuerbetrag?: number | null
          storniert_am?: string | null
          storno_grund?: string | null
          updated_am?: string
          waehrung?: string
          zahlungsart?: string | null
          zahlungsbetrag?: number | null
          zahlungsdatum?: string | null
        }
        Update: {
          belegart?: string
          belegdatei_path?: string | null
          belegdatum?: string
          belegnummer?: string
          beschreibung?: string
          brutto?: number | null
          buchungsdatum?: string
          business_partner_id?: string | null
          business_partner_version_id?: string | null
          company_id?: string
          erfasst_am?: string
          erfasst_von?: string | null
          id?: string
          ist_ig_lieferung?: boolean
          ist_reverse_charge?: boolean
          journal_entry_ids?: string[]
          leistungsdatum?: string | null
          mandant_id?: string | null
          netto?: number | null
          partner_adresse?: string | null
          partner_konto_nr?: string | null
          partner_land?: string | null
          partner_name?: string
          partner_ustid?: string | null
          skonto_prozent?: number | null
          status?: string
          steuerbetrag?: number | null
          storniert_am?: string | null
          storno_grund?: string | null
          updated_am?: string
          waehrung?: string
          zahlungsart?: string | null
          zahlungsbetrag?: number | null
          zahlungsdatum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "belege_business_partner_id_fkey"
            columns: ["business_partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belege_business_partner_version_id_fkey"
            columns: ["business_partner_version_id"]
            isOneToOne: false
            referencedRelation: "business_partners_versions"
            referencedColumns: ["version_id"]
          },
          {
            foreignKeyName: "belege_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_partners: {
        Row: {
          anschrift_hausnummer: string | null
          anschrift_land_iso: string | null
          anschrift_ort: string | null
          anschrift_plz: string | null
          anschrift_strasse: string | null
          bic: string | null
          client_id: string
          company_id: string
          created_at: string
          created_by: string | null
          debitor_nummer: number | null
          email: string | null
          finanzamt: string | null
          hrb: string | null
          iban: string | null
          id: string
          is_active: boolean
          is_public_authority: boolean
          kreditor_nummer: number | null
          legal_name: string | null
          leitweg_id: string | null
          name: string
          notes: string | null
          partner_type: string
          peppol_id: string | null
          preferred_invoice_format: string
          rechtsform: string | null
          registergericht: string | null
          skonto_prozent: number | null
          skonto_tage: number | null
          standard_aufwandskonto: string | null
          standard_erloeskonto: string | null
          steuernummer: string | null
          telefon: string | null
          updated_at: string
          updated_by: string | null
          ust_idnr: string | null
          verrechnungs_partner_id: string | null
          zahlungsziel_tage: number | null
        }
        Insert: {
          anschrift_hausnummer?: string | null
          anschrift_land_iso?: string | null
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          bic?: string | null
          client_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          debitor_nummer?: number | null
          email?: string | null
          finanzamt?: string | null
          hrb?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          is_public_authority?: boolean
          kreditor_nummer?: number | null
          legal_name?: string | null
          leitweg_id?: string | null
          name: string
          notes?: string | null
          partner_type: string
          peppol_id?: string | null
          preferred_invoice_format?: string
          rechtsform?: string | null
          registergericht?: string | null
          skonto_prozent?: number | null
          skonto_tage?: number | null
          standard_aufwandskonto?: string | null
          standard_erloeskonto?: string | null
          steuernummer?: string | null
          telefon?: string | null
          updated_at?: string
          updated_by?: string | null
          ust_idnr?: string | null
          verrechnungs_partner_id?: string | null
          zahlungsziel_tage?: number | null
        }
        Update: {
          anschrift_hausnummer?: string | null
          anschrift_land_iso?: string | null
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          bic?: string | null
          client_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          debitor_nummer?: number | null
          email?: string | null
          finanzamt?: string | null
          hrb?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          is_public_authority?: boolean
          kreditor_nummer?: number | null
          legal_name?: string | null
          leitweg_id?: string | null
          name?: string
          notes?: string | null
          partner_type?: string
          peppol_id?: string | null
          preferred_invoice_format?: string
          rechtsform?: string | null
          registergericht?: string | null
          skonto_prozent?: number | null
          skonto_tage?: number | null
          standard_aufwandskonto?: string | null
          standard_erloeskonto?: string | null
          steuernummer?: string | null
          telefon?: string | null
          updated_at?: string
          updated_by?: string | null
          ust_idnr?: string | null
          verrechnungs_partner_id?: string | null
          zahlungsziel_tage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_partners_verrechnungs_partner_id_fkey"
            columns: ["verrechnungs_partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      business_partners_versions: {
        Row: {
          aufbewahrungs_kategorie: string
          client_id: string
          company_id: string
          created_at: string
          created_by: string | null
          entstehungsjahr: number
          partner_id: string
          prev_hash: string | null
          retention_hold: boolean
          retention_hold_reason: string | null
          retention_until: string
          server_recorded_at: string
          snapshot: Json
          valid_from: string
          valid_to: string | null
          version_hash: string | null
          version_id: string
          version_number: number
        }
        Insert: {
          aufbewahrungs_kategorie?: string
          client_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          entstehungsjahr: number
          partner_id: string
          prev_hash?: string | null
          retention_hold?: boolean
          retention_hold_reason?: string | null
          retention_until: string
          server_recorded_at?: string
          snapshot: Json
          valid_from: string
          valid_to?: string | null
          version_hash?: string | null
          version_id?: string
          version_number: number
        }
        Update: {
          aufbewahrungs_kategorie?: string
          client_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          entstehungsjahr?: number
          partner_id?: string
          prev_hash?: string | null
          retention_hold?: boolean
          retention_hold_reason?: string | null
          retention_until?: string
          server_recorded_at?: string
          snapshot?: Json
          valid_from?: string
          valid_to?: string | null
          version_hash?: string | null
          version_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_partners_versions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          anschrift_hausnummer: string | null
          anschrift_land: string
          anschrift_ort: string | null
          anschrift_plz: string | null
          anschrift_strasse: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          geschaeftsfuehrer: Json | null
          gezeichnetes_kapital: number | null
          hrb_gericht: string | null
          hrb_nummer: string | null
          id: string
          mandant_nr: string
          name: string
          owner_id: string | null
          rechtsform: string | null
          steuernummer: string | null
          updated_at: string
          updated_by: string | null
          wirtschaftsjahr_beginn: string | null
          wirtschaftsjahr_ende: string | null
        }
        Insert: {
          anschrift_hausnummer?: string | null
          anschrift_land?: string
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          geschaeftsfuehrer?: Json | null
          gezeichnetes_kapital?: number | null
          hrb_gericht?: string | null
          hrb_nummer?: string | null
          id?: string
          mandant_nr: string
          name: string
          owner_id?: string | null
          rechtsform?: string | null
          steuernummer?: string | null
          updated_at?: string
          updated_by?: string | null
          wirtschaftsjahr_beginn?: string | null
          wirtschaftsjahr_ende?: string | null
        }
        Update: {
          anschrift_hausnummer?: string | null
          anschrift_land?: string
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          geschaeftsfuehrer?: Json | null
          gezeichnetes_kapital?: number | null
          hrb_gericht?: string | null
          hrb_nummer?: string | null
          id?: string
          mandant_nr?: string
          name?: string
          owner_id?: string | null
          rechtsform?: string | null
          steuernummer?: string | null
          updated_at?: string
          updated_by?: string | null
          wirtschaftsjahr_beginn?: string | null
          wirtschaftsjahr_ende?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          anschrift_ort: string | null
          anschrift_plz: string | null
          anschrift_strasse: string | null
          bic: string | null
          created_at: string
          created_by: string | null
          email: string | null
          iban: string | null
          id: string
          name: string
          slug: string
          steuernummer: string | null
          telefon: string | null
          updated_at: string
          ust_id: string | null
        }
        Insert: {
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          bic?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          name: string
          slug: string
          steuernummer?: string | null
          telefon?: string | null
          updated_at?: string
          ust_id?: string | null
        }
        Update: {
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          bic?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          name?: string
          slug?: string
          steuernummer?: string | null
          telefon?: string | null
          updated_at?: string
          ust_id?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          access_valid_until: string | null
          company_id: string
          created_at: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          access_valid_until?: string | null
          company_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          access_valid_until?: string | null
          company_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consents: {
        Row: {
          categories: Json
          consented_at: string
          id: string
          ip_hash: string | null
          policy_version: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          withdrawn_at: string | null
        }
        Insert: {
          categories: Json
          consented_at?: string
          id?: string
          ip_hash?: string | null
          policy_version: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          categories?: Json
          consented_at?: string
          id?: string
          ip_hash?: string | null
          policy_version?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      cost_carriers: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_carriers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          beleg_nr: string | null
          client_id: string | null
          company_id: string | null
          created_by: string | null
          file_name: string
          file_path: string | null
          id: string
          journal_entry_id: string | null
          mime_type: string
          ocr_text: string | null
          owner_id: string | null
          size_bytes: number
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          beleg_nr?: string | null
          client_id?: string | null
          company_id?: string | null
          created_by?: string | null
          file_name: string
          file_path?: string | null
          id?: string
          journal_entry_id?: string | null
          mime_type: string
          ocr_text?: string | null
          owner_id?: string | null
          size_bytes: number
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          beleg_nr?: string | null
          client_id?: string | null
          company_id?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string | null
          id?: string
          journal_entry_id?: string | null
          mime_type?: string
          ocr_text?: string | null
          owner_id?: string | null
          size_bytes?: number
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      dunning_records: {
        Row: {
          beleg_nr: string
          betrag_offen: number
          client_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          faelligkeit_alt: string
          faelligkeit_neu: string
          fee: number
          gegenseite: string
          id: string
          issued_at: string
          stage: number
          ueberfaellig_tage_bei_mahnung: number
          verzugszinsen: number
        }
        Insert: {
          beleg_nr: string
          betrag_offen: number
          client_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          faelligkeit_alt: string
          faelligkeit_neu: string
          fee?: number
          gegenseite?: string
          id?: string
          issued_at?: string
          stage: number
          ueberfaellig_tage_bei_mahnung?: number
          verzugszinsen?: number
        }
        Update: {
          beleg_nr?: string
          betrag_offen?: number
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          faelligkeit_alt?: string
          faelligkeit_neu?: string
          fee?: number
          gegenseite?: string
          id?: string
          issued_at?: string
          stage?: number
          ueberfaellig_tage_bei_mahnung?: number
          verzugszinsen?: number
        }
        Relationships: [
          {
            foreignKeyName: "dunning_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dunning_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      elster_submissions: {
        Row: {
          acknowledged_at: string | null
          client_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          file_bytes: number | null
          file_sha256: string | null
          form_type: string
          id: string
          label: string
          notes: string | null
          period: number | null
          status: string
          transfer_ticket: string | null
          transmitted_at: string | null
          year: number
        }
        Insert: {
          acknowledged_at?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          file_bytes?: number | null
          file_sha256?: string | null
          form_type: string
          id?: string
          label: string
          notes?: string | null
          period?: number | null
          status?: string
          transfer_ticket?: string | null
          transmitted_at?: string | null
          year: number
        }
        Update: {
          acknowledged_at?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          file_bytes?: number | null
          file_sha256?: string | null
          form_type?: string
          id?: string
          label?: string
          notes?: string | null
          period?: number | null
          status?: string
          transfer_ticket?: string | null
          transmitted_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "elster_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elster_submissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          anschrift_hausnummer: string | null
          anschrift_land: string
          anschrift_ort: string | null
          anschrift_plz: string | null
          anschrift_strasse: string | null
          austrittsdatum: string | null
          beschaeftigungsart: string
          bic: string | null
          bruttogehalt_monat: number | null
          bundesland: string | null
          client_id: string | null
          company_id: string
          created_at: string
          einstellungsdatum: string | null
          einzugsstelle_bbnr: string | null
          geburtsname: string | null
          geburtsort: string | null
          iban: string | null
          id: string
          is_active: boolean
          kinderfreibetraege: number
          konfession: string | null
          kontoinhaber: string | null
          krankenkasse: string | null
          mehrfachbeschaeftigung: boolean
          nachname: string
          notes: string | null
          personalnummer: string
          privat_versichert: boolean
          pv_kinder_anzahl: number
          pv_kinderlos: boolean
          staatsangehoerigkeit: string | null
          steuer_id: string | null
          steuerklasse: string
          stundenlohn: number | null
          sv_nummer: string | null
          taetigkeitsschluessel: string | null
          updated_at: string
          vorname: string
          wochenstunden: number | null
          zusatzbeitrag_pct: number | null
        }
        Insert: {
          anschrift_hausnummer?: string | null
          anschrift_land?: string
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          austrittsdatum?: string | null
          beschaeftigungsart?: string
          bic?: string | null
          bruttogehalt_monat?: number | null
          bundesland?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          einstellungsdatum?: string | null
          einzugsstelle_bbnr?: string | null
          geburtsname?: string | null
          geburtsort?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          kinderfreibetraege?: number
          konfession?: string | null
          kontoinhaber?: string | null
          krankenkasse?: string | null
          mehrfachbeschaeftigung?: boolean
          nachname: string
          notes?: string | null
          personalnummer: string
          privat_versichert?: boolean
          pv_kinder_anzahl?: number
          pv_kinderlos?: boolean
          staatsangehoerigkeit?: string | null
          steuer_id?: string | null
          steuerklasse?: string
          stundenlohn?: number | null
          sv_nummer?: string | null
          taetigkeitsschluessel?: string | null
          updated_at?: string
          vorname: string
          wochenstunden?: number | null
          zusatzbeitrag_pct?: number | null
        }
        Update: {
          anschrift_hausnummer?: string | null
          anschrift_land?: string
          anschrift_ort?: string | null
          anschrift_plz?: string | null
          anschrift_strasse?: string | null
          austrittsdatum?: string | null
          beschaeftigungsart?: string
          bic?: string | null
          bruttogehalt_monat?: number | null
          bundesland?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          einstellungsdatum?: string | null
          einzugsstelle_bbnr?: string | null
          geburtsname?: string | null
          geburtsort?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean
          kinderfreibetraege?: number
          konfession?: string | null
          kontoinhaber?: string | null
          krankenkasse?: string | null
          mehrfachbeschaeftigung?: boolean
          nachname?: string
          notes?: string | null
          personalnummer?: string
          privat_versichert?: boolean
          pv_kinder_anzahl?: number
          pv_kinderlos?: boolean
          staatsangehoerigkeit?: string | null
          steuer_id?: string | null
          steuerklasse?: string
          stundenlohn?: number | null
          sv_nummer?: string | null
          taetigkeitsschluessel?: string | null
          updated_at?: string
          vorname?: string
          wochenstunden?: number | null
          zusatzbeitrag_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventur_anlagen: {
        Row: {
          abgangs_buchung_id: string | null
          anlage_id: string
          created_at: string
          geprueft_am: string | null
          geprueft_von: string | null
          id: string
          notiz: string | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          abgangs_buchung_id?: string | null
          anlage_id: string
          created_at?: string
          geprueft_am?: string | null
          geprueft_von?: string | null
          id?: string
          notiz?: string | null
          session_id: string
          status: string
          updated_at?: string
        }
        Update: {
          abgangs_buchung_id?: string | null
          anlage_id?: string
          created_at?: string
          geprueft_am?: string | null
          geprueft_von?: string | null
          id?: string
          notiz?: string | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventur_anlagen_abgangs_buchung_id_fkey"
            columns: ["abgangs_buchung_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventur_anlagen_anlage_id_fkey"
            columns: ["anlage_id"]
            isOneToOne: false
            referencedRelation: "anlagegueter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventur_anlagen_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventur_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventur_bestaende: {
        Row: {
          anfangsbestand: number
          bestandsveraenderungs_buchung_id: string | null
          bezeichnung: string
          created_at: string
          endbestand: number
          id: string
          inventurliste_document_id: string | null
          niederstwert_aktiv: boolean
          niederstwert_begruendung: string | null
          notiz: string | null
          session_id: string
          updated_at: string
          vorrat_konto_nr: string
        }
        Insert: {
          anfangsbestand?: number
          bestandsveraenderungs_buchung_id?: string | null
          bezeichnung: string
          created_at?: string
          endbestand: number
          id?: string
          inventurliste_document_id?: string | null
          niederstwert_aktiv?: boolean
          niederstwert_begruendung?: string | null
          notiz?: string | null
          session_id: string
          updated_at?: string
          vorrat_konto_nr: string
        }
        Update: {
          anfangsbestand?: number
          bestandsveraenderungs_buchung_id?: string | null
          bezeichnung?: string
          created_at?: string
          endbestand?: number
          id?: string
          inventurliste_document_id?: string | null
          niederstwert_aktiv?: boolean
          niederstwert_begruendung?: string | null
          notiz?: string | null
          session_id?: string
          updated_at?: string
          vorrat_konto_nr?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventur_bestaende_bestandsveraenderungs_buchung_id_fkey"
            columns: ["bestandsveraenderungs_buchung_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventur_bestaende_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventur_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventur_sessions: {
        Row: {
          abgeschlossen_am: string | null
          anlagen_inventur_abgeschlossen: boolean
          bestands_inventur_abgeschlossen: boolean
          client_id: string
          company_id: string
          created_at: string
          erstellt_am: string
          erstellt_von: string | null
          id: string
          jahr: number
          notiz: string | null
          status: string
          stichtag: string
          updated_at: string
        }
        Insert: {
          abgeschlossen_am?: string | null
          anlagen_inventur_abgeschlossen?: boolean
          bestands_inventur_abgeschlossen?: boolean
          client_id: string
          company_id: string
          created_at?: string
          erstellt_am?: string
          erstellt_von?: string | null
          id?: string
          jahr: number
          notiz?: string | null
          status?: string
          stichtag: string
          updated_at?: string
        }
        Update: {
          abgeschlossen_am?: string | null
          anlagen_inventur_abgeschlossen?: boolean
          bestands_inventur_abgeschlossen?: boolean
          client_id?: string
          company_id?: string
          created_at?: string
          erstellt_am?: string
          erstellt_von?: string | null
          id?: string
          jahr?: number
          notiz?: string | null
          status?: string
          stichtag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventur_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventur_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_archive: {
        Row: {
          client_id: string | null
          company_id: string
          content_b64: string | null
          content_sha256: string
          id: string
          journal_entry_id: string | null
          mime_type: string
          notes: string | null
          original_filename: string
          retention_until: string
          size_bytes: number
          source: string
          storage_path: string | null
          uploaded_at: string
          uploader_user_id: string | null
        }
        Insert: {
          client_id?: string | null
          company_id: string
          content_b64?: string | null
          content_sha256: string
          id?: string
          journal_entry_id?: string | null
          mime_type: string
          notes?: string | null
          original_filename: string
          retention_until: string
          size_bytes: number
          source: string
          storage_path?: string | null
          uploaded_at?: string
          uploader_user_id?: string | null
        }
        Update: {
          client_id?: string | null
          company_id?: string
          content_b64?: string | null
          content_sha256?: string
          id?: string
          journal_entry_id?: string | null
          mime_type?: string
          notes?: string | null
          original_filename?: string
          retention_until?: string
          size_bytes?: number
          source?: string
          storage_path?: string | null
          uploaded_at?: string
          uploader_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_archive_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_archive_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_xml_archive: {
        Row: {
          archive_id: string
          buyer_name: string | null
          client_id: string | null
          company_id: string
          created_at: string
          currency: string | null
          due_date: string | null
          format: string
          grand_total: number | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          net_total: number | null
          parsed_json: Json | null
          profile: string | null
          supplier_name: string | null
          supplier_vat_id: string | null
          tax_total: number | null
          xml_content: string
          xml_sha256: string
        }
        Insert: {
          archive_id: string
          buyer_name?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          currency?: string | null
          due_date?: string | null
          format: string
          grand_total?: number | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          net_total?: number | null
          parsed_json?: Json | null
          profile?: string | null
          supplier_name?: string | null
          supplier_vat_id?: string | null
          tax_total?: number | null
          xml_content: string
          xml_sha256: string
        }
        Update: {
          archive_id?: string
          buyer_name?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          currency?: string | null
          due_date?: string | null
          format?: string
          grand_total?: number | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          net_total?: number | null
          parsed_json?: Json | null
          profile?: string | null
          supplier_name?: string | null
          supplier_vat_id?: string | null
          tax_total?: number | null
          xml_content?: string
          xml_sha256?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_xml_archive_archive_id_fkey"
            columns: ["archive_id"]
            isOneToOne: false
            referencedRelation: "invoice_archive"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_xml_archive_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_xml_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          batch_id: string | null
          beleg_nr: string
          beschreibung: string
          betrag: number
          client_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          datum: string
          entry_hash: string | null
          faelligkeit: string | null
          gegenseite: string | null
          haben_konto: string
          id: string
          kostenstelle: string | null
          kostentraeger: string | null
          locked_at: string | null
          owner_id: string | null
          parent_entry_id: string | null
          prev_hash: string | null
          skonto_pct: number | null
          skonto_tage: number | null
          soll_konto: string
          status: string
          storno_status: string
          updated_at: string
          updated_by: string | null
          ust_satz: number | null
          version: number
        }
        Insert: {
          batch_id?: string | null
          beleg_nr: string
          beschreibung: string
          betrag: number
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          datum: string
          entry_hash?: string | null
          faelligkeit?: string | null
          gegenseite?: string | null
          haben_konto: string
          id?: string
          kostenstelle?: string | null
          kostentraeger?: string | null
          locked_at?: string | null
          owner_id?: string | null
          parent_entry_id?: string | null
          prev_hash?: string | null
          skonto_pct?: number | null
          skonto_tage?: number | null
          soll_konto: string
          status?: string
          storno_status?: string
          updated_at?: string
          updated_by?: string | null
          ust_satz?: number | null
          version?: number
        }
        Update: {
          batch_id?: string | null
          beleg_nr?: string
          beschreibung?: string
          betrag?: number
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          datum?: string
          entry_hash?: string | null
          faelligkeit?: string | null
          gegenseite?: string | null
          haben_konto?: string
          id?: string
          kostenstelle?: string | null
          kostentraeger?: string | null
          locked_at?: string | null
          owner_id?: string | null
          parent_entry_id?: string | null
          prev_hash?: string | null
          skonto_pct?: number | null
          skonto_tage?: number | null
          soll_konto?: string
          status?: string
          storno_status?: string
          updated_at?: string
          updated_by?: string | null
          ust_satz?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_parent_entry_id_fkey"
            columns: ["parent_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lohnabrechnungen_archiv: {
        Row: {
          abrechnung_json: Json
          abrechnungsmonat: string
          batch_id: string | null
          client_id: string | null
          company_id: string
          created_at: string
          employee_id: string
          gesamt_abzuege: number
          gesamt_ag_kosten: number
          gesamt_brutto: number
          gesamt_netto: number
          id: string
          lock_hash: string | null
          lock_reason: string | null
          locked: boolean
          locked_at: string | null
          locked_by: string | null
          unlock_history: Json
        }
        Insert: {
          abrechnung_json: Json
          abrechnungsmonat: string
          batch_id?: string | null
          client_id?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          gesamt_abzuege: number
          gesamt_ag_kosten: number
          gesamt_brutto: number
          gesamt_netto: number
          id?: string
          lock_hash?: string | null
          lock_reason?: string | null
          locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          unlock_history?: Json
        }
        Update: {
          abrechnung_json?: Json
          abrechnungsmonat?: string
          batch_id?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          gesamt_abzuege?: number
          gesamt_ag_kosten?: number
          gesamt_brutto?: number
          gesamt_netto?: number
          id?: string
          lock_hash?: string | null
          lock_reason?: string | null
          locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          unlock_history?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lohnabrechnungen_archiv_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lohnabrechnungen_archiv_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lohnabrechnungen_archiv_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      lohnarten: {
        Row: {
          aktiv: boolean
          bezeichnung: string
          buchungskonto_haben: string | null
          buchungskonto_soll: string | null
          client_id: string | null
          code: string
          company_id: string
          created_at: string
          id: string
          lst_meldung_feld: string
          steuerfrei_grund: string | null
          steuerpflichtig: boolean
          sv_frei_grund: string | null
          svpflichtig: boolean
          typ: string
          updated_at: string
        }
        Insert: {
          aktiv?: boolean
          bezeichnung: string
          buchungskonto_haben?: string | null
          buchungskonto_soll?: string | null
          client_id?: string | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          lst_meldung_feld: string
          steuerfrei_grund?: string | null
          steuerpflichtig?: boolean
          sv_frei_grund?: string | null
          svpflichtig?: boolean
          typ: string
          updated_at?: string
        }
        Update: {
          aktiv?: boolean
          bezeichnung?: string
          buchungskonto_haben?: string | null
          buchungskonto_soll?: string | null
          client_id?: string | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          lst_meldung_feld?: string
          steuerfrei_grund?: string | null
          steuerpflichtig?: boolean
          sv_frei_grund?: string | null
          svpflichtig?: boolean
          typ?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lohnarten_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lohnarten_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lohnbuchungen: {
        Row: {
          abrechnungsmonat: string
          beleg: string | null
          betrag: number
          buchungsdatum: string
          client_id: string | null
          company_id: string
          created_at: string
          employee_id: string
          id: string
          lohnart_id: string
          menge: number | null
          stunden: number | null
        }
        Insert: {
          abrechnungsmonat: string
          beleg?: string | null
          betrag: number
          buchungsdatum: string
          client_id?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          lohnart_id: string
          menge?: number | null
          stunden?: number | null
        }
        Update: {
          abrechnungsmonat?: string
          beleg?: string | null
          betrag?: number
          buchungsdatum?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          lohnart_id?: string
          menge?: number | null
          stunden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lohnbuchungen_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lohnbuchungen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lohnbuchungen_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lohnbuchungen_lohnart_id_fkey"
            columns: ["lohnart_id"]
            isOneToOne: false
            referencedRelation: "lohnarten"
            referencedColumns: ["id"]
          },
        ]
      }
      lsta_festschreibungen: {
        Row: {
          abgabefrist: string
          abgegeben_am: string | null
          abrechnungs_ids: string[]
          anmeldung_json: Json
          client_id: string | null
          company_id: string
          created_at: string
          elster_ref: string | null
          id: string
          kennzahlen_summe: number
          lock_hash: string
          locked_at: string
          locked_by: string | null
          zeitraum: string
          zeitraum_art: string
        }
        Insert: {
          abgabefrist: string
          abgegeben_am?: string | null
          abrechnungs_ids: string[]
          anmeldung_json: Json
          client_id?: string | null
          company_id: string
          created_at?: string
          elster_ref?: string | null
          id?: string
          kennzahlen_summe: number
          lock_hash: string
          locked_at?: string
          locked_by?: string | null
          zeitraum: string
          zeitraum_art: string
        }
        Update: {
          abgabefrist?: string
          abgegeben_am?: string | null
          abrechnungs_ids?: string[]
          anmeldung_json?: Json
          client_id?: string | null
          company_id?: string
          created_at?: string
          elster_ref?: string | null
          id?: string
          kennzahlen_summe?: number
          lock_hash?: string
          locked_at?: string
          locked_by?: string | null
          zeitraum?: string
          zeitraum_art?: string
        }
        Relationships: [
          {
            foreignKeyName: "lsta_festschreibungen_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lsta_festschreibungen_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_incidents: {
        Row: {
          affected_count: number | null
          affected_data_types: string[]
          authority_notified: boolean
          authority_notified_at: string | null
          closed_at: string | null
          containment_actions: string | null
          description: string
          discovered_at: string
          discovered_by: string | null
          id: string
          root_cause: string | null
          severity: string
          status: string
          subjects_notified: boolean
          subjects_notified_at: string | null
        }
        Insert: {
          affected_count?: number | null
          affected_data_types?: string[]
          authority_notified?: boolean
          authority_notified_at?: string | null
          closed_at?: string | null
          containment_actions?: string | null
          description: string
          discovered_at: string
          discovered_by?: string | null
          id?: string
          root_cause?: string | null
          severity: string
          status?: string
          subjects_notified?: boolean
          subjects_notified_at?: string | null
        }
        Update: {
          affected_count?: number | null
          affected_data_types?: string[]
          authority_notified?: boolean
          authority_notified_at?: string | null
          closed_at?: string | null
          containment_actions?: string | null
          description?: string
          discovered_at?: string
          discovered_by?: string | null
          id?: string
          root_cause?: string | null
          severity?: string
          status?: string
          subjects_notified?: boolean
          subjects_notified_at?: string | null
        }
        Relationships: []
      }
      privacy_requests: {
        Row: {
          deadline: string
          id: string
          notes: string | null
          reason: string | null
          request_type: string
          requested_at: string
          resolved_at: string | null
          resolved_by: string | null
          result_blob_url: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          deadline: string
          id?: string
          notes?: string | null
          reason?: string | null
          request_type: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          result_blob_url?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          deadline?: string
          id?: string
          notes?: string | null
          reason?: string | null
          request_type?: string
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          result_blob_url?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      receipt_requests: {
        Row: {
          bank_betrag: number
          bank_datum: string
          bank_gegenseite: string | null
          bank_iban: string | null
          bank_verwendung: string | null
          client_id: string | null
          company_id: string
          id: string
          linked_journal_entry_id: string | null
          notes: string | null
          received_at: string | null
          recipient_email: string | null
          recipient_name: string | null
          requested_at: string
          requested_by: string | null
          status: string
        }
        Insert: {
          bank_betrag: number
          bank_datum: string
          bank_gegenseite?: string | null
          bank_iban?: string | null
          bank_verwendung?: string | null
          client_id?: string | null
          company_id: string
          id?: string
          linked_journal_entry_id?: string | null
          notes?: string | null
          received_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          bank_betrag?: number
          bank_datum?: string
          bank_gegenseite?: string | null
          bank_iban?: string | null
          bank_verwendung?: string | null
          client_id?: string | null
          company_id?: string
          id?: string
          linked_journal_entry_id?: string | null
          notes?: string | null
          received_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_requests_linked_journal_entry_id_fkey"
            columns: ["linked_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      report_line_closure: {
        Row: {
          ancestor_id: number
          depth: number
          descendant_id: number
          mandant_id: string
        }
        Insert: {
          ancestor_id: number
          depth: number
          descendant_id: number
          mandant_id: string
        }
        Update: {
          ancestor_id?: number
          depth?: number
          descendant_id?: number
          mandant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_line_closure_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "report_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_line_closure_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "report_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      report_lines: {
        Row: {
          active: boolean
          balance_type: string
          created_at: string
          hgb_paragraph: string | null
          id: number
          is_virtual: boolean
          mandant_id: string
          name_de: string
          normal_side: string
          reference_code: string
          short_label: string | null
          size_class: string
          sort_order: number
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          balance_type: string
          created_at?: string
          hgb_paragraph?: string | null
          id?: number
          is_virtual?: boolean
          mandant_id: string
          name_de: string
          normal_side: string
          reference_code: string
          short_label?: string | null
          size_class?: string
          sort_order: number
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          balance_type?: string
          created_at?: string
          hgb_paragraph?: string | null
          id?: number
          is_virtual?: boolean
          mandant_id?: string
          name_de?: string
          normal_side?: string
          reference_code?: string
          short_label?: string | null
          size_class?: string
          sort_order?: number
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          company_id: string | null
          default_steuernummer: string
          elster_berater_nr: string
          kanzlei_email: string
          kanzlei_name: string
          kanzlei_ort: string
          kanzlei_plz: string
          kanzlei_strasse: string
          kanzlei_telefon: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          default_steuernummer?: string
          elster_berater_nr?: string
          kanzlei_email?: string
          kanzlei_name?: string
          kanzlei_ort?: string
          kanzlei_plz?: string
          kanzlei_strasse?: string
          kanzlei_telefon?: string
          owner_id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          default_steuernummer?: string
          elster_berater_nr?: string
          kanzlei_email?: string
          kanzlei_name?: string
          kanzlei_ort?: string
          kanzlei_plz?: string
          kanzlei_strasse?: string
          kanzlei_telefon?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_preferences: {
        Row: {
          client_id: string | null
          company_id: string
          display_name: string
          first_used_at: string
          haben_konto: string | null
          id: string
          last_used_at: string
          soll_konto: string | null
          supplier_key: string
          usage_count: number
        }
        Insert: {
          client_id?: string | null
          company_id: string
          display_name: string
          first_used_at?: string
          haben_konto?: string | null
          id?: string
          last_used_at?: string
          soll_konto?: string | null
          supplier_key: string
          usage_count?: number
        }
        Update: {
          client_id?: string | null
          company_id?: string
          display_name?: string
          first_used_at?: string
          haben_konto?: string | null
          id?: string
          last_used_at?: string
          soll_konto?: string | null
          supplier_key?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          locale: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          locale?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          locale?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ustid_verifications: {
        Row: {
          client_id: string
          company_id: string
          created_at: string
          created_by: string | null
          entstehungsjahr: number
          error_message: string | null
          id: string
          partner_id: string | null
          prev_hash: string | null
          raw_http_request_url: string
          raw_http_response: string | null
          raw_http_response_headers: Json | null
          requested_ust_idnr: string
          requester_ust_idnr: string | null
          retention_hold: boolean
          retention_hold_reason: string | null
          retention_until: string
          server_recorded_at: string
          verification_hash: string | null
          verification_source: string
          verification_status: string
          vies_raw_parsed: Json | null
          vies_request_date: string | null
          vies_request_identifier: string | null
          vies_trader_address: string | null
          vies_trader_name: string | null
          vies_valid: boolean | null
        }
        Insert: {
          client_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          entstehungsjahr?: number
          error_message?: string | null
          id?: string
          partner_id?: string | null
          prev_hash?: string | null
          raw_http_request_url: string
          raw_http_response?: string | null
          raw_http_response_headers?: Json | null
          requested_ust_idnr: string
          requester_ust_idnr?: string | null
          retention_hold?: boolean
          retention_hold_reason?: string | null
          retention_until: string
          server_recorded_at?: string
          verification_hash?: string | null
          verification_source?: string
          verification_status: string
          vies_raw_parsed?: Json | null
          vies_request_date?: string | null
          vies_request_identifier?: string | null
          vies_trader_address?: string | null
          vies_trader_name?: string | null
          vies_valid?: boolean | null
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          entstehungsjahr?: number
          error_message?: string | null
          id?: string
          partner_id?: string | null
          prev_hash?: string | null
          raw_http_request_url?: string
          raw_http_response?: string | null
          raw_http_response_headers?: Json | null
          requested_ust_idnr?: string
          requester_ust_idnr?: string | null
          retention_hold?: boolean
          retention_hold_reason?: string | null
          retention_until?: string
          server_recorded_at?: string
          verification_hash?: string | null
          verification_source?: string
          verification_status?: string
          vies_raw_parsed?: Json | null
          vies_request_date?: string | null
          vies_request_identifier?: string | null
          vies_trader_address?: string | null
          vies_trader_name?: string | null
          vies_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ustid_verifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ustid_verifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ustid_verifications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "business_partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      health_check: {
        Row: {
          database: unknown
          postgres_version: string | null
          server_time: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_write: { Args: { cid: string }; Returns: boolean }
      canonical_json_bpv: {
        Args: {
          p_aufbewahrungs_kategorie: string
          p_partner_id: string
          p_snapshot: Json
          p_valid_from: string
          p_version_number: number
        }
        Returns: string
      }
      canonical_json_uv: {
        Args: {
          p_created_at: string
          p_id: string
          p_partner_id: string
          p_raw_response_sha256: string
          p_requested_ust_idnr: string
          p_verification_source: string
          p_verification_status: string
        }
        Returns: string
      }
      canonical_jsonb: { Args: { j: Json }; Returns: string }
      canonical_ts: { Args: { v: string }; Returns: string }
      client_belongs_to_company: {
        Args: { p_client_id: string; p_company_id: string }
        Returns: boolean
      }
      compute_bpv_hash: {
        Args: {
          p_aufbewahrungs_kategorie: string
          p_partner_id: string
          p_prev: string
          p_snapshot: Json
          p_valid_from: string
          p_version_number: number
        }
        Returns: string
      }
      compute_uv_hash: {
        Args: {
          p_created_at: string
          p_id: string
          p_partner_id: string
          p_prev: string
          p_raw_http_response: string
          p_requested_ust_idnr: string
          p_verification_source: string
          p_verification_status: string
        }
        Returns: string
      }
      is_company_admin: { Args: { cid: string }; Returns: boolean }
      is_company_member: { Args: { cid: string }; Returns: boolean }
      journal_entries_compute_hash: {
        Args: {
          p_beleg_nr: string
          p_beschreibung: string
          p_betrag: number
          p_datum: string
          p_haben_konto: string
          p_parent_entry_id: string
          p_prev_hash: string
          p_soll_konto: string
        }
        Returns: string
      }
      next_debitor_nummer: { Args: { p_client_id: string }; Returns: number }
      next_kreditor_nummer: { Args: { p_client_id: string }; Returns: number }
      verify_bpv_chain: {
        Args: { p_client_id: string }
        Returns: {
          is_valid: boolean
          partner_id: string
          reason: string
          version_number: number
        }[]
      }
      verify_journal_chain: {
        Args: { p_company_id: string }
        Returns: {
          first_break_entry_id: string
          first_break_index: number
          message: string
          ok: boolean
          total: number
        }[]
      }
      verify_uv_chain: {
        Args: { p_client_id: string }
        Returns: {
          is_valid: boolean
          reason: string
          verification_id: string
        }[]
      }
    }
    Enums: {
      company_role: "owner" | "admin" | "member" | "readonly" | "tax_auditor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      company_role: ["owner", "admin", "member", "readonly", "tax_auditor"],
    },
  },
} as const
