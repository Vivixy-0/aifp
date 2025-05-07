'use client';

import React from 'react';

interface PrivacyPolicyStepProps {
  agreeToPrivacyPolicy: boolean;
  onAgreeChange: (e: any) => void;
  onNext: () => void;
}

const PrivacyPolicyStep = ({ agreeToPrivacyPolicy, onAgreeChange, onNext }: PrivacyPolicyStepProps) => {
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">プライバシーポリシー</h2>
      
      <div className="mb-6 h-64 overflow-y-auto p-4 border border-gray-200 rounded-md">
        <h3 className="text-lg font-semibold mb-3">個人情報の取り扱いについて</h3>
        <p className="mb-4">
          当サービスでは、住宅予算診断を提供するにあたり、以下の個人情報を取得します。
        </p>
        
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li>氏名</li>
          <li>メールアドレス</li>
          <li>年齢</li>
          <li>家族構成</li>
          <li>収入に関する情報</li>
          <li>資産や負債に関する情報</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-3">個人情報の利用目的</h3>
        <p className="mb-4">
          取得した個人情報は、以下の目的で利用します。
        </p>
        
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li>住宅予算診断サービスの提供</li>
          <li>診断結果に基づくアドバイスの提供</li>
          <li>サービス改善のための統計データ作成（個人を特定しない形での利用）</li>
          <li>ユーザーからのお問い合わせへの対応</li>
        </ul>
        
        <h3 className="text-lg font-semibold mb-3">第三者提供について</h3>
        <p className="mb-4">
          当サービスでは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
        </p>
        
        <h3 className="text-lg font-semibold mb-3">データの保管期間</h3>
        <p className="mb-4">
          取得した個人情報は、最終アクセスから2年間保管した後、適切に削除します。
        </p>
        
        <h3 className="text-lg font-semibold mb-3">お問い合わせ</h3>
        <p>
          個人情報の取り扱いに関するお問い合わせは、info@example.comまでご連絡ください。
        </p>
      </div>
      
      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          id="agreeToPrivacyPolicy"
          name="agreeToPrivacyPolicy"
          checked={agreeToPrivacyPolicy}
          onChange={onAgreeChange}
          className="mr-2 h-5 w-5"
        />
        <label htmlFor="agreeToPrivacyPolicy" className="text-base">
          プライバシーポリシーに同意します
        </label>
      </div>
      
      <div className="text-center">
        <button
          type="button"
          onClick={onNext}
          disabled={!agreeToPrivacyPolicy}
          className={`px-6 py-3 rounded-md ${
            agreeToPrivacyPolicy
              ? 'bg-primary text-white hover:bg-opacity-90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          次へ進む
        </button>
      </div>
    </div>
  );
};

export default PrivacyPolicyStep; 