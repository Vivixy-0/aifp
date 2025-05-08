'use client';

import React, { useState, useEffect } from 'react';
import ProgressBar from '../ui/ProgressBar';
import PrivacyPolicyStep from './PrivacyPolicyStep';
import BasicInfoStep from './BasicInfoStep';
import ChatbotStep from './ChatbotStep';
import ResultStep from './ResultStep';
import { DiagnosisStep } from '../../types';
import { supabase, initializeDatabase } from '../../lib/supabase';
import EmailRestorationForm from './EmailRestorationForm';

// ダミーストレージ（セッション内でのみ有効）
const dummyStorage: Record<string, any[]> = {
  'users': [],
  'diagnosis_results': [],
  'chatbot_progress': []
};

// 初期フォームデータ
const initialFormData = {
  name: '',
  email: '',
  age: '',
  familySize: '',
  annualIncome: '',
  savings: '',
  mortgageLoanBalance: '',
  monthlyMortgagePayment: '',
  otherDebts: '',
  agreeToPrivacyPolicy: false,
};

// 初期エラー状態
const initialErrors = {
  name: '',
  email: '',
  age: '',
  familySize: '',
  annualIncome: '',
  savings: '',
  mortgageLoanBalance: '',
  monthlyMortgagePayment: '',
  otherDebts: '',
};

// ステップのテキスト
const stepLabels = ['同意', '基本情報', 'チャットボット', '結果'];

const DiagnosisForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [currentStep, setCurrentStep] = useState(DiagnosisStep.PRIVACY_POLICY);
  const [stepIndex, setStepIndex] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showRestorationForm, setShowRestorationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // コンポーネントマウント時にデータベースを初期化
  useEffect(() => {
    const initDb = async () => {
      try {
        console.log('データベースの初期化を実行します...');
        const success = await initializeDatabase();
        console.log('データベース初期化結果:', success);
        setDbInitialized(success);
      } catch (error) {
        console.error('データベース初期化中にエラーが発生しました:', error);
        setDbInitialized(false);
      }
    };
    
    initDb();
  }, []);

  // ユーザーIDが変更されたときのデータロード
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      console.log('ユーザーID変更を検知: データをロードします', userId);
      
      try {
        // ユーザーの診断データ取得
        const { data: diagnosisData, error: diagnosisError } = await supabase
          .from('diagnosis_results')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        console.log('診断データ取得結果:', { data: !!diagnosisData, error: diagnosisError });
        
        if (diagnosisError) {
          console.warn('診断データの取得に失敗しました:', diagnosisError);
        }
        
        // データが見つかった場合
        if (diagnosisData) {
          console.log('診断データが見つかりました:', diagnosisData);
          
          // フォームデータに設定
          const restoredFormData = {
            ...initialFormData,
            name: diagnosisData.name || '',
            email: diagnosisData.email || '',
            age: diagnosisData.age?.toString() || '',
            familySize: diagnosisData.family_size || '',
            annualIncome: diagnosisData.annual_income?.toString() || '',
            savings: diagnosisData.savings?.toString() || '',
            agreeToPrivacyPolicy: true
          };
          
          // chatbot_dataフィールドがあれば解析
          if (diagnosisData.chatbot_data) {
            let chatbotData = {};
            try {
              if (typeof diagnosisData.chatbot_data === 'string') {
                chatbotData = JSON.parse(diagnosisData.chatbot_data);
              } else {
                chatbotData = diagnosisData.chatbot_data;
              }
              console.log('チャットボットデータを復元:', chatbotData);
              
              // チャットボットデータと統合
              Object.assign(restoredFormData, chatbotData);
            } catch (e) {
              console.error('チャットボットデータの解析に失敗:', e);
            }
          }
          
          console.log('フォームデータを復元します:', restoredFormData);
          setFormData(restoredFormData);
          
          // 診断結果も設定
          const restoredResult = {
            maxBudget: diagnosisData.max_budget || 0,
            recommendation: diagnosisData.recommendation || '',
            diagnosisResultId: diagnosisData.id
          };
          setDiagnosisResult(restoredResult);
        } else {
          console.log('診断データが見つからないため、チャットボットから開始します');
        }
      } catch (error) {
        console.error('データロード中にエラーが発生しました:', error);
      }
    };
    
    loadUserData();
  }, [userId]);

  // ステップのインデックスを更新
  useEffect(() => {
    switch (currentStep) {
      case DiagnosisStep.PRIVACY_POLICY:
        setStepIndex(0);
        break;
      case DiagnosisStep.BASIC_INFO:
        setStepIndex(1);
        break;
      case DiagnosisStep.CHATBOT:
        setStepIndex(2);
        break;
      case DiagnosisStep.RESULT:
        setStepIndex(3);
        break;
      default:
        setStepIndex(0);
    }
  }, [currentStep]);

  // フォーム入力処理
  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // エラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // フォームのバリデーション
  const validateBasicInfo = (): boolean => {
    const newErrors = { ...initialErrors };
    let isValid = true;

    if (!formData.name) {
      newErrors.name = 'お名前は必須です';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // ステップの移動処理
  const handlePrivacyPolicyNext = () => {
    if (formData.agreeToPrivacyPolicy) {
      setCurrentStep(DiagnosisStep.BASIC_INFO);
    }
  };

  const handleBasicInfoNext = async () => {
    if (validateBasicInfo()) {
      try {
        // ユーザー情報をusersテーブルに保存
        const { data, error } = await supabase
          .from('users')
          .insert({
            name: formData.name,
            email: formData.email,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (error) {
          console.error('ユーザー情報の保存中にエラーが発生しました:', error);
        } else if (data) {
          console.log('ユーザー情報が保存されました。ユーザーID:', data.id);
          // 保存されたユーザーIDを状態に保存
          setUserId(data.id);
        }
        
        // 次のステップへ進む
        setCurrentStep(DiagnosisStep.CHATBOT);
      } catch (error) {
        console.error('ユーザー情報の保存中にエラーが発生しました:', error);
        // エラーが発生しても次のステップへ進む
        setCurrentStep(DiagnosisStep.CHATBOT);
      }
    }
  };

  const handleBasicInfoBack = () => {
    setCurrentStep(DiagnosisStep.PRIVACY_POLICY);
  };

  const handleChatbotBack = () => {
    setCurrentStep(DiagnosisStep.BASIC_INFO);
  };

  const handleChatbotNext = async (chatbotData: any) => {
    try {
      setIsProcessing(true);
      
      console.log('チャットボットから受け取ったデータ:', chatbotData);
      
      // フォームデータにチャットボットデータを統合
      const updatedFormData = {
        ...formData,
        ...chatbotData
      };
      
      setFormData(updatedFormData);
      
      // 簡易的な診断結果を生成（実際のアプリではより複雑な計算を行う）
      const result: any = {
        maxBudget: parseInt(updatedFormData.annualIncome || '0') * 5 + parseInt(updatedFormData.savings || '0'),
        recommendation: `${updatedFormData.name}様の情報に基づいた住宅予算診断結果です。詳細はPDFでご確認ください。`
      };
      
      // 診断結果をSupabaseに保存
      if (userId) {
        try {
          console.log('診断結果をSupabaseに保存します...');
          // 保存可能な形式に変換
          const resultData = {
            user_id: userId,
            name: updatedFormData.name || '',
            email: updatedFormData.email || '',
            age: parseAmountFromString(updatedFormData.age),
            family_size: updatedFormData.familySize || '',
            annual_income: parseAmountFromString(updatedFormData.annualIncome),
            savings: parseAmountFromString(updatedFormData.savings),
            max_budget: result.maxBudget,
            recommendation: result.recommendation,
            has_spouse: updatedFormData.hasSpouse || null,
            spouse_income: parseAmountFromString(updatedFormData.spouseIncome),
            retirement_age: updatedFormData.retirementAge || null,
            chatbot_data: JSON.stringify(chatbotData),
            created_at: new Date().toISOString()
          };
          
          console.log('保存するデータ:', resultData);
          
          // supabase.tsの関数を使用して保存
          const { data, error } = await supabase
            .from('diagnosis_results')
            .insert(resultData)
            .select('id')
            .single();
          
          if (error) {
            console.error('Supabaseへの保存エラー:', error);
          } else if (data) {
            console.log('診断結果が正常に保存されました。ID:', data.id);
            result.diagnosisResultId = data.id;
          }
        } catch (saveError) {
          console.error('診断結果の保存中にエラーが発生しました:', saveError);
          
          // ダミーストレージにバックアップ
          if (!dummyStorage['diagnosis_results']) {
            dummyStorage['diagnosis_results'] = [];
          }
          const localId = `local-${Date.now()}`;
          dummyStorage['diagnosis_results'].push({
            id: localId,
            user_id: userId,
            ...chatbotData,
            max_budget: result.maxBudget,
            created_at: new Date().toISOString()
          });
          result.diagnosisResultId = localId;
          console.log('ローカルストレージに保存しました。ID:', localId);
        }
      } else {
        console.warn('ユーザーIDがないため、診断結果を保存できません');
      }
      
      // 診断結果をステートに保存
      setDiagnosisResult(result);

      // 次のステップへ
      setCurrentStep(DiagnosisStep.RESULT);
    } catch (error) {
      console.error('診断結果の生成中にエラーが発生しました:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // PDFダウンロード処理
  const handleDownloadPdf = async () => {
    try {
      setIsLoading(true);
      // PDF生成処理（ダミー）
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('PDFがダウンロードされました');
    } catch (error) {
      console.error('PDFのダウンロードに失敗しました:', error);
      alert('PDFの生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // FP相談の日程調整ページへ遷移
  const handleScheduleMeeting = () => {
    // 別のページや外部サービスへのリンク
    window.open('https://calendly.com/example/fp-consultation', '_blank');
  };

  // 診断をリセットして最初から始める
  const handleRestart = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setCurrentStep(DiagnosisStep.PRIVACY_POLICY);
    setDiagnosisResult(null);
  };

  // メールによる復元フォームを表示
  const showEmailRestoration = () => {
    console.log('メールによる復元フォームを表示します');
    setShowRestorationForm(true);
  };
  
  // 復元処理
  const handleRestoration = (restoredUserId: string) => {
    console.log('ユーザーIDによる復元処理を実行:', restoredUserId);
    // ユーザーIDを設定
    setUserId(restoredUserId);
    // 復元フォームを非表示
    setShowRestorationForm(false);
    // チャットボットステップに移動
    setCurrentStep(DiagnosisStep.CHATBOT);
  };
  
  // 復元キャンセル
  const handleRestorationCancel = () => {
    console.log('復元をキャンセルしました');
    setShowRestorationForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ProgressBar steps={stepLabels} currentStep={stepIndex} />
      
      {/* メールによる復元フォーム（オーバーレイ） */}
      {showRestorationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EmailRestorationForm 
            onRestore={handleRestoration}
            onCancel={handleRestorationCancel}
          />
        </div>
      )}
      
      {currentStep === DiagnosisStep.PRIVACY_POLICY && (
        <>
          <PrivacyPolicyStep
            agreeToPrivacyPolicy={formData.agreeToPrivacyPolicy}
            onAgreeChange={handleInputChange}
            onNext={handlePrivacyPolicyNext}
          />
          
          {/* メールアドレスによる復元リンク */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={showEmailRestoration}
              className="text-primary hover:underline text-sm"
            >
              以前の診断データを復元する
            </button>
          </div>
        </>
      )}
      
      {currentStep === DiagnosisStep.BASIC_INFO && (
        <BasicInfoStep
          formData={{
            name: formData.name,
            email: formData.email
          }}
          onChange={handleInputChange}
          onNext={handleBasicInfoNext}
          onBack={handleBasicInfoBack}
          errors={errors}
        />
      )}
      
      {currentStep === DiagnosisStep.CHATBOT && (
        <ChatbotStep
          userName={formData.name || 'ゲスト'}
          userId={userId}
          onComplete={handleChatbotNext}
          onBack={handleChatbotBack}
        />
      )}
      
      {currentStep === DiagnosisStep.RESULT && diagnosisResult && (
        <ResultStep 
          formData={formData}
          result={diagnosisResult}
          onDownloadPdf={handleDownloadPdf}
          onScheduleMeeting={handleScheduleMeeting}
          onRestart={handleRestart}
          isLoading={isLoading}
        />
      )}
      
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg">診断結果を計算中...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// 文字列から数値を抽出する関数
const parseAmountFromString = (str: string): number | null => {
  if (!str) return null;
  
  // 数字のみを抽出
  const numStr = str.replace(/[^0-9]/g, '');
  if (!numStr) return null;
  
  // 数値に変換
  return parseInt(numStr, 10);
};

export default DiagnosisForm;