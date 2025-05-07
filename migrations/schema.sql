-- UUIDを使用するための拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SQL実行用のRPC関数
CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-----------------------------------------------
-- ユーザーテーブル
-----------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------
-- 診断結果テーブル
-----------------------------------------------
CREATE TABLE IF NOT EXISTS diagnosis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  
  -- 基本情報
  age INTEGER,
  family_size TEXT,
  annual_income BIGINT,
  savings BIGINT,
  
  -- 住宅ローン情報
  mortgage_loan_balance BIGINT,
  monthly_mortgage_payment BIGINT,
  other_debts BIGINT,
  
  -- 診断結果
  max_budget BIGINT,
  recommendation TEXT,
  
  -- 家族情報
  head_of_household_age TEXT,
  has_spouse TEXT,
  spouse_age TEXT,
  children_count INTEGER,
  children_ages TEXT,
  plan_more_children TEXT,
  
  -- 収入情報
  spouse_income BIGINT,
  maternity_leave_plan TEXT,
  
  -- 資産関連情報
  financial_assets BIGINT,
  has_retirement_bonus TEXT,
  retirement_bonus_amount BIGINT,
  
  -- 投資関連情報
  initial_investment BIGINT,
  monthly_contribution BIGINT,
  investment_yield NUMERIC,
  
  -- 支出関連情報
  plan_to_sell_house TEXT,
  current_rent BIGINT,
  current_insurance BIGINT,
  monthly_living_expenses BIGINT,
  hobby_expenses BIGINT,
  travel_frequency TEXT,
  
  -- 教育・退職関連
  education_policy TEXT,
  retirement_age TEXT,
  
  -- ローン関連
  loan_years INTEGER,
  expected_interest_rate NUMERIC,
  
  -- チャットボットデータ保存用
  chatbot_data JSONB,
  
  -- 拡張可能性のためのJSONフィールド
  additional_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------------
-- チャットボット進行状況テーブル
-----------------------------------------------
CREATE TABLE IF NOT EXISTS chatbot_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 更新日時を自動設定するための関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新日時自動更新トリガー
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_results_updated_at
BEFORE UPDATE ON diagnosis_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chatbot_progress_updated_at
BEFORE UPDATE ON chatbot_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Securityを有効にする
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_progress ENABLE ROW LEVEL SECURITY;

-- インデックスを追加して検索パフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_user_id ON diagnosis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_results_email ON diagnosis_results(email);
CREATE INDEX IF NOT EXISTS idx_chatbot_progress_user_id ON chatbot_progress(user_id);

-- 金額文字列処理ヘルパー関数
CREATE OR REPLACE FUNCTION process_amount_text(amount_text TEXT) RETURNS NUMERIC AS $$
DECLARE
  numeric_part TEXT;
  result NUMERIC;
BEGIN
  IF amount_text IS NULL OR amount_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- 「なし」の処理
  IF amount_text = 'なし' THEN
    RETURN 0;
  END IF;
  
  -- 万円表記処理
  IF amount_text LIKE '%万円%' THEN
    -- 数値部分の抽出
    numeric_part := regexp_replace(amount_text, '[^0-9０-９.～〜-]', '', 'g');
    
    -- 範囲表記の処理
    IF numeric_part LIKE '%～%' OR numeric_part LIKE '%〜%' OR numeric_part LIKE '%-%' THEN
      -- 範囲の平均値を計算
      DECLARE
        parts TEXT[];
        min_val NUMERIC;
        max_val NUMERIC;
      BEGIN
        parts := regexp_split_to_array(numeric_part, '[～〜-]');
        IF array_length(parts, 1) >= 2 THEN
          min_val := parts[1]::NUMERIC;
          max_val := parts[2]::NUMERIC;
          result := ((min_val + max_val) / 2) * 10000;
          RETURN result;
        END IF;
      END;
    END IF;
    
    -- 単一値の処理
    result := numeric_part::NUMERIC * 10000;
    RETURN result;
  END IF;
  
  -- その他の数値表記
  numeric_part := regexp_replace(amount_text, '[^0-9.]', '', 'g');
  IF numeric_part = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN numeric_part::NUMERIC;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error converting amount text: %', amount_text;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql; 