// 診断ステップの列挙型
export enum DiagnosisStep {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  BASIC_INFO = 'BASIC_INFO',
  DETAILED_INFO = 'DETAILED_INFO',
  CHATBOT = 'CHATBOT',
  RESULT = 'RESULT',
}

// 診断フォームデータの型
export interface DiagnosisFormData {
  name: string;
  email: string;
  age: string;
  familySize: string;
  annualIncome: string;
  savings: string;
  mortgageLoanBalance: string;
  monthlyMortgagePayment: string;
  otherDebts: string;
  agreeToPrivacyPolicy: boolean;
  [key: string]: any; // その他のプロパティ
}

// 診断結果の型
export interface BudgetDiagnosisResult {
  maxBudget: number;
  recommendation: string;
  diagnosisResultId?: string;
  [key: string]: any; // その他のプロパティ
} 