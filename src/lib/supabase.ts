import { createClient } from '@supabase/supabase-js'
import { getBaseUrl } from './utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export { getBaseUrl }
export const supabase = createClient(supabaseUrl, supabaseAnonKey) 