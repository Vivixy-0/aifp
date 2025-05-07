  // Supabaseに診断結果を保存
  const saveResultToSupabase = async (formData: DiagnosisFormData, result: BudgetDiagnosisResult) => {
    try {
      console.log('Saving diagnosis result...');
      
      // 簡略化した保存処理
      const userData = {
        name: formData.name,
        email: formData.email,
        age: Number(formData.age),
        family_size: Number(formData.familySize),
        annual_income: Number(formData.annualIncome),
        savings: Number(formData.savings),
        mortgage_loan_balance: formData.mortgageLoanBalance ? Number(formData.mortgageLoanBalance) : null,
        monthly_mortgage_payment: formData.monthlyMortgagePayment ? Number(formData.monthlyMortgagePayment) : null,
        other_debts: formData.otherDebts ? Number(formData.otherDebts) : null,
        max_budget: result.maxBudget,
        recommendation: result.recommendation
      };
      
      // 保存関数を呼び出し
      await saveData('diagnosis_results', userData);
      
      console.log('Successfully saved diagnosis data');
    } catch (error) {
      console.error('Error in data saving operations:', error);
      // エラーを通知するが処理は続行
    }
  };