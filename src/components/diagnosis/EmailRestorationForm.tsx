'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface EmailRestorationFormProps {
  onRestore: (userId: string) => void;
  onCancel: () => void;
}

const EmailRestorationForm = ({ onRestore, onCancel }: EmailRestorationFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log('復元フォームが送信されました。メールアドレス:', email);
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!email.trim()) {
        console.log('メールアドレスが空です');
        setError('メールアドレスを入力してください');
        return;
      }
      
      // メールアドレスからデータを取得
      console.log('メールアドレスからデータを取得します:', email);
      
      // ユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      console.log('ユーザー検索結果:', { userData, userError });
      
      if (userError || !userData) {
        console.error('ユーザーデータ取得エラー:', userError);
        setError('指定されたメールアドレスの保存データが見つかりませんでした');
        return;
      }
      
      const userId = userData.id;
      console.log('ユーザーID取得成功:', userId);
      
      // 見つかったユーザーIDで復元処理を実行
      onRestore(userId);
    } catch (err) {
      console.error('復元処理中にエラーが発生しました:', err);
      setError('予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">以前の回答データを復元</h2>
      <p className="mb-4">以前に診断を途中まで行ったメールアドレスを入力してください。</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="例: example@example.com"
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => {
              console.log('キャンセルボタンがクリックされました');
              onCancel();
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
            disabled={isLoading}
          >
            {isLoading ? '確認中...' : 'データを復元'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailRestorationForm; 