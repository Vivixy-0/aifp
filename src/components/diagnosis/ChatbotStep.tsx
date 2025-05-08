'use client';

import React, { useState, useEffect } from 'react';

interface ChatbotStepProps {
  userName: string;
  userId: string | null;
  onComplete: (chatbotData: any) => void;
  onBack: () => void;
}

// チャットボットでのシミュレーション質問リスト
const chatbotQuestions = [
  {
    id: 'age',
    question: 'あなたの年齢を教えてください。',
    placeholder: '例: 35歳'
  },
  {
    id: 'annualIncome',
    question: '世帯の年収はどれくらいですか？（税込み）',
    placeholder: '例: 600万円'
  },
  {
    id: 'savings',
    question: '現在の貯蓄額はいくらですか？',
    placeholder: '例: 1000万円'
  },
  {
    id: 'hasSpouse',
    question: '配偶者はいらっしゃいますか？',
    placeholder: '例: はい、いいえ'
  },
  {
    id: 'spouseIncome',
    question: '配偶者の年収はいくらですか？（税込み）',
    placeholder: '例: 400万円',
    condition: (answers: any) => answers.hasSpouse === 'はい'
  },
  {
    id: 'retirementAge',
    question: '何歳まで働く予定ですか？',
    placeholder: '例: 65歳'
  }
];

const ChatbotStep = ({ userName, userId, onComplete, onBack }: ChatbotStepProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'bot' | 'user', content: string }[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // チャットボットの初期メッセージ
  useEffect(() => {
    setChatHistory([
      {
        role: 'bot',
        content: `こんにちは、${userName}さん！住宅予算診断のために、いくつか質問させてください。`
      }
    ]);
    
    // 最初の質問を表示
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'bot',
          content: chatbotQuestions[0].question
        }
      ]);
    }, 500);
  }, [userName]);

  // 質問を送信する処理
  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;
    
    const question = chatbotQuestions[currentQuestionIndex];
    
    // ユーザーの回答をチャット履歴に追加
    setChatHistory(prev => [
      ...prev,
      {
        role: 'user',
        content: currentAnswer
      }
    ]);
    
    // 回答を保存
    const updatedAnswers = {
      ...answers,
      [question.id]: currentAnswer
    };
    setAnswers(updatedAnswers);
    
    // 入力フィールドをクリア
    setCurrentAnswer('');
    
    // 次の質問へ進むか、チャットを完了するか判断
    const nextQuestionIndex = getNextQuestionIndex(currentQuestionIndex, updatedAnswers);
    
    if (nextQuestionIndex < chatbotQuestions.length) {
      // 次の質問を表示
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          {
            role: 'bot',
            content: chatbotQuestions[nextQuestionIndex].question
          }
        ]);
        setCurrentQuestionIndex(nextQuestionIndex);
      }, 500);
    } else {
      // 全ての質問が終了した場合
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          {
            role: 'bot',
            content: 'ありがとうございます！これで質問は終了です。「診断結果を見る」ボタンをクリックして結果をご確認ください。'
          }
        ]);
        setIsCompleted(true);
      }, 500);
    }
  };

  // 次の質問のインデックスを取得
  const getNextQuestionIndex = (currentIndex: number, currentAnswers: Record<string, string>) => {
    let nextIndex = currentIndex + 1;
    
    // 条件付き質問をスキップ
    while (
      nextIndex < chatbotQuestions.length &&
      chatbotQuestions[nextIndex].condition &&
      !chatbotQuestions[nextIndex].condition(currentAnswers)
    ) {
      nextIndex++;
    }
    
    return nextIndex;
  };

  // 診断結果へ進む
  const handleComplete = () => {
    console.log('チャットボットの回答データ:', answers);
    onComplete(answers);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <h2 className="text-xl font-semibold">AI 住宅予算診断</h2>
        </div>
        
        {/* チャット履歴 */}
        <div className="p-4 h-96 overflow-y-auto bg-gray-50">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'bot' ? 'text-left' : 'text-right'
              }`}
            >
              <div
                className={`inline-block rounded-lg p-3 max-w-xs md:max-w-md ${
                  message.role === 'bot'
                    ? 'bg-white border border-gray-200'
                    : 'bg-primary text-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        
        {/* 入力エリア */}
        <div className="p-4 border-t">
          {!isCompleted ? (
            <div className="flex">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={chatbotQuestions[currentQuestionIndex]?.placeholder || '回答を入力...'}
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
              />
              <button
                onClick={handleSubmitAnswer}
                className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-opacity-90"
              >
                送信
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleComplete}
                className="bg-primary text-white px-6 py-3 rounded-md hover:bg-opacity-90"
              >
                診断結果を見る
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-gray-600 hover:underline"
        >
          基本情報入力に戻る
        </button>
      </div>
    </div>
  );
};

export default ChatbotStep; 