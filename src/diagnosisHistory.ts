// src/diagnosisHistory.ts
import { supabase } from './supabaseClient';

export interface DiagnosisRecord {
  id?: string;
  user_id?: string;
  date: string;
  diagnosis: string;
  confidence: number;
  severity: string;
  medication: string;
  conflict_detected: boolean;
  conflicting_drugs: string[];
  safe_alternative: string;
  standard_treatment: string;
  image_base64?: string;
  status: 'Ongoing' | 'Resolved';
  created_at?: string;
}

export async function saveDiagnosis(record: Omit<DiagnosisRecord, 'id' | 'user_id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  const { data, error } = await supabase
    .from('diagnosis_history')
    .insert([{ ...record, user_id: user.id }])
    .select()
    .single();
  return { data, error };
}

export async function fetchDiagnosisHistory(): Promise<DiagnosisRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('diagnosis_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function deleteDiagnosis(id: string) {
  const { error } = await supabase.from('diagnosis_history').delete().eq('id', id);
  return { error };
}

export async function updateDiagnosisStatus(id: string, status: 'Ongoing' | 'Resolved') {
  const { error } = await supabase.from('diagnosis_history').update({ status }).eq('id', id);
  return { error };
}
