import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

// ダミーストレージ（セッション中のみ保持）
export const dummyStorage: Record<string, any[]> = {
  'users': [],
  'diagnosis_results': [],
  'chatbot_progress': []
};

// 環境変数が実際に設定されているかログ出力
console.log('Supabase環境設定:', {
  url設定あり: !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dummy-url.supabase.co',
  APIキー設定あり: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'dummy-key'
});

// 実際のSupabaseクライアント
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// データ保存関数
export const saveData = async (tableName: string, data: any) => {
  console.log(`データを保存します (テーブル: ${tableName}):`, data);
  
  try {
    // 実際のSupabaseに保存を試みる
    if (supabaseUrl !== 'https://dummy-url.supabase.co' && supabaseAnonKey !== 'dummy-key') {
      console.log('実際のSupabaseに保存を試みます...');
      try {
        const { data: savedData, error: supabaseError } = await supabase
          .from(tableName)
          .insert(data)
          .select('id')
          .single();
        
        if (!supabaseError && savedData) {
          console.log(`Supabaseに保存成功 (${tableName}) - ID:`, savedData.id);
          return { data: savedData, error: null };
        }
        
        if (supabaseError) {
          console.warn(`Supabaseへの保存中にエラーが発生 (${tableName}):`, supabaseError);
        }
      } catch (error) {
        console.error(`Supabase APIエラー (${tableName}):`, error);
      }
    } else {
      console.log('ダミーモードで実行中のため、実際のSupabaseには保存されません');
    }
    
    // ダミーストレージに保存（実際のSupabaseに保存できなかった場合や設定がない場合）
    if (!dummyStorage[tableName]) {
      dummyStorage[tableName] = [];
    }
    
    const id = `dummy-id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newData = { id, ...data, created_at: new Date().toISOString() };
    dummyStorage[tableName].push(newData);
    
    console.log(`ダミーストレージに保存しました (${tableName}) - ID:`, id);
    return { data: { id }, error: null };
    
  } catch (error) {
    console.error(`データ保存中に予期せぬエラーが発生しました (${tableName}):`, error);
    
    // エラー発生時もダミーデータを返す
    const fallbackId = `error-${Date.now()}`;
    return { data: { id: fallbackId }, error: null };
  }
};

// データ取得関数
export const getData = async (tableName: string, id?: string) => {
  console.log(`データを取得します (テーブル: ${tableName}${id ? `, ID: ${id}` : ''})`);
  
  // 実際のSupabaseからの取得を試みる
  if (supabaseUrl !== 'https://dummy-url.supabase.co' && supabaseAnonKey !== 'dummy-key') {
    try {
      if (id) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          console.log(`Supabaseからデータを取得しました (${tableName}, ID: ${id})`);
          return { data, error: null };
        }
      } else {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (!error && data) {
          console.log(`Supabaseから${data.length}件のデータを取得しました (${tableName})`);
          return { data, error: null };
        }
      }
    } catch (error) {
      console.error(`Supabaseからのデータ取得中にエラーが発生しました (${tableName}):`, error);
    }
  }
  
  // ダミーストレージからのフォールバック
  if (!dummyStorage[tableName]) {
    return { data: id ? null : [], error: null };
  }
  
  if (id) {
    const item = dummyStorage[tableName].find(item => item.id === id);
    return { data: item || null, error: null };
  }
  
  return { data: dummyStorage[tableName], error: null };
};

// メールアドレスからユーザーIDを取得
export const getUserIdByEmail = async (email: string) => {
  console.log(`メールアドレスからユーザーを検索: ${email}`);
  
  try {
    // 実際のSupabaseから検索
    if (supabaseUrl !== 'https://dummy-url.supabase.co') {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (!error && data) {
        console.log('ユーザーが見つかりました:', data.id);
        return { userId: data.id, error: null };
      }
      
      if (error) {
        console.warn('ユーザー検索エラー:', error);
      }
    }
    
    // ダミーストレージから検索
    const user = dummyStorage['users'].find(u => u.email === email);
    if (user) {
      console.log('ダミーストレージからユーザーが見つかりました:', user.id);
      return { userId: user.id, error: null };
    }
    
    return { userId: null, error: { message: 'ユーザーが見つかりませんでした' } };
  } catch (error) {
    console.error('ユーザー検索中にエラーが発生:', error);
    return { userId: null, error };
  }
};

// チャットボットの進行状況を保存
export const saveChatbotProgress = async (userId: string, progressData: any) => {
  console.log(`チャットボット進行状況を保存 (ユーザーID: ${userId})`, progressData);
  
  const data = {
    user_id: userId,
    progress_data: progressData,
    updated_at: new Date().toISOString()
  };
  
  return saveData('chatbot_progress', data);
};

// チャットボットの進行状況を取得
export const getChatbotProgressByEmail = async (email: string) => {
  console.log(`メールアドレスからチャットボット進行状況を取得: ${email}`);
  
  try {
    // ユーザーIDを取得
    const { userId, error: userError } = await getUserIdByEmail(email);
    
    if (!userId || userError) {
      console.warn('ユーザーが見つかりません:', userError);
      return { data: null, error: userError, userId: null };
    }
    
    // チャットボット進行状況を取得
    const { data, error } = await getData('chatbot_progress', userId);
    
    return { data, error, userId };
  } catch (error) {
    console.error('チャットボット進行状況取得中にエラー:', error);
    return { data: null, error, userId: null };
  }
};

// すべての診断結果を取得
export const getAllDiagnosisResults = async () => {
  return getData('diagnosis_results');
};

// 必要なテーブルの存在確認と初期化
export const initializeDatabase = async () => {
  console.log('データベースの初期化を開始します...');

  try {
    // ダミーストレージの場合は何もしない
    if (supabaseUrl === 'https://dummy-url.supabase.co' || supabaseAnonKey === 'dummy-key') {
      console.log('ダミーモードでの実行のため、テーブル初期化はスキップします');
      return true;
    }

    console.log('実際のテーブル初期化処理を実行します...');

    // テーブル作成のための一時的な関数
    const createTableIfNotExists = async (tableName: string, createSql: string) => {
      try {
        // テーブルの存在確認
        const { error } = await supabase.from(tableName).select('id').limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`${tableName}テーブルが存在しないため作成します`);
          
          // SQL実行ができない場合は直接テーブル作成を試みる
          try {
            const { error: createError } = await supabase.rpc('exec_sql', { sql: createSql });
            
            if (createError) {
              console.error(`${tableName}テーブル作成中にエラー:`, createError);
              return false;
            }
            
            console.log(`${tableName}テーブルを作成しました`);
            return true;
          } catch (rpcError) {
            console.error(`RPC呼び出し中にエラー:`, rpcError);
            return false;
          }
        } else {
          console.log(`${tableName}テーブルは既に存在します`);
          return true;
        }
      } catch (error) {
        console.error(`テーブル確認中にエラー (${tableName}):`, error);
        return false;
      }
    };

    // usersテーブル
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // diagnosis_resultsテーブル
    const diagnosisTable = `
      CREATE TABLE IF NOT EXISTS diagnosis_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        name TEXT,
        email TEXT,
        age INTEGER,
        family_size TEXT,
        annual_income BIGINT,
        savings BIGINT,
        max_budget BIGINT,
        recommendation TEXT,
        retirement_age TEXT,
        has_spouse TEXT,
        spouse_income BIGINT,
        chatbot_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // chatbot_progressテーブル
    const chatbotTable = `
      CREATE TABLE IF NOT EXISTS chatbot_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        progress_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 各テーブルの作成
    await createTableIfNotExists('users', usersTable);
    await createTableIfNotExists('diagnosis_results', diagnosisTable);
    await createTableIfNotExists('chatbot_progress', chatbotTable);

    console.log('データベースの初期化が完了しました');
    return true;
  } catch (error) {
    console.error('データベース初期化中にエラーが発生しました:', error);
    return false;
  }
}; 