'use client';

import React from 'react';

interface DetailedInfoStepProps {
  formData: {
    age: string;
    familySize: string;
    annualIncome: string;
    savings: string;
    mortgageLoanBalance: string;
    monthlyMortgagePayment: string;
    otherDebts: string;
  };
  onChange: (e: any) => void;
  onNext: () => void;
  onBack: () => void;
  errors: {
    age: string;
    familySize: string;
    annualIncome: string;
    savings: string;
    mortgageLoanBalance: string;
    monthlyMortgagePayment: string;
    otherDebts: string;
  };
}

const DetailedInfoStep = ({ formData, onChange, onNext, onBack, errors }: DetailedInfoStepProps) => {
  const handleSubmit = (e: any) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">詳細情報入力</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              年齢 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="age"
              name="age"
              value={formData.age}
              onChange={onChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.age ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例: 35"
            />
            {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age}</p>}
          </div>
          
          <div>
            <label htmlFor="familySize" className="block text-sm font-medium text-gray-700 mb-1">
              家族構成 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="familySize"
              name="familySize"
              value={formData.familySize}
              onChange={onChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.familySize ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例: 3人家族（夫婦・子1人）"
            />
            {errors.familySize && <p className="mt-1 text-sm text-red-500">{errors.familySize}</p>}
          </div>
          
          <div>
            <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-1">
              年収（税込） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="annualIncome"
              name="annualIncome"
              value={formData.annualIncome}
              onChange={onChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.annualIncome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例: 600万円"
            />
            {errors.annualIncome && <p className="mt-1 text-sm text-red-500">{errors.annualIncome}</p>}
          </div>
          
          <div>
            <label htmlFor="savings" className="block text-sm font-medium text-gray-700 mb-1">
              貯蓄額 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="savings"
              name="savings"
              value={formData.savings}
              onChange={onChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.savings ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="例: 1000万円"
            />
            {errors.savings && <p className="mt-1 text-sm text-red-500">{errors.savings}</p>}
          </div>
        </div>
        
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">現在のローン・負債状況（任意）</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mortgageLoanBalance" className="block text-sm font-medium text-gray-700 mb-1">
                住宅ローン残高
              </label>
              <input
                type="text"
                id="mortgageLoanBalance"
                name="mortgageLoanBalance"
                value={formData.mortgageLoanBalance}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例: 2000万円"
              />
            </div>
            
            <div>
              <label htmlFor="monthlyMortgagePayment" className="block text-sm font-medium text-gray-700 mb-1">
                毎月の返済額
              </label>
              <input
                type="text"
                id="monthlyMortgagePayment"
                name="monthlyMortgagePayment"
                value={formData.monthlyMortgagePayment}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例: 8万円"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="otherDebts" className="block text-sm font-medium text-gray-700 mb-1">
                その他の借入額
              </label>
              <input
                type="text"
                id="otherDebts"
                name="otherDebts"
                value={formData.otherDebts}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例: 100万円（カーローン）"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90"
          >
            次へ進む
          </button>
        </div>
      </form>
    </div>
  );
};

export default DetailedInfoStep; 