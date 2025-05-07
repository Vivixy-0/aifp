# 手動データベースセットアップ手順

このガイドでは、Supabase管理画面を使って手動でデータベースをセットアップする方法を説明します。

## 前提条件

- Supabaseアカウントとプロジェクトが作成されていること
- プロジェクトの管理者権限があること

## 手順

### 1. 基本スキーマの設定

1. Supabase管理画面にログイン
2. 左メニューから「SQL Editor」を選択
3. 「New query」をクリック
4. `migrations/schema.sql`の内容をコピー＆ペースト
5. 「Run」ボタンをクリック
6. 実行が完了するのを確認（エラーが出ないこと）

### 2. RLSポリシーの設定

1. 再度「New query」をクリック
2. `migrations/rls_policies.sql`の内容をコピー＆ペースト
3. 「Run」ボタンをクリック
4. 実行が完了するのを確認

### 3. シミュレーションスキーマの設定

1. 再度「New query」をクリック
2. `migrations/simulation_schema.sql`の内容をコピー＆ペースト
3. 「Run」ボタンをクリック
4. 実行が完了するのを確認

### 4. ストレージバケットの作成

1. 左メニューから「Storage」を選択
2. 「Create bucket」をクリック
3. 以下の設定で新しいバケットを作成:
   - Name: `pdfs`
   - Public bucket: オフ（チェックを外す）
   - File size limit: `10MB`
4. 「Create bucket」をクリック

## 検証

セットアップが正しく完了したことを確認するには:

1. 左メニューから「Table Editor」を選択
2. 以下のテーブルが存在することを確認:
   - `users`
   - `diagnosis_results`
   - `chatbot_progress`
   - `simulation_runs`
   - `simulation_yearly_data`

3. テーブルの列定義を確認:
   - `diagnosis_results`テーブルに適切なフィールドがあるか
   - `chatbot_progress`テーブルに`progress_data`フィールドがあるか

4. RLSポリシーを確認:
   - 各テーブルをクリック
   - 「Authentication」タブを選択
   - 「Row Level Security」が有効になっていること
   - 適切なポリシーが設定されていること

## よくある問題と解決方法

### スキーマ実行エラー

**問題**: `schema.sql`実行時にエラーが発生する。

**解決策**:
- エラーメッセージを確認して具体的な問題を特定
- テーブルがすでに存在する場合は、該当テーブルを削除してから再実行
- ファイル冒頭に`DROP TABLE IF EXISTS`ステートメントを追加して再実行

### RLSポリシーエラー

**問題**: RLSポリシー設定時にエラーが発生する。

**解決策**:
- すでに同名のポリシーが存在する場合は削除してから再実行:
  ```sql
  DROP POLICY IF EXISTS "ポリシー名" ON テーブル名;
  ```
- テーブルごとに別々のクエリとして実行

### 関数定義エラー

**問題**: シミュレーション関数定義時にエラーが発生する。

**解決策**:
- 一つずつの関数を個別に実行
- 依存関係がある関数は順序を考慮して実行
- 既存の関数を上書きするには`CREATE OR REPLACE FUNCTION`構文を使用

## データベース初期データの挿入

テスト用に初期データを挿入するには:

```sql
-- テストユーザーの作成
INSERT INTO users (name, email)
VALUES ('テストユーザー', 'test@example.com');

-- テスト診断結果の作成
INSERT INTO diagnosis_results (
  user_id,
  name,
  email,
  age,
  family_size,
  annual_income,
  savings,
  max_budget,
  has_spouse,
  spouse_income,
  chatbot_data
)
SELECT 
  id,
  '山田太郎',
  'test@example.com',
  35,
  '3人家族',
  6000000,
  10000000,
  30000000,
  'はい',
  4000000,
  '{"annualIncome": "600万円", "savings": "1000万円", "hasSpouse": "はい", "spouseIncome": "400万円"}'::jsonb
FROM users
WHERE email = 'test@example.com';
```

## バックアップと復元

定期的にデータベースをバックアップすることをお勧めします:

1. 左メニューから「Project Settings」を選択
2. 「Database」タブを選択
3. 「Backups」セクションで「Create a backup」をクリック 