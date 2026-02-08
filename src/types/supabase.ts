export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: number;
          name: string;
          slug: string | null;
          summary: string | null;
          storyline: string | null;
          cover_image_id: string | null;
          rating: number | null;
          rating_count: number;
          aggregated_rating: number | null;
          total_rating: number | null;
          first_release_date: string | null;
          category: number;
          status: number | null;
          hypes: number;
          genre_ids: number[];
          theme_ids: number[];
          mode_ids: number[];
          platform_ids: number[];
          perspective_ids: number[];
          keyword_ids: number[];
          developer_ids: number[];
          raw_igdb: Record<string, unknown> | null;
          igdb_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          name: string;
          slug?: string | null;
          summary?: string | null;
          storyline?: string | null;
          cover_image_id?: string | null;
          rating?: number | null;
          rating_count?: number;
          aggregated_rating?: number | null;
          total_rating?: number | null;
          first_release_date?: string | null;
          category?: number;
          status?: number | null;
          hypes?: number;
          genre_ids?: number[];
          theme_ids?: number[];
          mode_ids?: number[];
          platform_ids?: number[];
          perspective_ids?: number[];
          keyword_ids?: number[];
          developer_ids?: number[];
          raw_igdb?: Record<string, unknown> | null;
          igdb_updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [];
      };
      genres: {
        Row: { id: number; name: string; slug: string };
        Insert: { id: number; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["genres"]["Insert"]>;
        Relationships: [];
      };
      themes: {
        Row: { id: number; name: string; slug: string };
        Insert: { id: number; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["themes"]["Insert"]>;
        Relationships: [];
      };
      game_modes: {
        Row: { id: number; name: string; slug: string };
        Insert: { id: number; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["game_modes"]["Insert"]>;
        Relationships: [];
      };
      platforms: {
        Row: { id: number; name: string; slug: string };
        Insert: { id: number; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["platforms"]["Insert"]>;
        Relationships: [];
      };
      player_perspectives: {
        Row: { id: number; name: string; slug: string };
        Insert: { id: number; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["player_perspectives"]["Insert"]>;
        Relationships: [];
      };
      companies: {
        Row: { id: number; name: string; slug: string | null };
        Insert: { id: number; name: string; slug?: string | null };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      keywords: {
        Row: { id: number; name: string; slug: string };
        Insert: { id: number; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["keywords"]["Insert"]>;
        Relationships: [];
      };
      game_genres: {
        Row: { game_id: number; genre_id: number };
        Insert: { game_id: number; genre_id: number };
        Update: Partial<Database["public"]["Tables"]["game_genres"]["Insert"]>;
        Relationships: [];
      };
      game_themes: {
        Row: { game_id: number; theme_id: number };
        Insert: { game_id: number; theme_id: number };
        Update: Partial<Database["public"]["Tables"]["game_themes"]["Insert"]>;
        Relationships: [];
      };
      game_game_modes: {
        Row: { game_id: number; mode_id: number };
        Insert: { game_id: number; mode_id: number };
        Update: Partial<Database["public"]["Tables"]["game_game_modes"]["Insert"]>;
        Relationships: [];
      };
      game_platforms: {
        Row: { game_id: number; platform_id: number };
        Insert: { game_id: number; platform_id: number };
        Update: Partial<Database["public"]["Tables"]["game_platforms"]["Insert"]>;
        Relationships: [];
      };
      game_perspectives: {
        Row: { game_id: number; perspective_id: number };
        Insert: { game_id: number; perspective_id: number };
        Update: Partial<Database["public"]["Tables"]["game_perspectives"]["Insert"]>;
        Relationships: [];
      };
      game_companies: {
        Row: { game_id: number; company_id: number; role: string };
        Insert: { game_id: number; company_id: number; role?: string };
        Update: Partial<Database["public"]["Tables"]["game_companies"]["Insert"]>;
        Relationships: [];
      };
      game_keywords: {
        Row: { game_id: number; keyword_id: number };
        Insert: { game_id: number; keyword_id: number };
        Update: Partial<Database["public"]["Tables"]["game_keywords"]["Insert"]>;
        Relationships: [];
      };
      game_screenshots: {
        Row: { id: number; game_id: number; image_id: string };
        Insert: { game_id: number; image_id: string };
        Update: Partial<Database["public"]["Tables"]["game_screenshots"]["Insert"]>;
        Relationships: [];
      };
      game_videos: {
        Row: { id: number; game_id: number; video_id: string };
        Insert: { game_id: number; video_id: string };
        Update: Partial<Database["public"]["Tables"]["game_videos"]["Insert"]>;
        Relationships: [];
      };
      game_similar: {
        Row: { game_id: number; similar_game_id: number; source: string };
        Insert: { game_id: number; similar_game_id: number; source?: string };
        Update: Partial<Database["public"]["Tables"]["game_similar"]["Insert"]>;
        Relationships: [];
      };
      game_recommendations: {
        Row: { game_id: number; rec_game_id: number; score: number; computed_at: string };
        Insert: { game_id: number; rec_game_id: number; score: number };
        Update: Partial<Database["public"]["Tables"]["game_recommendations"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      recommend_games: {
        Args: {
          source_game_id: number;
          result_limit?: number;
        };
        Returns: {
          id: number;
          name: string;
          slug: string | null;
          summary: string | null;
          cover_image_id: string | null;
          rating: number | null;
          rating_count: number | null;
          first_release_date: string | null;
          genre_ids: number[] | null;
          theme_ids: number[] | null;
          platform_ids: number[] | null;
          similarity_score: number;
        }[];
      };
      jaccard_similarity: {
        Args: {
          a: number[] | null;
          b: number[] | null;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
