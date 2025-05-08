# AIFP - 安心予算AI診断＆シミュレーションチャットボット

AI Financial Planner - あなたの財務計画をサポートするAIツール

## 概要

このプロジェクトは、AIを活用した財務計画サポートツールです。家計健全度診断とシミュレーションを行うAIチャットボットとして、ユーザーの収入や支出のデータを分析し、最適な予算配分や貯蓄計画を提案します。Vercel AI SDKとOpenAI、SupabaseのPostgreSQLベクトルデータベースを使用したRAG（Retrieval Augmented Generation）実装により、信頼性の高い財務アドバイスを提供します。

## 機能概要

- **チャットインターフェース**: リアルタイムストリーミングによる会話形式の操作
- **RAG (Retrieval Augmented Generation)**: 金融知識データベースからの関連情報検索と回答生成
- **簡易診断**: 主要な家計指標を即時計算しシグナル表示
- **詳細シミュレーション**: 複数の将来シナリオのMonte Carloシミュレーション
- **ユーザー管理**: Supabaseによる認証と権限管理
- **レポート生成**: 診断・シミュレーション結果のPDF出力
- **AI住宅予算診断**: 住宅購入に関する予算診断と提案

## 技術スタック

- **フロントエンド**: Next.js, React, Tailwind CSS
- **AI**: OpenAI GPT, AI SDK, Vector Embeddings
- **バックエンド**: Next.js API Routes (Edge Runtime)
- **データベース**: Supabase (PostgreSQL + pgvector)
- **認証**: Supabase Auth
- **視覚化**: Recharts

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- Supabaseアカウント
- OpenAIアカウントとAPIキー

### インストール手順

1. リポジトリをクローン

```bash
git clone https://github.com/Vivixy-0/aifp.git
cd aifp
npm install
```

2. 環境変数の設定

`.env.local`ファイルを作成し、以下の変数を設定:

```
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI設定
OPENAI_API_KEY=your-openai-api-key

# ベースURL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. Supabaseデータベースのセットアップ

Supabaseダッシュボードでプロジェクトを作成し、PostgreSQLデータベースに必要なスキーマを設定します。カスタムセットアップスクリプトを実行:

```bash
npx tsx lib/db/setup-supabase.ts
```

4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で利用可能になります。

## RAGナレッジベースの構築

金融知識のナレッジベースを構築するには、以下のスクリプトを使用します:

```typescript
import { storeDocument } from '@/lib/ai/rag';

// ナレッジベースに金融情報を追加する例
async function seedKnowledgeBase() {
  await storeDocument(
    '貯蓄率は手取り収入に対する貯蓄額の割合で、一般的に20%以上が推奨されます。',
    { category: 'financial_literacy', topic: 'savings_rate' }
  );
  
  // さらにドキュメントを追加...
}

seedKnowledgeBase();
```

## プロジェクト構造

```
aifp/
├── app/                 # Next.js App Router
│   ├── api/             # APIエンドポイント
│   │   ├── ai/          # AI関連API
│   │   └── auth/        # 認証関連API
│   ├── auth/            # 認証関連ページ
│   ├── dashboard/       # ダッシュボード
│   └── simulation/      # シミュレーションページ
├── components/          # Reactコンポーネント
│   ├── ui/              # 共通UIコンポーネント
│   ├── chat/            # チャット関連コンポーネント
│   ├── assessment/      # 診断関連コンポーネント
│   └── simulation/      # シミュレーション関連コンポーネント
├── lib/                 # ユーティリティ関数
│   ├── db/              # データベース関連
│   ├── ai/              # AI/RAG関連
│   ├── auth/            # 認証関連
│   └── utils/           # 汎用ユーティリティ
├── migrations/          # データベースマイグレーション
└── public/              # 静的ファイル
```

## ライセンス

MIT 