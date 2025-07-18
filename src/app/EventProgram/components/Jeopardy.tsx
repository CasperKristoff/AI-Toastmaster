"use client";

import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import { Event, EventSegment } from '../../../types/event';

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

interface JeopardyProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: EventSegment) => void;
  initialSegment?: EventSegment;
}

const Jeopardy: React.FC<JeopardyProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSegment
}) => {
  const [categories, setCategories] = useState<JeopardyCategory[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<JeopardyQuestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [userInput, setUserInput] = useState('');
  const [boardSize, setBoardSize] = useState(5); // Default 5x5 board
  const [history, setHistory] = useState<JeopardyCategory[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedStates, setSavedStates] = useState<{ name: string; categories: JeopardyCategory[]; timestamp: Date }[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Load existing data when editing
  useEffect(() => {
    if (initialSegment && initialSegment.content) {
      try {
        const contentData = JSON.parse(initialSegment.content);
        if (contentData.categories) {
          setCategories(contentData.categories);
          // Set board size based on existing categories
          if (contentData.categories.length > 0) {
            setBoardSize(contentData.categories.length);
          }
          // Initialize history with existing data
          setHistory([contentData.categories]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error parsing Jeopardy content:', error);
      }
    } else {
      // Initialize with default categories based on board size
      generateDefaultCategories(boardSize);
    }
  }, [initialSegment, boardSize]);

  const generateDefaultCategories = (size: number) => {
    const defaultCategories: JeopardyCategory[] = [];
    const categoryNames = ['Event Trivia', 'Fun Facts', 'General Knowledge', 'Pop Culture', 'Science & Tech', 'History', 'Geography', 'Sports', 'Music', 'Movies'];
    
    for (let i = 0; i < size; i++) {
      const categoryName = categoryNames[i] || `Category ${i + 1}`;
      const questions: JeopardyQuestion[] = [];
      
      for (let j = 0; j < size; j++) {
        const points = j + 1;
        questions.push({
          id: `${i + 1}-${j + 1}`,
          answer: `This is the answer for ${points} point${points > 1 ? 's' : ''}`,
          question: `What is the question for ${points} point${points > 1 ? 's' : ''}?`,
          points: points
        });
      }
      
      defaultCategories.push({
        id: (i + 1).toString(),
        name: categoryName,
        questions: questions
      });
    }
    
    setCategories(defaultCategories);
    // Save initial state to history
    setHistory([defaultCategories]);
    setHistoryIndex(0);
  };

  const handleBoardSizeChange = (newSize: number) => {
    setBoardSize(newSize);
    generateDefaultCategories(newSize);
  };

  const saveToHistory = (newCategories: JeopardyCategory[]) => {
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newCategories]);
    
    // Keep only last 10 states to prevent memory issues
    if (newHistory.length > 10) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCategories([...history[newIndex]]);
      setAiMessage('Changes undone!');
    }
  };

  const canUndo = historyIndex > 0;

  const saveCurrentState = () => {
    if (!saveName.trim()) return;
    
    const newSavedState = {
      name: saveName.trim(),
      categories: [...categories],
      timestamp: new Date()
    };
    
    setSavedStates(prev => [...prev, newSavedState]);
    setSaveName('');
    setShowSaveDialog(false);
    setAiMessage(`Saved as "${newSavedState.name}"!`);
  };

  const loadSavedState = (savedState: { name: string; categories: JeopardyCategory[]; timestamp: Date }) => {
    // Save current state to history before loading
    saveToHistory(categories);
    
    setCategories([...savedState.categories]);
    setBoardSize(savedState.categories.length);
    setAiMessage(`Loaded "${savedState.name}"!`);
  };

  const deleteSavedState = (index: number) => {
    setSavedStates(prev => prev.filter((_, i) => i !== index));
  };

  const generateWithAI = async (prompt: string) => {
    setIsGenerating(true);
    setAiMessage('Generating with AI...');

    // Save current state to history before making changes
    saveToHistory(categories);

    try {
      const response = await fetch('/api/generate-jeopardy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          categories,
          eventType: 'event', // You can make this dynamic based on the event
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate with AI');
      }

      const data = await response.json();
      
      if (data.success) {
        setAiMessage(data.message || 'AI response received');
        
        // Handle different types of AI responses
        if (data.categories) {
          setCategories(data.categories);
        } else if (data.suggestions) {
          setAiMessage(data.suggestions);
        }
      } else {
        setAiMessage(data.message || 'AI generation failed');
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('quota exceeded')) {
          setAiMessage('OpenAI quota exceeded. Please check your billing or try again later.');
        } else if (error.message.includes('API key')) {
          setAiMessage('OpenAI API key issue. Please check your configuration.');
        } else {
          setAiMessage(`Error: ${error.message}`);
        }
      } else {
        setAiMessage('Error generating with AI. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (categories.length === 0) return;

    const totalQuestions = categories.reduce((total, category) => total + category.questions.length, 0);
    const estimatedDuration = totalQuestions * 2; // 2 minutes per question

    const segment: EventSegment = {
      id: Date.now().toString(),
      title: 'Jeopardy',
      type: 'game',
      description: `${categories.length} categories with ${totalQuestions} questions`,
      duration: estimatedDuration,
      content: JSON.stringify({
        categories: categories
      }),
      order: 0,
      isCustom: true,
    };

    // Show confirmation message
    setAiMessage(`✅ Jeopardy game added to event program! (${categories.length} categories, ${totalQuestions} questions)`);
    
    // Add to event program
    onSave(segment);
    
    // Close modal after a brief delay to show the message
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setCategories([]);
    setEditingQuestion(null);
    setAiMessage('');
    setUserInput('');
    onClose();
  };

  const updateQuestion = (categoryId: string, questionId: string, field: 'answer' | 'question', value: string) => {
    const newCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          questions: category.questions.map(q => 
            q.id === questionId ? { ...q, [field]: value } : q
          )
        };
      }
      return category;
    });
    
    setCategories(newCategories);
    saveToHistory(newCategories);
  };

  const updateCategoryName = (categoryId: string, newName: string) => {
    const newCategories = categories.map(category => 
      category.id === categoryId ? { ...category, name: newName } : category
    );
    
    setCategories(newCategories);
    saveToHistory(newCategories);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create Jeopardy Game"
      maxWidth="max-w-6xl"
      onSave={handleSave}
      saveDisabled={categories.length === 0}
      showSaveHint={false}
      disableEnterSave={true}
    >
      <div className="space-y-6 font-inter">
        {/* Board Configuration */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center space-x-3 mb-3">
            <div className="text-xl">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-800">Board Configuration</h3>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Board Size:
            </label>
            <select
              value={boardSize}
              onChange={(e) => handleBoardSizeChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={3}>3x3 (9 questions)</option>
              <option value={4}>4x4 (16 questions)</option>
              <option value={5}>5x5 (25 questions)</option>
              <option value={6}>6x6 (36 questions)</option>
            </select>
            <span className="text-sm text-gray-600">
              {boardSize}x{boardSize} board with {boardSize * boardSize} total questions
            </span>
          </div>
        </div>

        {/* AI Assistant Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-xl">🤖</div>
              <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
            </div>
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 text-sm flex items-center space-x-1 border border-emerald-200"
              title="Save current state"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save</span>
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generateWithAI(`Generate ${boardSize} themed categories for this event`)}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 text-sm border border-blue-200"
              >
                Generate Categories
              </button>
              <div className="relative inline-block">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      generateWithAI(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 text-sm border border-green-200 appearance-none cursor-pointer"
                >
                  <option value="">Difficulty...</option>
                  <option value="Make questions more challenging">Make Harder</option>
                  <option value="Make questions easier">Make Easier</option>
                </select>
              </div>
              <button
                onClick={undo}
                disabled={!canUndo || isGenerating}
                className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 text-sm flex items-center space-x-1 border border-red-200"
                title="Undo last AI change"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Undo</span>
              </button>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask AI to customize the game..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && userInput.trim()) {
                    e.preventDefault();
                    e.stopPropagation();
                    generateWithAI(userInput);
                    setUserInput('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (userInput.trim()) {
                    generateWithAI(userInput);
                    setUserInput('');
                  }
                }}
                disabled={isGenerating || !userInput.trim()}
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 border border-purple-200"
              >
                Ask AI
              </button>
            </div>
            
            {aiMessage && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-sm text-gray-700">{aiMessage}</p>
                {canUndo && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 You can undo the last {historyIndex} change{historyIndex > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Saved States */}
            {savedStates.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Saved States:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {savedStates.map((savedState, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded p-2 border border-gray-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{savedState.name}</p>
                        <p className="text-xs text-gray-500">
                          {savedState.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => loadSavedState(savedState)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 border border-blue-200"
                          title="Load this state"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteSavedState(index)}
                          className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 border border-red-200"
                          title="Delete this state"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Jeopardy Board */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Jeopardy Board</h3>
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              ✏️ Click to edit
            </div>
          </div>
          
          <div 
            className="gap-3"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
              gap: '0.75rem'
            }}
          >
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                {/* Category Header */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-3 rounded-xl text-center min-h-[50px] flex items-center justify-center cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200 group relative">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategoryName(category.id, e.target.value)}
                    className="bg-transparent text-white text-center font-semibold text-sm w-full border-none outline-none cursor-text uppercase tracking-wide"
                    placeholder="Category Name"
                  />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-white/80">
                    ✏️
                  </div>
                </div>
                
                {/* Questions */}
                {category.questions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 cursor-pointer p-2 rounded-xl text-center min-h-[40px] flex items-center justify-center transition-all duration-200 group border border-blue-100 hover:border-blue-200"
                    onClick={() => setEditingQuestion(question)}
                    title={`Click to edit ${question.points} point question`}
                  >
                    <span className="font-semibold text-blue-700 text-lg">{question.points}</span>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-blue-500">
                      ✏️
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Question Editor Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Edit Question - {editingQuestion.points} point{editingQuestion.points > 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer (What the host reads to players)
                  </label>
                  <textarea
                    value={editingQuestion.answer}
                    onChange={(e) => updateQuestion(
                      categories.find(c => c.questions.some(q => q.id === editingQuestion.id))?.id || '',
                      editingQuestion.id,
                      'answer',
                      e.target.value
                    )}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="This planet is known as the Red Planet"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the clue that the host will read to the players
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question (What players respond with)
                  </label>
                  <textarea
                    value={editingQuestion.question}
                    onChange={(e) => updateQuestion(
                      categories.find(c => c.questions.some(q => q.id === editingQuestion.id))?.id || '',
                      editingQuestion.id,
                      'question',
                      e.target.value
                    )}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="What is Mars?"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Players should respond with this answer (usually starts with "What is...", "Who is...", etc.)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Dialog Modal */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Save Current State
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Save Name
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g., 'My Best Version', 'AI Generated', etc."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && saveName.trim()) {
                        saveCurrentState();
                      }
                    }}
                    autoFocus
                  />
                </div>
                
                <p className="text-sm text-gray-600">
                  Save your current Jeopardy board as a checkpoint. You can load it later if needed.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentState}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Add to Event Program Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {categories.length > 0 ? `${categories.length} categories with ${categories.reduce((total, cat) => total + cat.questions.length, 0)} questions` : 'No categories created yet'}
          </div>
          <button
            onClick={handleSave}
            disabled={categories.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🎯 Add to Event Program
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Jeopardy; 