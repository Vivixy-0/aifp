'use client';
import React from 'react';

interface ResultStepProps {
  formData: any;
  result: any;
  onDownloadPdf: () => Promise<void>;
  onScheduleMeeting: () => void;
  onRestart: () => void;
  isLoading?: boolean;
}

const ResultStep = ({ formData, result, onDownloadPdf, onScheduleMeeting, onRestart, isLoading = false }: ResultStepProps) => {
  // フォーマット関数
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">住宅予算診断結果</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-semibold mb-2 text-primary">{formData.name}様の予算診断</h3>
        <p className="mb-4">あなたの情報に基づいた住宅購入予算の診断結果です。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <span className="font-semibold">年齢:</span> {formData.age}歳
          </div>
          <div>
            <span className="font-semibold">年収:</span> {formatAmount(parseInt(formData.annualIncome || '0'))}円
          </div>
          <div>
            <span className="font-semibold">貯蓄額:</span> {formatAmount(parseInt(formData.savings || '0'))}円
          </div>
        </div>
      </div>
      
      <div className="border-t border-b py-6 my-6">
        <h3 className="text-xl font-bold mb-4 text-center text-primary">最大購入可能予算</h3>
        <p className="text-3xl font-bold text-center text-primary mb-4">
          {formatAmount(result.maxBudget)}円
        </p>
        <p className="text-center mb-4">
          この金額は、あなたの収入と貯蓄状況を考慮した理論上の最大予算です。
          ただし、生活の質を維持するためには、この金額より低めの予算設定をおすすめします。
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">おすすめポイント</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p>{result.recommendation || 'あなたの状況に合わせたおすすめの住宅予算は上記の通りです。'}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button
          onClick={onDownloadPdf}
          disabled={isLoading}
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-400"
        >
          {isLoading ? '生成中...' : '診断結果をPDFでダウンロード'}
        </button>
        
        <button
          onClick={onScheduleMeeting}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          FPに相談する
        </button>
        
        <button
          onClick={onRestart}
          className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          もう一度診断する
        </button>
      </div>
    </div>
  );
};

export default ResultStep;
