import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SCHEMA } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: SUPABASE_SCHEMA },
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export async function getConnectionState(){
  try{
    const { data: { session } } = await supabase.auth.getSession();
    if(!session) return {connected:false, authenticated:false, profile:null};
    const { data: profile, error } = await supabase.from("profiles").select("id,full_name,role,group_no,is_active").eq("id",session.user.id).maybeSingle();
    if(error) return {connected:false, authenticated:true, profile:null, error:error.message};
    return {connected:true, authenticated:true, profile};
  }catch(error){
    return {connected:false, authenticated:false, profile:null, error:error?.message||"connection error"};
  }
}
