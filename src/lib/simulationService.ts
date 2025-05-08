import { supabase } from './supabase';
// import { YearlyBalance } from './simulationCalculator';

/**
 * シミュレーション年次データの型
 */
export interface YearlyData {
  year: number;
  age: number;
  incomeTotal: number;
  expenseTotal: number;
  cashflow: number;
  balanceEnd: number;
  mortgagePrincipal: number;
  mortgageInterest: number;
  educationCost: number;
  insuranceCost: number;
  investmentBalance: number;
  investmentYield: number;
  pensionIncome: number;
  otherEvents: Record<string, number>;
}

/**
 * シミュレーション実行APIを呼び出す
 */
export async function runSimulation(diagnosisResultId: string): Promise<{ simulationId: string | null; error: any }> {
  try {
    console.log('シミュレーション実行API呼び出し開始 - 診断結果ID:', diagnosisResultId);
    
    // まず診断結果データを取得（シミュレーション実行に先立ってデータ検証）
    const { data: diagnosisData, error: diagnosisError } = await supabase
      .from('diagnosis_results')
      .select('*')
      .eq('id', diagnosisResultId)
      .single();
    
    if (diagnosisError) {
      console.error('診断結果データ取得エラー:', diagnosisError);
      return { simulationId: null, error: diagnosisError };
    }
    
    console.log('取得した診断結果データ:', {
      id: diagnosisData.id,
      annual_income: diagnosisData.annual_income,
      savings: diagnosisData.savings,
      age: diagnosisData.age
    });
    
    // Docker/Edge Functions実装がないため、常にフォールバック処理を使用
    console.log('フォールバック: 診断結果IDをシミュレーションIDとして返します');
    return { 
      simulationId: diagnosisResultId, 
      error: { 
        message: 'Edge Functions未実装 - フォールバック使用',
        type: 'fallback_used'
      } 
    };
  } catch (error) {
    console.error('シミュレーション実行API呼び出し中に例外が発生しました:', error);
    
    // 例外発生時も診断結果IDをシミュレーションIDとして返すフォールバック
    return { 
      simulationId: diagnosisResultId, 
      error: { message: '例外発生 - 診断結果IDをフォールバック使用', originalError: error } 
    };
  }
}

/**
 * シミュレーション結果取得APIを呼び出す
 */
