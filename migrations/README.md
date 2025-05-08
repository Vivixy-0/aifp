# データベースセットアップ手順

このディレクトリには、AI住宅予算診断システムのためのデータベーススキーマ定義とセットアップスクリプトが含まれています。

## ファイル構成

- `schema.sql`: 基本的なデータベーススキーマ（ユーザー、診断結果、チャットボットの進行状況）
- `rls_policies.sql`: Row Level Security（RLS）ポリシー
- `simulation_schema.sql`: シミュレーション機能のためのスキーマとSQL関数
- `initDb.js`: データベース初期化スクリプト
- `MANUAL_SETUP.md`: 手動セットアップの詳細手順

## 自動セットアップ（推奨）

自動セットアップは最も簡単で確実な方法です。

### 前提条件

- Supabaseプロジェクトが作成済みであること
- Node.jsがインストールされていること
- `.env.local`ファイルに以下の環境変数が設定されていること:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

### 手順

1. 必要なパッケージをインストール
   ```bash
   npm install
   ```

2. 初期化スクリプトを実行
   ```bash
   node migrations/initDb.js
   ```

3. スクリプト実行中にエラーが出た場合は、Supabase管理画面のSQL Editorで表示されたSQLクエリを実行してください。

## 手動セットアップ

自動セットアップが何らかの理由で失敗した場合は、手動でデータベースをセットアップできます。

### 手順

1. Supabase管理画面にログイン
2. SQL Editorを開く
3. 以下の順序でSQLファイルを実行:
   - まず`schema.sql`
   - 次に`rls_policies.sql`
   - 最後に`simulation_schema.sql`

詳細な手順については`MANUAL_SETUP.md`を参照してください。

## データベース構造

### 主要テーブル

1. `users` - ユーザー情報を保存
   - id, name, email, created_at, updated_at

2. `diagnosis_results` - 診断結果を保存
   - 基本情報（年齢、家族構成、年収、貯蓄など）
   - 住宅ローン情報
   - 家族情報（配偶者、子供など）
   - 資産情報
   - 投資情報
   - 支出情報
   - 教育・退職関連情報
   - チャットボットデータ

3. `chatbot_progress` - チャットボットの進行状況を保存
   - progress_dataフィールドに対話の進行状況をJSON形式で保存

### シミュレーション関連テーブル

1. `simulation_runs` - シミュレーション実行情報を保存
   - シミュレーションのパラメータとサマリー

2. `simulation_yearly_data` - シミュレーションの年次データを保存
   - 各年の収入、支出、キャッシュフロー、教育費など詳細情報

## トラブルシューティング

- **エラー: exec_sql関数が見つかりません**
  - Supabase管理画面のSQL Editorで`schema.sql`を実行し、関数を作成してください。

- **エラー: テーブル/関数の重複**
  - Supabase管理画面でテーブルを削除してから再実行してください。

- **権限エラー**
  - `.env.local`のSUPABASE_SERVICE_ROLE_KEYが正しいか確認してください。
  - または、SQL Editorから手動で実行してください。 