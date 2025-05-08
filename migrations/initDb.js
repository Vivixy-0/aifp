/**
 * Supabaseデータベース初期化スクリプト
 * 
 * 使い方:
 * 1. .env.localファイルに以下の環境変数を設定
 *    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 
 * 2. 実行: node migrations/initDb.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase接続情報
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません。.env.localファイルを確認してください。');
  process.exit(1);
}

// Supabaseクライアント（管理者権限で作成）
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQLファイルを読み込む
const readSqlFile = (filename) => {
  return fs.readFileSync(path.join(__dirname, filename), { encoding: 'utf8' });
};

// データベース初期化を実行
const initializeDatabase = async () => {
  try {
    console.log('データベースの初期化を開始します...');

    // 1. 基本スキーマの実行
    const schemaSql = readSqlFile('schema.sql');
    console.log('基本スキーマSQLを実行します...');
    await supabase.rpc('exec_sql', { sql: schemaSql }).catch(async (err) => {
      console.warn('exec_sql RPCが見つかりません。直接SQLを実行します:', err);
      
      // 管理者パスワードが必要なSQL実行方法は、Supabase管理画面から実行する必要があります
      console.log('以下のSQLをSupabase管理画面のSQL Editorで実行してください:');
      console.log(schemaSql);
      console.log('----------------------------------------------------');
    });

    // 2. RLSポリシーの実行
    try {
      const rlsSql = readSqlFile('rls_policies.sql');
      console.log('RLSポリシーを設定します...');
      await supabase.rpc('exec_sql', { sql: rlsSql }).catch((err) => {
        console.warn('RLSポリシーの設定に失敗しました:', err);
        console.log('以下のSQLをSupabase管理画面のSQL Editorで実行してください:');
        console.log(rlsSql);
      });
    } catch (error) {
      console.error('RLSポリシーファイルの読み込みに失敗しました:', error);
    }

    // 3. シミュレーション関連スキーマの実行
    try {
      const simulationSql = readSqlFile('simulation_schema.sql');
      console.log('シミュレーションスキーマを設定します...');
      await supabase.rpc('exec_sql', { sql: simulationSql }).catch((err) => {
        console.warn('シミュレーションスキーマの設定に失敗しました:', err);
        console.log('以下のSQLをSupabase管理画面のSQL Editorで実行してください:');
        console.log(simulationSql);
      });
    } catch (error) {
      console.error('シミュレーションスキーマファイルの読み込みに失敗しました:', error);
    }

    // 4. ストレージバケット作成（ファイルアップロード用）
    console.log('ストレージバケットを作成します...');
    await supabase.storage.createBucket('pdfs', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    }).catch(err => {
      if (err.message && err.message.includes('already exists')) {
        console.log('pdfsバケットはすでに存在します');
      } else {
        console.warn('ストレージバケット作成エラー:', err);
      }
    });

    console.log('データベースの初期化が完了しました。');
  } catch (error) {
    console.error('データベース初期化中にエラーが発生しました:', error);
  }
};

// スクリプト実行
initializeDatabase(); 