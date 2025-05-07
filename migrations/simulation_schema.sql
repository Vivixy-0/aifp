-- シミュレーション関連テーブルの作成
-- 拡張機能の有効化を確認
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------
-- シミュレーション実行テーブル
-----------------------------------------------
CREATE TABLE IF NOT EXISTS simulation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  diagnosis_result_id UUID REFERENCES diagnosis_results(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  parameters JSONB NOT NULL,
  summary JSONB,
  simple_budget_max NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-----------------------------------------------
-- シミュレーション年次データテーブル
-----------------------------------------------
CREATE TABLE IF NOT EXISTS simulation_yearly_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES simulation_runs(id) ON DELETE CASCADE,
  year INT NOT NULL,
  age INT NOT NULL,
  income_total NUMERIC NOT NULL,
  expense_total NUMERIC NOT NULL,
  cashflow NUMERIC NOT NULL,
  balance_end NUMERIC NOT NULL,
  mortgage_principal NUMERIC NOT NULL DEFAULT 0,
  mortgage_interest NUMERIC NOT NULL DEFAULT 0,
  education_cost NUMERIC NOT NULL DEFAULT 0,
  insurance_cost NUMERIC NOT NULL DEFAULT 0,
  investment_balance NUMERIC NOT NULL DEFAULT 0,
  investment_yield NUMERIC NOT NULL DEFAULT 0,
  pension_income NUMERIC NOT NULL DEFAULT 0,
  other_events JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS simulation_runs_user_id_idx ON simulation_runs (user_id);
CREATE INDEX IF NOT EXISTS simulation_runs_diagnosis_id_idx ON simulation_runs (diagnosis_result_id);
CREATE INDEX IF NOT EXISTS simulation_yearly_data_run_id_idx ON simulation_yearly_data (run_id);
CREATE INDEX IF NOT EXISTS simulation_yearly_data_year_idx ON simulation_yearly_data (run_id, year);

-- Row Level Securityを有効にする
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_yearly_data ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの設定
CREATE POLICY "シミュレーション実行テーブルの読み取りを許可"
ON simulation_runs
FOR SELECT
USING (true);

CREATE POLICY "シミュレーション実行テーブルの挿入を許可"
ON simulation_runs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "シミュレーション年次データテーブルの読み取りを許可"
ON simulation_yearly_data
FOR SELECT
USING (true);

CREATE POLICY "シミュレーション年次データテーブルの挿入を許可"
ON simulation_yearly_data
FOR INSERT
WITH CHECK (true);

-----------------------------------------------
-- シミュレーション関連関数
-----------------------------------------------

-- 住宅ローン計算関数
CREATE OR REPLACE FUNCTION fn_calculate_mortgage_schedule(
  principal NUMERIC,
  annual_rate NUMERIC,
  term_years INT,
  repayment_type TEXT DEFAULT 'fixed',
  extra_payments JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE(
  year INT,
  principal_paid NUMERIC,
  interest_paid NUMERIC,
  balance NUMERIC
) AS $$
DECLARE
  monthly_rate NUMERIC := annual_rate/12/100;
  total_months INT := term_years*12;
  fixed_payment NUMERIC;
  curr_balance NUMERIC := principal;
  curr_year INT := 1;
  year_principal NUMERIC := 0;
  year_interest NUMERIC := 0;
  month_in_year INT := 1;
  month_principal NUMERIC;
  month_interest NUMERIC;
  extra_payment NUMERIC;
  curr_month INT := 1;
BEGIN
  IF repayment_type = 'fixed' OR repayment_type IS NULL THEN
    -- 元利均等返済の場合の月額計算
    fixed_payment := principal * (monthly_rate * power(1+monthly_rate, total_months)) / (power(1+monthly_rate, total_months) - 1);
  ELSE
    -- 元金均等返済の場合
    fixed_payment := principal / total_months;
  END IF;
  
  -- 月次ループ
  WHILE curr_month <= total_months AND curr_balance > 0 LOOP
    IF repayment_type = 'fixed' OR repayment_type IS NULL THEN
      -- 元利均等返済の場合
      month_interest := curr_balance * monthly_rate;
      month_principal := fixed_payment - month_interest;
    ELSE
      -- 元金均等返済の場合
      month_principal := principal / total_months;
      month_interest := curr_balance * monthly_rate;
    END IF;
    
    -- 繰り上げ返済の適用
    extra_payment := 0;
    IF extra_payments IS NOT NULL AND extra_payments ? (curr_year::text) THEN
      extra_payment := (extra_payments->>curr_year::text)::NUMERIC;
      IF extra_payment > curr_balance THEN
        extra_payment := curr_balance;
      END IF;
    END IF;
    
    -- 残高更新
    month_principal := month_principal + extra_payment;
    IF month_principal > curr_balance THEN
      month_principal := curr_balance;
    END IF;
    curr_balance := curr_balance - month_principal;
    
    -- 年間の集計
    year_principal := year_principal + month_principal;
    year_interest := year_interest + month_interest;
    
    -- 月カウンタ更新
    month_in_year := month_in_year + 1;
    curr_month := curr_month + 1;
    
    -- 1年が終わったら集計結果を出力
    IF month_in_year > 12 OR curr_month > total_months OR curr_balance <= 0 THEN
      year := curr_year;
      principal_paid := year_principal;
      interest_paid := year_interest;
      balance := curr_balance;
      RETURN NEXT;
      
      -- 年ごとの変数リセット
      curr_year := curr_year + 1;
      month_in_year := 1;
      year_principal := 0;
      year_interest := 0;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 収支計算関数
CREATE OR REPLACE FUNCTION fn_calculate_income_expenses(
  params JSONB,
  target_year INT,
  current_age INT
) RETURNS JSONB AS $$
DECLARE
  income NUMERIC := 0;
  expense NUMERIC := 0;
  breakdown JSONB := '{}'::JSONB;
  base_salary NUMERIC;
  spouse_salary NUMERIC := 0;
  raise_rate NUMERIC := 0.02; -- 昇給率
  inflation_rate NUMERIC := 0.01; -- インフレ率
  living_expense NUMERIC;
  tax_rate NUMERIC;
  retirement_age INT;
  is_retired BOOLEAN := FALSE;
  age_in_year INT;
BEGIN
  -- 基本パラメータの取得
  base_salary := COALESCE((params->>'annualIncome')::NUMERIC, 0);
  IF params->>'spouseIncome' IS NOT NULL AND (params->>'hasSpouse')::TEXT = 'はい' THEN
    spouse_salary := COALESCE((params->>'spouseIncome')::NUMERIC, 0);
  END IF;
  living_expense := COALESCE((params->>'monthlyLivingExpenses')::NUMERIC, 200000) * 12;
  retirement_age := COALESCE((params->>'retirementAge')::NUMERIC, 65);
  
  -- 対象年の年齢計算
  age_in_year := current_age + target_year - 1;
  
  -- 退職判定
  is_retired := age_in_year >= retirement_age;
  
  -- 収入計算
  IF NOT is_retired THEN
    -- 昇給を考慮
    IF age_in_year >= 50 THEN
      -- 50歳以上は年収が110%
      income := base_salary * 1.1 * power(1 + raise_rate, target_year - 1);
    ELSE
      -- 通常の昇給
      income := base_salary * power(1 + raise_rate, target_year - 1);
    END IF;
    
    -- 配偶者収入
    IF spouse_salary > 0 THEN
      IF age_in_year >= retirement_age - 2 THEN -- 配偶者は2歳若いと仮定
        -- 配偶者が退職した場合
        income := income + spouse_salary * 0.6;
      ELSE
        -- 配偶者も昇給
        income := income + spouse_salary * power(1 + raise_rate, target_year - 1);
      END IF;
    END IF;
  ELSE
    -- 退職後は収入が60%に減少
    income := base_salary * 0.6;
    
    -- 配偶者収入（退職後）
    IF spouse_salary > 0 THEN
      income := income + spouse_salary * 0.6;
    END IF;
  END IF;
  
  -- 税率計算（簡易）
  IF income > 10000000 THEN
    tax_rate := 0.33;
  ELSIF income > 6000000 THEN
    tax_rate := 0.23;
  ELSIF income > 3300000 THEN
    tax_rate := 0.2;
  ELSE
    tax_rate := 0.1;
  END IF;
  
  -- 税金計算
  DECLARE
    tax_amount NUMERIC := income * tax_rate;
  BEGIN
    expense := tax_amount;
    breakdown := jsonb_set(breakdown, '{tax}', to_jsonb(tax_amount));
  END;
  
  -- 生活費計算（インフレ考慮）
  DECLARE
    inflated_living NUMERIC := living_expense * power(1 + inflation_rate, target_year - 1);
  BEGIN
    expense := expense + inflated_living;
    breakdown := jsonb_set(breakdown, '{living}', to_jsonb(inflated_living));
  END;
  
  -- その他支出（収入の10%と仮定）
  DECLARE
    other_expense NUMERIC := income * 0.1;
  BEGIN
    expense := expense + other_expense;
    breakdown := jsonb_set(breakdown, '{other}', to_jsonb(other_expense));
  END;
  
  -- イベント費用（params->'events'から）
  IF params->'events' IS NOT NULL AND params->'events' ? target_year::TEXT THEN
    DECLARE
      event_amount NUMERIC := (params->'events'->target_year::TEXT->>'amount')::NUMERIC;
      event_type TEXT := params->'events'->target_year::TEXT->>'type';
    BEGIN
      expense := expense + event_amount;
      breakdown := jsonb_set(breakdown, ARRAY[event_type], to_jsonb(event_amount));
    END;
  END IF;
  
  -- 結果の返却
  RETURN jsonb_build_object(
    'income_total', income,
    'expense_total', expense,
    'breakdown', breakdown
  );
END;
$$ LANGUAGE plpgsql;

-- 教育費計算関数
CREATE OR REPLACE FUNCTION fn_calculate_education_costs(
  params JSONB,
  target_year INT,
  current_age INT
) RETURNS NUMERIC AS $$
DECLARE
  total_cost NUMERIC := 0;
  child_ages TEXT[];
  child_age INT;
  child_count INT;
  education_policy TEXT;
  base_expense NUMERIC;
  policy_factor NUMERIC := 1.0;
  inflation_rate NUMERIC := 0.01;
BEGIN
  -- 子供情報の取得
  child_count := COALESCE((params->>'childrenCount')::INT, 0);
  IF child_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- 教育方針の取得
  education_policy := COALESCE(params->>'educationPolicy', '公立中心');
  IF education_policy = '私立中心' THEN
    policy_factor := 1.5;
  ELSIF education_policy = '公私混合' THEN
    policy_factor := 1.2;
  END IF;
  
  -- 子供の年齢情報を解析
  IF params->>'childrenAges' IS NOT NULL THEN
    -- 文字列から子供の年齢情報を取得（シンプルな実装）
    DECLARE
      child_ages_text TEXT := params->>'childrenAges';
      base_child_age INT := 5; -- デフォルト値
    BEGIN
      IF child_ages_text LIKE '%未就学児%' THEN
        base_child_age := 3;
      ELSIF child_ages_text LIKE '%小学生%' THEN
        base_child_age := 9;
      ELSIF child_ages_text LIKE '%中学生%' THEN
        base_child_age := 13;
      ELSIF child_ages_text LIKE '%高校生%' THEN
        base_child_age := 16;
      ELSIF child_ages_text LIKE '%大学生%' THEN
        base_child_age := 20;
      END IF;
      
      -- 子供ごとに計算
      FOR i IN 1..child_count LOOP
        -- 対象年の子供の年齢
        child_age := base_child_age + target_year - 1;
        
        -- 年齢に応じた教育費
        IF child_age < 6 THEN
          -- 未就学児
          base_expense := 3 * 10000 * 12; -- 月3万円
        ELSIF child_age < 12 THEN
          -- 小学生
          base_expense := 5 * 10000 * 12; -- 月5万円
        ELSIF child_age < 15 THEN
          -- 中学生
          base_expense := 8 * 10000 * 12; -- 月8万円
        ELSIF child_age < 18 THEN
          -- 高校生
          base_expense := 12 * 10000 * 12; -- 月12万円
        ELSIF child_age < 22 THEN
          -- 大学生
          base_expense := 15 * 10000 * 12; -- 月15万円
        ELSE
          -- 22歳以上は教育費なし
          base_expense := 0;
        END IF;
        
        -- 教育方針による調整
        base_expense := base_expense * policy_factor;
        
        -- インフレ考慮
        base_expense := base_expense * power(1 + inflation_rate, target_year - 1);
        
        -- 合計に加算
        total_cost := total_cost + base_expense;
      END LOOP;
    END;
  END IF;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- 保険料計算関数
CREATE OR REPLACE FUNCTION fn_calculate_insurance_costs(
  params JSONB,
  target_year INT
) RETURNS NUMERIC AS $$
DECLARE
  insurance_cost NUMERIC := 120000; -- デフォルト年間保険料
  inflation_rate NUMERIC := 0.01;
BEGIN
  -- 保険料の調整（インフレ考慮）
  RETURN insurance_cost * power(1 + inflation_rate, target_year - 1);
END;
$$ LANGUAGE plpgsql;

-- 資産運用計算関数
CREATE OR REPLACE FUNCTION fn_calculate_investment_growth(
  params JSONB,
  target_year INT,
  previous_balance NUMERIC
) RETURNS JSONB AS $$
DECLARE
  initial_investment NUMERIC := 0;
  monthly_contribution NUMERIC := 0;
  yield_rate NUMERIC := 0.03; -- デフォルト年利3%
  withdrawals NUMERIC := 0;
  new_balance NUMERIC;
  annual_yield NUMERIC;
BEGIN
  -- 初期投資額の設定（初年度のみ）
  IF target_year = 1 AND params->>'initialInvestment' IS NOT NULL THEN
    initial_investment := (params->>'initialInvestment')::NUMERIC;
  ELSE
    initial_investment := 0;
  END IF;
  
  -- 月額積立の設定
  IF params->>'monthlyContribution' IS NOT NULL THEN
    monthly_contribution := (params->>'monthlyContribution')::NUMERIC * 12;
  END IF;
  
  -- 利回り設定
  IF params->>'investmentYield' IS NOT NULL THEN
    yield_rate := (params->>'investmentYield')::NUMERIC / 100;
  END IF;
  
  -- 取り崩し設定
  IF params->'withdrawals' IS NOT NULL AND params->'withdrawals' ? target_year::TEXT THEN
    withdrawals := (params->'withdrawals'->target_year::TEXT)::NUMERIC;
  END IF;
  
  -- 残高計算
  IF target_year = 1 THEN
    new_balance := initial_investment + monthly_contribution;
  ELSE
    new_balance := previous_balance + monthly_contribution;
  END IF;
  
  -- 利息計算（単利で簡略化）
  annual_yield := new_balance * yield_rate;
  new_balance := new_balance + annual_yield;
  
  -- 取り崩し適用
  new_balance := new_balance - withdrawals;
  IF new_balance < 0 THEN
    new_balance := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'balance', new_balance,
    'yield', annual_yield,
    'contribution', monthly_contribution,
    'withdrawals', withdrawals
  );
END;
$$ LANGUAGE plpgsql;

-- 年金収入計算関数
CREATE OR REPLACE FUNCTION fn_calculate_pension_income(
  params JSONB,
  target_year INT,
  current_age INT
) RETURNS NUMERIC AS $$
DECLARE
  pension_amount NUMERIC := 0;
  retirement_age INT := COALESCE((params->>'retirementAge')::INT, 65);
  age_in_year INT := current_age + target_year - 1;
  base_pension NUMERIC := 1200000; -- デフォルト年金額（年120万円）
BEGIN
  -- 年金受給開始年齢の確認
  IF age_in_year >= retirement_age THEN
    -- 年金受給開始
    pension_amount := base_pension;
    
    -- 特定のパラメータがある場合は上書き
    IF params->>'pensionAmount' IS NOT NULL THEN
      pension_amount := (params->>'pensionAmount')::NUMERIC;
    END IF;
  END IF;
  
  RETURN pension_amount;
END;
$$ LANGUAGE plpgsql;

-- AI簡易住宅予算診断関数
CREATE OR REPLACE FUNCTION fn_calculate_simple_budget(params JSONB) RETURNS NUMERIC AS $$
DECLARE
  inc NUMERIC := COALESCE((params->>'annualIncome')::NUMERIC, 0);
  fs INT := COALESCE((params->>'familySize')::INT, 0);
  mb NUMERIC := COALESCE((params->>'mortgageLoanBalance')::NUMERIC, (params->>'existing_mortgage_balance')::NUMERIC, 0);
  mp NUMERIC := COALESCE((params->>'monthlyMortgagePayment')::NUMERIC, 0);
  sv NUMERIC := COALESCE((params->>'savings')::NUMERIC, 0);
  od NUMERIC := COALESCE((params->>'otherDebts')::NUMERIC, 0);
  max_line NUMERIC;
  lower NUMERIC := inc * 3;
  upper NUMERIC := inc * 5;
  annual_pay NUMERIC;
  burden_ratio NUMERIC;
  debt_ratio NUMERIC;
BEGIN
  -- 入力チェック
  IF inc <= 0 THEN
    RETURN 0;
  END IF;
  
  -- 家族構成による調整
  IF fs >= 4 THEN 
    upper := inc * 3.5; 
  END IF;
  
  -- 初期値
  max_line := upper;
  
  -- 既存ローン残高の控除
  max_line := max_line - mb;
  
  -- 返済負担率の計算
  annual_pay := mp * 12;
  burden_ratio := CASE WHEN inc > 0 THEN annual_pay / inc ELSE 0 END;
  
  -- 返済負担率による調整
  IF burden_ratio > 0.3 THEN
    max_line := max_line - GREATEST(500 * 10000, LEAST(1000 * 10000, (burden_ratio - 0.3) * inc * 10000));
  END IF;
  
  -- 負債比率の計算
  debt_ratio := CASE WHEN inc > 0 THEN od / inc ELSE 0 END;
  
  -- 負債比率による調整
  IF debt_ratio > 0.4 THEN
    max_line := max_line - GREATEST(500 * 10000, LEAST(1000 * 10000, (debt_ratio - 0.4) * inc * 10000));
  END IF;
  
  -- 貯金による調整
  IF sv >= inc THEN
    RETURN max_line;
  ELSE
    RETURN (lower + max_line) / 2;
  END IF;
END;
$$ LANGUAGE plpgsql; 