export async function getSimulation(simulationId: string): Promise<{ 
  simulationRun: any; 
  yearlyData: YearlyData[]; 
  error: any 
}> {
  try {
    console.log('シミュレーション結果取得開始 - ID:', simulationId);
    
    // まずsimulation_runsテーブルから直接取得を試みる
    const { data: simulationRun, error: directError } = await supabase
      .from('simulation_runs')
      .select('*, diagnosis_result:diagnosis_result_id(*)')
      .eq('id', simulationId)
      .single();
    
    if (!directError && simulationRun) {
      console.log('simulation_runsテーブルから直接データ取得成功:', simulationRun);
      
      // 年次データを取得
      const { data: yearlyData, error: yearlyError } = await supabase
        .from('simulation_yearly_data')
        .select('*')
        .eq('run_id', simulationId)
        .order('year', { ascending: true });
      
      if (!yearlyError && yearlyData && yearlyData.length > 0) {
        console.log(`${yearlyData.length}件の年次データを取得しました`);
        return { simulationRun, yearlyData, error: null };
      } else {
        console.log('年次データの取得に失敗または空データ。診断結果データを使用します:', yearlyError);
      }
    }
    
    // 直接取得に失敗した場合、フォールバック処理を実行
    console.log('テーブルからの直接取得に失敗、フォールバック処理を実行します');
    
    // 診断結果テーブルから直接データを取得
    const { data: diagnosisData, error: diagnosisError } = await supabase
      .from('diagnosis_results')
      .select('*')
      .eq('id', simulationId)
      .single();
    
    if (diagnosisError) {
      console.error('診断結果データ取得エラー:', diagnosisError);
      return { simulationRun: null, yearlyData: [], error: diagnosisError };
    }
    
    console.log('診断結果データから直接シミュレーションを生成します:', {
      annual_income: diagnosisData.annual_income,
      savings: diagnosisData.savings
    });
    
    // 空のシミュレーション実行結果を作成
    const emptySimulationRun = {
      id: simulationId,
      diagnosis_result_id: simulationId,
      diagnosis_result: diagnosisData,
      summary: {
        annual_income: diagnosisData.annual_income,
        savings: diagnosisData.savings
      }
    };
    
    // 空の年次データを返す（フロントエンドでローカルシミュレーションが実行される）
    return { 
      simulationRun: emptySimulationRun, 
      yearlyData: [], 
      error: { message: 'ローカル計算にフォールバック', originalError: null } 
    };
    
    /* Edge Functions が設定されている場合は以下を使用
    const { data, error } = await supabase.functions.invoke(`simulation-api/get-simulation?id=${simulationId}`, {
      method: 'GET'
    });
    
    if (error) {
      console.error('シミュレーション結果取得APIエラー:', error);
      console.log('フォールバック: 診断結果データから直接シミュレーションを生成します');
      
      // フォールバック: 診断結果IDを使用してデータ取得
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('diagnosis_results')
        .select('*')
        .eq('id', simulationId)
        .single();
      
      if (diagnosisError) {
        console.error('診断結果データ取得エラー:', diagnosisError);
        return { simulationRun: null, yearlyData: [], error: diagnosisError };
      }
      
      console.log('診断結果データから直接シミュレーションを生成します:', {
        annual_income: diagnosisData.annual_income,
        savings: diagnosisData.savings
      });
      
      // 空のシミュレーション実行結果を作成
      const emptySimulationRun = {
        id: simulationId,
        diagnosis_result_id: simulationId,
        diagnosis_result: diagnosisData,
        summary: {
          annual_income: diagnosisData.annual_income,
          savings: diagnosisData.savings
        }
      };
      
      // 空の年次データを返す（フロントエンドでローカルシミュレーションが実行される）
      return { 
        simulationRun: emptySimulationRun, 
        yearlyData: [], 
        error: { message: 'APIエラー - ローカル計算にフォールバック', originalError: error } 
      };
    }
    
    // 年次データの型変換
    const yearlyData = data.yearlyData.map((item: any) => ({
      year: item.year,
      age: item.age,
      incomeTotal: item.income_total,
      expenseTotal: item.expense_total,
      cashflow: item.cashflow,
      balanceEnd: item.balance_end,
      mortgagePrincipal: item.mortgage_principal,
      mortgageInterest: item.mortgage_interest,
      educationCost: item.education_cost,
      insuranceCost: item.insurance_cost,
      investmentBalance: item.investment_balance,
      investmentYield: item.investment_yield,
      pensionIncome: item.pension_income,
      otherEvents: item.other_events
    }));
    
    console.log(`APIから${yearlyData.length}件の年次データを取得しました`);
    
    return { simulationRun: data.simulationRun, yearlyData, error: null };
    */
  } catch (error) {
    console.error('シミュレーション結果取得API呼び出し中に例外が発生しました:', error);
    
    // 例外発生時のフォールバック
    try {
      // 診断結果テーブルから直接データを取得
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('diagnosis_results')
        .select('*')
        .eq('id', simulationId)
        .single();

      if (!diagnosisError && diagnosisData) {
        console.log('例外発生時のフォールバック: 診断結果データ取得成功', {
          annual_income: diagnosisData.annual_income,
          savings: diagnosisData.savings
        });
        
        // 最小限のシミュレーション実行結果を作成
        const fallbackSimulationRun = {
          id: simulationId,
          diagnosis_result_id: simulationId,
          diagnosis_result: diagnosisData
        };
        
        return { 
          simulationRun: fallbackSimulationRun, 
          yearlyData: [], 
          error: { message: '例外発生 - 診断結果データを使用', originalError: error }
        };
      }
    } catch (fallbackError) {
      console.error('フォールバック処理中に2次例外が発生:', fallbackError);
    }
    
    return { simulationRun: null, yearlyData: [], error };
  }
} 