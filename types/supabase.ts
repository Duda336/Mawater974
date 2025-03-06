export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone_number: string | null
          role: UserRole
          created_at: string
          updated_at: string
          country_id: number | null
          city_id: number | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone_number?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
          country_id?: number | null
          city_id?: number | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone_number?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
          country_id?: number | null
          city_id?: number | null
        }
      }
      brands: {
        Row: {
          id: number
          name: string
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      models: {
        Row: {
          id: number
          brand_id: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          brand_id: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          brand_id?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      cars: {
        Row: {
          id: number
          user_id: string
          brand_id: number
          model_id: number
          year: number
          mileage: number
          price: number
          description: string | null
          fuel_type: FuelType
          gearbox_type: GearboxType
          body_type: BodyType
          condition: CarCondition
          status: CarStatus
          main_photo_index?: number | null
          image_url: string | null
          created_at: string
          updated_at: string
          country_id: number | null
          city_id: number | null
        }
        Insert: {
          id?: number
          user_id: string
          brand_id: number
          model_id: number
          year: number
          mileage: number
          price: number
          description?: string | null
          fuel_type: FuelType
          gearbox_type: GearboxType
          body_type: BodyType
          condition: CarCondition
          status?: CarStatus
          main_photo_index?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          country_id?: number | null
          city_id?: number | null
        }
        Update: {
          id?: number
          user_id?: string
          brand_id?: number
          model_id?: number
          year?: number
          mileage?: number
          price?: number
          description?: string | null
          fuel_type?: FuelType
          gearbox_type?: GearboxType
          body_type?: BodyType
          condition?: CarCondition
          status?: CarStatus
          main_photo_index?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
          country_id?: number | null
          city_id?: number | null
        }
      }
      car_images: {
        Row: {
          id: number
          car_id: number
          url: string
          is_main_photo?: boolean
          created_at: string
        }
        Insert: {
          id?: number
          car_id: number
          url: string
          is_main_photo?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          car_id?: number
          url?: string
          is_main_photo?: boolean
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: number
          user_id: string
          car_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          car_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          car_id?: number
          created_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: number
          admin_id: string
          action_type: string
          table_name: string
          record_id: number
          changes: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          admin_id: string
          action_type: string
          table_name: string
          record_id: number
          changes?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          admin_id?: string
          action_type?: string
          table_name?: string
          record_id?: number
          changes?: Json | null
          created_at?: string
        }
      }
      countries: {
        Row: {
          id: number
          code: string
          name: string
          name_ar: string
          currency_code: string
          currency_symbol: string
          currency_name: string
          currency_name_ar: string
          phone_code: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          name_ar: string
          currency_code: string
          currency_symbol: string
          currency_name: string
          currency_name_ar: string
          phone_code: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          name_ar?: string
          currency_code?: string
          currency_symbol?: string
          currency_name?: string
          currency_name_ar?: string
          phone_code?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      cities: {
        Row: {
          id: number
          country_id: number
          name: string
          name_ar: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          country_id: number
          name: string
          name_ar: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          country_id?: number
          name?: string
          name_ar?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      currency_rates: {
        Row: {
          id: number
          from_currency: string
          to_currency: string
          rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          from_currency: string
          to_currency: string
          rate: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          from_currency?: string
          to_currency?: string
          rate?: number
          created_at?: string
          updated_at?: string
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
      user_role: UserRole
      fuel_type: FuelType
      gearbox_type: GearboxType
      body_type: BodyType
      car_condition: CarCondition
      car_status: CarStatus
    }
  }
}

export type UserRole = 'normal_user' | 'admin'
export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'
export type GearboxType = 'Manual' | 'Automatic'
export type BodyType = 'Sedan' | 'SUV' | 'Hatchback' | 'Coupe' | 'Truck' | 'Van' | 'Wagon' | 'Convertible' | 'Other'
export type CarCondition = 'New' | 'Excellent' | 'Good' | 'Not Working'
export type CarStatus = 'Pending' | 'Approved' | 'Sold'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Helper type to get the row type for a table
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// Helper types for specific tables
export type Profile = TableRow<'profiles'>
export type Brand = TableRow<'brands'>
export type Model = TableRow<'models'>
export type Car = TableRow<'cars'>
export type CarImage = TableRow<'car_images'>
export type Favorite = TableRow<'favorites'>
export type AdminLog = TableRow<'admin_logs'>
export type Country = TableRow<'countries'>
export type City = TableRow<'cities'>
export type CurrencyRate = TableRow<'currency_rates'>

export type CarBrand = Pick<Brand, 'id' | 'name' | 'logo_url'>
export type CarModel = Pick<Model, 'id' | 'name'>

export interface ExtendedCar extends Database['public']['Tables']['cars']['Row'] {
  brand: CarBrand;
  model: CarModel;
  user: Profile;
  country?: Country;
  city?: City;
  images?: CarImage[];
  favorite?: boolean;
}
