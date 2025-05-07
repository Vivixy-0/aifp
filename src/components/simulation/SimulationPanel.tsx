import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// インライン関数定義
function generateLifetimeSimulation(params: any): any[] {
  // 簡易実装
  return [/* シミュレーションデータ */];
}

function runSimulation(diagnosisResultId: string) {
  return { simulationId: diagnosisResultId, error: null };
}

const SimulationPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [simulationData, setSimulationData] = useState([] as any[]);
  const [formData, setFormData] = useState({
    age: 30,
    annualIncome: 5000000,
    savings: 5000000,
    hasSpouse: 'いいえ',
    spouseIncome: 0,
    retirementAge: '65歳',
    childrenCount: '0人',
    childrenAges: ''
  });
  const [diagnosisResultId, setDiagnosisResultId] = useState(null as string | null);

  useEffect(() => {
    const loadSimulation = async () => {
      setLoading(true);
      setError(null);
      console.log('シミュレーションパネルマウント - 診断結果ID:', diagnosisResultId);
      
      // 診断結果IDがない場合はローカルシミュレーションを実行
      if (!diagnosisResultId) {
        console.log('診断結果IDなし、ローカルシミュレーションを実行します');
        const simulationData = generateLifetimeSimulation({
          age: formData.age || 30,
          annualIncome: formData.annualIncome || 5000000,
          savings: formData.savings || 5000000,
          hasSpouse: formData.hasSpouse || 'いいえ',
          spouseIncome: formData.spouseIncome || 0,
          retirementAge: formData.retirementAge || '65歳',
          childrenCount: formData.childrenCount || '0人',
          childrenAges: formData.childrenAges || ''
        });
        setSimulationData(simulationData);
        setLoading(false);
        return;
      }
      
      try {
        // シミュレーションを実行
        const { simulationId, error: runError } = await runSimulation(diagnosisResultId);
        
        if (runError) {
          console.error('シミュレーション実行エラー:', runError);
          
          // 診断結果テーブルから直接データを取得
          const { data: diagnosisData, error: diagnosisError } = await supabase
            .from('diagnosis_results')
            .select('*')
            .eq('id', diagnosisResultId)
            .single();
          
          if (diagnosisError) {
            console.error('診断結果データ取得エラー:', diagnosisError);
            setError('診断結果の取得に失敗しました');
            setLoading(false);
            return;
          }
          
          console.log('診断結果データから直接シミュレーション生成:', diagnosisData);
          
          // チャットボットデータを解析
          let chatbotData: Record<string, any> = {};
          if (diagnosisData.chatbot_data) {
            try {
              chatbotData = typeof diagnosisData.chatbot_data === 'string' 
                ? JSON.parse(diagnosisData.chatbot_data)
                : diagnosisData.chatbot_data;
              console.log('チャットボットデータ解析成功:', chatbotData);
            } catch (parseError) {
              console.error('チャットボットデータの解析に失敗:', parseError);
            }
          }
          
          // チャットボットから収集した追加データを使用してシミュレーションを生成
          const diagnosisSimulation = generateLifetimeSimulation({
            age: diagnosisData.age || formData.age || 30,
            annualIncome: diagnosisData.annual_income || 
              (chatbotData && chatbotData.annualIncome ? chatbotData.annualIncome : null) || 
              formData.annualIncome || 5000000,
            savings: diagnosisData.savings || 
              (chatbotData && chatbotData.savings ? chatbotData.savings : null) || 
              formData.savings || 5000000,
            hasSpouse: diagnosisData.has_spouse || 
              (chatbotData && chatbotData.hasSpouse ? chatbotData.hasSpouse : null) || 
              formData.hasSpouse || 'いいえ',
            spouseIncome: diagnosisData.spouse_income || 
              (chatbotData && chatbotData.spouseIncome ? chatbotData.spouseIncome : 0) || 
              formData.spouseIncome || 0,
            retirementAge: diagnosisData.retirement_age || 
              (chatbotData && chatbotData.retirementAge ? chatbotData.retirementAge : null) || 
              formData.retirementAge || '65歳',
            childrenCount: diagnosisData.children_count || 
              (chatbotData && chatbotData.childrenCount ? chatbotData.childrenCount : null) || 
              formData.childrenCount || '0人',
            childrenAges: diagnosisData.children_ages || 
              (chatbotData && chatbotData.childrenAges ? chatbotData.childrenAges : null) || 
              formData.childrenAges || ''
          });
          
          console.log('診断結果データから生成したシミュレーション - データ長:', diagnosisSimulation.length);
          setSimulationData(diagnosisSimulation);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('シミュレーションロードエラー:', e);
        setError('シミュレーションのロードに失敗しました');
        setLoading(false);
      }
    };

    loadSimulation();
  }, [diagnosisResultId, formData.age, formData.annualIncome, formData.savings, formData.hasSpouse, formData.spouseIncome, formData.retirementAge, formData.childrenCount, formData.childrenAges]);

  return (
    <div>
      {/* ロード中の表示 */}
      {loading && <p>Loading...</p>}
      {/* エラーの表示 */}
      {error && <p>{error}</p>}
      {/* シミュレーションデータの表示 */}
      {simulationData.length > 0 && (
        <div>
          {/* シミュレーションデータの表示ロジック */}
        </div>
      )}
    </div>
  );
};

export default SimulationPanel; 