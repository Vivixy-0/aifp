-----------------------------------------------
-- Row Level Security (RLS) ポリシー設定
-----------------------------------------------

-- すべての権限を持つポリシー（サービスロールのみ）
CREATE POLICY "サービスロールはすべてのアクセス権を持つ"
ON users
FOR ALL
USING (true)
WITH CHECK (true);

-- ユーザーデータの読み取りポリシー
CREATE POLICY "ユーザーテーブルの読み取りを許可"
ON users
FOR SELECT
USING (true);

CREATE POLICY "ユーザーテーブルの挿入を許可"
ON users
FOR INSERT
WITH CHECK (true);

CREATE POLICY "ユーザーテーブルの更新を許可"
ON users
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 診断結果のポリシー
CREATE POLICY "診断結果テーブルの読み取りを許可"
ON diagnosis_results
FOR SELECT
USING (true);  -- すべてのレコードが読み取り可能（パブリックアクセス）

CREATE POLICY "診断結果の挿入を許可"
ON diagnosis_results
FOR INSERT
WITH CHECK (true);  -- すべての挿入を許可

CREATE POLICY "診断結果の更新を許可"
ON diagnosis_results
FOR UPDATE
USING (true)
WITH CHECK (true);

-- チャットボット進行状況ポリシー
CREATE POLICY "チャットボット進行状況の読み取りを許可"
ON chatbot_progress
FOR SELECT
USING (true);

CREATE POLICY "チャットボット進行状況の挿入を許可"
ON chatbot_progress
FOR INSERT
WITH CHECK (true);

CREATE POLICY "チャットボット進行状況の更新を許可"
ON chatbot_progress
FOR UPDATE
USING (true)
WITH CHECK (true); 