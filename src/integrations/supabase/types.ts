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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      discover_notifications: {
        Row: {
          body: string | null
          id: string
          metadata: Json
          place_id: string | null
          read_at: string | null
          sent_at: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          id?: string
          metadata?: Json
          place_id?: string | null
          read_at?: string | null
          sent_at?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          id?: string
          metadata?: Json
          place_id?: string | null
          read_at?: string | null
          sent_at?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discover_notifications_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_badges: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          name: string
          trip_id: string | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          trip_id?: string | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          trip_id?: string | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explore_badges_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_edges: {
        Row: {
          created_at: string
          edge_type: string
          from_node_id: string
          id: string
          to_node_id: string
          trip_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          edge_type?: string
          from_node_id: string
          id?: string
          to_node_id: string
          trip_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          edge_type?: string
          from_node_id?: string
          id?: string
          to_node_id?: string
          trip_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "explore_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "explore_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explore_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "explore_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explore_edges_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_node_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          mood: string | null
          node_id: string
          trip_id: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          node_id: string
          trip_id: string
          type?: string
          url?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          mood?: string | null
          node_id?: string
          trip_id?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explore_node_media_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "explore_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explore_node_media_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_nodes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lat: number | null
          level: number
          lng: number | null
          media_count: number
          metadata: Json
          name: string
          parent_id: string | null
          points: number
          position_x: number | null
          position_y: number | null
          source: string
          status: string
          trip_id: string
          type: string
          updated_at: string
          user_id: string
          visited_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          level?: number
          lng?: number | null
          media_count?: number
          metadata?: Json
          name: string
          parent_id?: string | null
          points?: number
          position_x?: number | null
          position_y?: number | null
          source?: string
          status?: string
          trip_id: string
          type?: string
          updated_at?: string
          user_id: string
          visited_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          level?: number
          lng?: number | null
          media_count?: number
          metadata?: Json
          name?: string
          parent_id?: string | null
          points?: number
          position_x?: number | null
          position_y?: number | null
          source?: string
          status?: string
          trip_id?: string
          type?: string
          updated_at?: string
          user_id?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "explore_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "explore_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explore_nodes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_progress: {
        Row: {
          badges_count: number
          cities_completed: number
          created_at: string
          id: string
          last_action_at: string | null
          nodes_total: number
          nodes_visited: number
          total_points: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          badges_count?: number
          cities_completed?: number
          created_at?: string
          id?: string
          last_action_at?: string | null
          nodes_total?: number
          nodes_visited?: number
          total_points?: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          badges_count?: number
          cities_completed?: number
          created_at?: string
          id?: string
          last_action_at?: string | null
          nodes_total?: number
          nodes_visited?: number
          total_points?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explore_progress_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_badges: {
        Row: {
          code: string
          id: string
          journal_id: string | null
          label: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          id?: string
          journal_id?: string | null
          label: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          id?: string
          journal_id?: string | null
          label?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_badges_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_blocks: {
        Row: {
          content: Json
          created_at: string
          day_id: string
          id: string
          journal_id: string
          position: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          day_id: string
          id?: string
          journal_id: string
          position?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          day_id?: string
          id?: string
          journal_id?: string
          position?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_blocks_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "journal_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_blocks_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_days: {
        Row: {
          created_at: string
          date: string
          id: string
          journal_id: string
          position: number
          summary: string | null
          title: string | null
          updated_at: string
          user_id: string
          weather: Json | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          journal_id: string
          position?: number
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          weather?: Json | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          journal_id?: string
          position?: number
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          weather?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_days_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_stories: {
        Row: {
          content: string
          created_at: string
          id: string
          journal_id: string
          tone: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          journal_id: string
          tone?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          journal_id?: string
          tone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_stories_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          is_public: boolean
          public_slug: string | null
          title: string
          tone: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          public_slug?: string | null
          title?: string
          tone?: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          public_slug?: string | null
          title?: string
          tone?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_badges: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          name: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_favorites: {
        Row: {
          id: string
          note: string | null
          place_id: string
          saved_at: string
          trip_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          place_id: string
          saved_at?: string
          trip_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          note?: string | null
          place_id?: string
          saved_at?: string
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_favorites_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "mood_places"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_places: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          distance_km: number | null
          duration_min: number | null
          hidden_gem: boolean
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          metadata: Json
          mood: string
          name: string
          score: number
          selection_id: string | null
          source: string
          tags: string[]
          tips: string | null
          user_id: string
          why_fits: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          distance_km?: number | null
          duration_min?: number | null
          hidden_gem?: boolean
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          metadata?: Json
          mood: string
          name: string
          score?: number
          selection_id?: string | null
          source?: string
          tags?: string[]
          tips?: string | null
          user_id: string
          why_fits: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          distance_km?: number | null
          duration_min?: number | null
          hidden_gem?: boolean
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          metadata?: Json
          mood?: string
          name?: string
          score?: number
          selection_id?: string | null
          source?: string
          tags?: string[]
          tips?: string | null
          user_id?: string
          why_fits?: string
        }
        Relationships: []
      }
      mood_reactions: {
        Row: {
          comment: string | null
          created_at: string
          emoji: string | null
          id: string
          lat: number | null
          lng: number | null
          mood: string
          place_id: string
          place_name: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mood: string
          place_id: string
          place_name?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mood?: string
          place_id?: string
          place_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mood_selections: {
        Row: {
          context: Json
          created_at: string
          energy_level: number | null
          free_input: string | null
          id: string
          lat: number | null
          lng: number | null
          mood: string
          time_of_day: string | null
          user_id: string
          weather: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          energy_level?: number | null
          free_input?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mood: string
          time_of_day?: string | null
          user_id: string
          weather?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          energy_level?: number | null
          free_input?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          mood?: string
          time_of_day?: string | null
          user_id?: string
          weather?: string | null
        }
        Relationships: []
      }
      pip_chat_sessions: {
        Row: {
          context: Json
          created_at: string
          history: Json
          id: string
          kind: string
          stage: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          history?: Json
          id?: string
          kind: string
          stage?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          history?: Json
          id?: string
          kind?: string
          stage?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      place_list_items: {
        Row: {
          added_at: string
          id: string
          list_id: string
          note: string | null
          place_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          note?: string | null
          place_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          note?: string | null
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "place_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_list_items_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_lists: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      place_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          photo_url: string | null
          place_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          photo_url?: string | null
          place_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          photo_url?: string | null
          place_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          hidden_gem: boolean
          id: string
          image_url: string | null
          lat: number
          lng: number
          metadata: Json
          name: string
          opening_hours: Json | null
          osm_id: string | null
          price_level: number | null
          rating_avg: number
          rating_count: number
          score: number
          source: string
          subcategory: string | null
          tags: string[]
          tips: string | null
          updated_at: string
          why_fits: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          hidden_gem?: boolean
          id?: string
          image_url?: string | null
          lat: number
          lng: number
          metadata?: Json
          name: string
          opening_hours?: Json | null
          osm_id?: string | null
          price_level?: number | null
          rating_avg?: number
          rating_count?: number
          score?: number
          source?: string
          subcategory?: string | null
          tags?: string[]
          tips?: string | null
          updated_at?: string
          why_fits?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          hidden_gem?: boolean
          id?: string
          image_url?: string | null
          lat?: number
          lng?: number
          metadata?: Json
          name?: string
          opening_hours?: Json | null
          osm_id?: string | null
          price_level?: number | null
          rating_avg?: number
          rating_count?: number
          score?: number
          source?: string
          subcategory?: string | null
          tags?: string[]
          tips?: string | null
          updated_at?: string
          why_fits?: string | null
        }
        Relationships: []
      }
      premium_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json
          pack: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json
          pack?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json
          pack?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_activities: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          day_date: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          metadata: Json | null
          position: number
          scheduled_at: string | null
          source: string
          status: string
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          day_date?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          position?: number
          scheduled_at?: string | null
          source?: string
          status?: string
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          day_date?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          position?: number
          scheduled_at?: string | null
          source?: string
          status?: string
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_activities_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checkins: {
        Row: {
          activity_id: string | null
          checked_at: string
          distance_m: number | null
          id: string
          lat: number
          lng: number
          trip_id: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          checked_at?: string
          distance_m?: number | null
          id?: string
          lat: number
          lng: number
          trip_id: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          checked_at?: string
          distance_m?: number | null
          id?: string
          lat?: number
          lng?: number
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checkins_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "trip_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_checkins_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_path: string
          id: string
          mime_type: string | null
          name: string
          notes: string | null
          size_bytes: number | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_path: string
          id?: string
          mime_type?: string | null
          name: string
          notes?: string | null
          size_bytes?: number | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          name?: string
          notes?: string | null
          size_bytes?: number | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_positions: {
        Row: {
          accuracy: number | null
          id: string
          lat: number
          lng: number
          recorded_at: string
          speed: number | null
          trip_id: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          speed?: number | null
          trip_id: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          speed?: number | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_positions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_tracking: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          last_lat: number | null
          last_lng: number | null
          last_position_at: string | null
          settings: Json
          share_enabled: boolean
          share_slug: string | null
          started_at: string | null
          total_distance_km: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          last_lat?: number | null
          last_lng?: number | null
          last_position_at?: string | null
          settings?: Json
          share_enabled?: boolean
          share_slug?: string | null
          started_at?: string | null
          total_distance_km?: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          last_lat?: number | null
          last_lng?: number | null
          last_position_at?: string | null
          settings?: Json
          share_enabled?: boolean
          share_slug?: string | null
          started_at?: string | null
          total_distance_km?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_tracking_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_city: string | null
          created_at: string
          departure_date: string | null
          departure_location: string | null
          destination: string | null
          duration: number | null
          form_data: Json | null
          id: string
          recommendations: Json | null
          return_date: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_city?: string | null
          created_at?: string
          departure_date?: string | null
          departure_location?: string | null
          destination?: string | null
          duration?: number | null
          form_data?: Json | null
          id?: string
          recommendations?: Json | null
          return_date?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_city?: string | null
          created_at?: string
          departure_date?: string | null
          departure_location?: string | null
          destination?: string | null
          duration?: number | null
          form_data?: Json | null
          id?: string
          recommendations?: Json | null
          return_date?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      mood_reactions_public: {
        Row: {
          comment: string | null
          created_at: string | null
          emoji: string | null
          id: string | null
          mood: string | null
          place_id: string | null
          place_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string | null
          mood?: string | null
          place_id?: string | null
          place_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string | null
          mood?: string | null
          place_id?: string | null
          place_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_public_display_name: { Args: { _user_id: string }; Returns: string }
      get_public_trip_activities: {
        Args: { _slug: string }
        Returns: {
          category: string | null
          completed_at: string | null
          created_at: string
          day_date: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          metadata: Json | null
          position: number
          scheduled_at: string | null
          source: string
          status: string
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trip_activities"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_public_trip_positions: {
        Args: { _slug: string }
        Returns: {
          lat: number
          lng: number
          recorded_at: string
        }[]
      }
      get_public_trip_tracking: {
        Args: { _slug: string }
        Returns: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          last_lat: number | null
          last_lng: number | null
          last_position_at: string | null
          settings: Json
          share_enabled: boolean
          share_slug: string | null
          started_at: string | null
          total_distance_km: number
          trip_id: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trip_tracking"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_waitlist_count: { Args: never; Returns: number }
      owns_place_list: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
      subscribe_to_waitlist: {
        Args: {
          _email: string
          _metadata?: Json
          _pack?: string
          _source?: string
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
  public: {
    Enums: {},
  },
} as const
