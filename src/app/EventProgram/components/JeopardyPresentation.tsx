"use client";

import React, { useState, useEffect } from 'react';

interface JeopardyQuestion {
  id: string;
  answer: string;
  question: string;
  points: number;
}

interface JeopardyCategory {
  id: string;
  name: string;
  questions: JeopardyQuestion[];
}

interface JeopardyPresentationProps {
  categories: JeopardyCategory[];
}

interface TileState {
  [key: string]: 'hidden' | 'question' | 'answer' | 'completed';
}

const JeopardyPresentation: React.FC<JeopardyPresentationProps> = ({ categories }) => {
  const [tileStates, setTileStates] = useState<TileState>({});
  const [currentQuestion, setCurrentQuestion] = useState<JeopardyQuestion | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // Initialize all tiles as hidden
  useEffect(() => {
    const initialStates: TileState = {};
    categories.forEach(category => {
      category.questions.forEach(question => {
        initialStates[question.id] = 'hidden';
      });
    });
    setTileStates(initialStates);
  }, [categories]);

  const handleTileClick = (question: JeopardyQuestion) => {
    if (tileStates[question.id] === 'hidden') {
      // First click - show question
      setCurrentQuestion(question);
      setShowQuestionModal(true);
      setTileStates(prev => ({ ...prev, [question.id]: 'question' }));
    }
  };

  const handleQuestionClose = () => {
    setShowQuestionModal(false);
  };

  const handleShowAnswer = () => {
    setShowQuestionModal(false);
    if (currentQuestion) {
      setShowAnswerModal(true);
      setTileStates(prev => ({ ...prev, [currentQuestion.id]: 'answer' }));
    }
  };

  const handleAnswerClose = () => {
    setShowAnswerModal(false);
    if (currentQuestion) {
      setTileStates(prev => ({ ...prev, [currentQuestion.id]: 'completed' }));
    }
  };

  const getTileContent = (question: JeopardyQuestion) => {
    const state = tileStates[question.id];
    
    switch (state) {
      case 'hidden':
        return (
          <div className="text-2xl font-bold text-white">
            {question.points}
          </div>
        );
      case 'question':
        return (
          <div className="text-lg font-semibold text-white">
            ✓
          </div>
        );
      case 'answer':
        return (
          <div className="text-lg font-semibold text-white">
            ✓
          </div>
        );
      case 'completed':
        return (
          <div className="text-lg font-semibold text-white">
            ✓
          </div>
        );
      default:
        return (
          <div className="text-2xl font-bold text-white">
            {question.points}
          </div>
        );
    }
  };

  const getTileStyle = (question: JeopardyQuestion) => {
    const state = tileStates[question.id];
    
    switch (state) {
      case 'hidden':
        return 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 cursor-pointer';
      case 'question':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600 cursor-pointer';
      case 'answer':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600 cursor-pointer';
      case 'completed':
        return 'bg-gradient-to-br from-gray-500 to-gray-600 cursor-not-allowed';
      default:
        return 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 cursor-pointer';
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center text-gray-600">
        <p>No Jeopardy categories available</p>
      </div>
    );
  }

  const maxQuestions = Math.max(...categories.map(cat => cat.questions.length));

  return (
    <div className="w-full mx-auto" style={{ maxWidth: '98vw' }}>
      {/* Jeopardy Board */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-3 shadow-2xl border border-dark-royalty/20">
        <div className="grid gap-1" style={{ 
          gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
          gridTemplateRows: `auto repeat(${maxQuestions}, 1fr)`
        }}>
          {/* Category Headers */}
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-gradient-to-br from-dark-royalty to-deep-sea text-white p-2 rounded-xl text-center font-bold text-lg shadow-lg"
            >
              {category.name}
            </div>
          ))}

          {/* Question Tiles */}
          {Array.from({ length: maxQuestions }, (_, rowIndex) => 
            categories.map((category) => {
              const question = category.questions[rowIndex];
              if (!question) return <div key={`empty-${category.id}-${rowIndex}`} className="p-4" />;
              
              return (
                <button
                  key={question.id}
                  onClick={() => handleTileClick(question)}
                  disabled={tileStates[question.id] === 'completed' || tileStates[question.id] === 'question'}
                  data-jeopardy-tile={tileStates[question.id]}
                  className={`${getTileStyle(question)} p-2 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center min-h-[80px] text-center`}
                >
                  {getTileContent(question)}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && currentQuestion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-dark-royalty/20 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">❓</div>
              <h2 className="text-3xl font-bold text-dark-royalty mb-6">Question for ${currentQuestion.points}</h2>
              <div className="bg-yellow-50/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 mb-6">
                <p className="text-xl text-dark-royalty font-medium leading-relaxed">
                  {currentQuestion.answer}
                </p>
              </div>
              <p className="text-deep-sea/70 mb-6">
                Players should respond with the question that matches this answer.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleQuestionClose}
                  className="px-8 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleShowAnswer}
                  className="px-8 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium"
                >
                  Show Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {showAnswerModal && currentQuestion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-dark-royalty/20 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">💡</div>
              <h2 className="text-3xl font-bold text-dark-royalty mb-6">The Answer</h2>
              <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 mb-6">
                <p className="text-xl text-dark-royalty font-medium leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
              <p className="text-deep-sea/70 mb-6">
                This question matches the answer: "{currentQuestion.answer}"
              </p>
              <button
                onClick={handleAnswerClose}
                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 font-medium"
              >
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JeopardyPresentation; 