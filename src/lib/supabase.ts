import { createClient } from '@supabase/supabase-js';

// ダミー環境変数
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

// ダミーストレージ（セッション中のみ保持）
const dummyStorage: Record<string, any[]> = {
  'users': [],
  'diagnosis_results': []
};

// 実際のSupabaseクライアント（環境変数が設定されている場合）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// データ保存関数
export const saveData = async (tableName: string, data: any) => {
  console.log(`データを保存します (テーブル: ${tableName}):`, data);
  
  // ダミーストレージに保存
  if (!dummyStorage[tableName]) {
    dummyStorage[tableName] = [];
  }
  
  const id = `dummy-id-${Date.now()}`;
  const newData = { id, ...data, created_at: new Date().toISOString() };
  dummyStorage[tableName].push(newData);
  
  return { data: { id }, error: null };
};

// データ取得関数
export const getData = async (tableName: string, id?: string) => {
  console.log(`データを取得します (テーブル: ${tableName}${id ? `, ID: ${id}` : ''})`);
  
  if (!dummyStorage[tableName]) {
    return { data: null, error: null };
  }
  
  if (id) {
    const item = dummyStorage[tableName].find(item => item.id === id);
    return { data: item || null, error: null };
  }
  
  return { data: dummyStorage[tableName], error: null };
};

// すべての診断結果を取得
export const getAllDiagnosisResults = async () => {
  return getData('diagnosis_results');
}; 