"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  HelpCircle, CheckCircle2, XCircle, ChevronRight, Award, 
  RotateCcw, Sparkles, Clock, FileQuestion, ArrowRight, HelpCircle as HelpIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface Quiz {
  id: number;
  title: string;
  document_id?: string;
  created_at: string;
  questions: Question[];
}

interface QuizResult {
  id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  answers: Record<string, string>;
  taken_at: string;
}

interface QuizWorkspaceProps {
  selectedDoc: string | null;
}

export default function QuizWorkspace({ selectedDoc }: QuizWorkspaceProps) {
  const { userId } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  
  // Active Quiz taking state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({}); // tracks if user has clicked "check" for a question
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<QuizResult | null>(null);

  const apiHeaders = {
    "Content-Type": "application/json",
    "X-User-Id": userId || "anonymous"
  };

  useEffect(() => {
    fetchQuizzes();
  }, [userId]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/quizzes/`, {
        headers: apiHeaders
      });
      const data = await res.json();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedDoc) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/quizzes/generate?document_id=${encodeURIComponent(selectedDoc)}&num_questions=${numQuestions}`, {
        method: "POST",
        headers: apiHeaders
      });
      const data = await res.json();
      if (data.id) {
        setQuizzes([data, ...quizzes]);
        setActiveQuiz(data);
        startQuizSession(data);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const startQuizSession = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setQuizFinished(false);
    setFinalScore(null);
  };

  const handleSelectAnswer = (questionId: number, answerIndexStr: string) => {
    if (submittedAnswers[questionId]) return; // locked after checking
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerIndexStr
    });
  };

  const handleCheckAnswer = (questionId: number) => {
    if (selectedAnswers[questionId] === undefined) return;
    setSubmittedAnswers({
      ...submittedAnswers,
      [questionId]: true
    });
  };

  const handleNext = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!activeQuiz) return;
    setLoading(true);
    
    // Calculate local score for quick display
    let score = 0;
    activeQuiz.questions.forEach((q) => {
      const userAns = selectedAnswers[q.id];
      if (String(userAns).trim() === String(q.correct_answer).trim()) {
        score += 1;
      }
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          score: score,
          total_questions: activeQuiz.questions.length,
          answers: selectedAnswers
        })
      });
      const data = await res.json();
      setFinalScore(data);
      setQuizFinished(true);
    } catch (e) {
      console.error(e);
      // Fallback local result if network fails
      setFinalScore({
        id: 0,
        quiz_id: activeQuiz.id,
        score: score,
        total_questions: activeQuiz.questions.length,
        answers: selectedAnswers,
        taken_at: new Date().toISOString()
      });
      setQuizFinished(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-1 h-full gap-6">
      {/* Quizzes Sidebar List */}
      <div className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FileQuestion size={18} className="text-zinc-500" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Assessments</h3>
        </div>

        {selectedDoc ? (
          <div className="bg-white dark:bg-zinc-805 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
            <div className="text-xs text-zinc-500">
              Generate quiz for <span className="font-semibold">{selectedDoc}</span>:
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span>Questions:</span>
              <select 
                value={numQuestions} 
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="bg-zinc-100 dark:bg-zinc-800 rounded p-1 border border-zinc-250 font-medium"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={generating}
              className="w-full py-2 px-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white font-medium text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={14} className="animate-pulse" />
              {generating ? "Generating..." : "Generate Quiz"}
            </button>
          </div>
        ) : (
          <div className="text-xs bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl text-zinc-500">
            Upload and select a study document to enable generating custom quizzes.
          </div>
        )}

        {loading && quizzes.length === 0 ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">History</h4>
            {quizzes.length === 0 ? (
              <p className="text-xs text-center text-zinc-500 mt-4">No assessments taken yet.</p>
            ) : (
              quizzes.map((quiz) => (
                <button 
                  key={quiz.id}
                  onClick={() => startQuizSession(quiz)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                    activeQuiz?.id === quiz.id && quizStarted
                      ? "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm text-blue-600 dark:text-blue-400 font-medium" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <span className="truncate pr-1">{quiz.title}</span>
                  <ChevronRight size={12} className="text-zinc-450 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Quiz View */}
      <div className="flex-1 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col justify-center relative overflow-hidden">
        {quizStarted && activeQuiz ? (
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            {/* Top Stats */}
            {!quizFinished && (
              <div className="mb-6">
                <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Progress: {Math.round(((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100)}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Content card */}
            <div className="flex-1 flex flex-col justify-center py-4">
              <AnimatePresence mode="wait">
                {!quizFinished ? (
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Question text */}
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {activeQuiz.questions[currentQuestionIndex].question_text}
                    </h2>

                    {/* Question options */}
                    <div className="space-y-3">
                      {activeQuiz.questions[currentQuestionIndex].options.map((option, idx) => {
                        const qId = activeQuiz.questions[currentQuestionIndex].id;
                        const isSelected = selectedAnswers[qId] === String(idx);
                        const isSubmitted = submittedAnswers[qId];
                        const isCorrect = String(activeQuiz.questions[currentQuestionIndex].correct_answer) === String(idx);

                        let btnStyle = "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900";
                        if (isSelected) {
                          btnStyle = "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400";
                        }
                        if (isSubmitted) {
                          if (isCorrect) {
                            btnStyle = "border-green-600 bg-green-50/70 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-medium";
                          } else if (isSelected) {
                            btnStyle = "border-red-600 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-400";
                          } else {
                            btnStyle = "border-zinc-150 dark:border-zinc-850 opacity-60";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectAnswer(qId, String(idx))}
                            disabled={isSubmitted}
                            className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span className="leading-snug">{option}</span>
                            {isSubmitted && isCorrect && (
                              <CheckCircle2 size={16} className="text-green-600 shrink-0 ml-2" />
                            )}
                            {isSubmitted && !isCorrect && isSelected && (
                              <XCircle size={16} className="text-red-600 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation Reveal */}
                    {submittedAnswers[activeQuiz.questions[currentQuestionIndex].id] && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50/40 dark:bg-zinc-900/50 border border-blue-100/50 dark:border-zinc-800 p-4 rounded-xl text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
                      >
                        <span className="font-bold text-zinc-900 dark:text-zinc-200 block mb-1">Explanation:</span>
                        {activeQuiz.questions[currentQuestionIndex].explanation || "No further details provided."}
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  // Summary completion screen
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="flex justify-center">
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-full text-yellow-600 border border-yellow-200">
                        <Award size={48} className="animate-bounce" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Assessment Completed!</h2>
                      <p className="text-xs text-zinc-500">
                        Here is your performance details on <span className="font-semibold">{activeQuiz.title}</span>.
                      </p>
                    </div>

                    {finalScore && (
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl max-w-sm mx-auto">
                        <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                          {finalScore.score} / {finalScore.total_questions}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                          Score: {Math.round((finalScore.score / finalScore.total_questions) * 100)}%
                        </div>
                        
                        <div className="text-xs mt-4 text-zinc-650 dark:text-zinc-350">
                          {finalScore.score === finalScore.total_questions ? "Perfect score! Outstanding job!" :
                           finalScore.score >= finalScore.total_questions * 0.7 ? "Great work! You have a solid grasp." :
                           "Good attempt! Try reviewing notes and taking it again."}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center gap-4 pt-4">
                      <button
                        onClick={() => startQuizSession(activeQuiz)}
                        className="py-2.5 px-4 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                      >
                        <RotateCcw size={14} />
                        Retake Assessment
                      </button>
                      <button
                        onClick={() => setQuizStarted(false)}
                        className="py-2.5 px-5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Back to Library
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            {!quizFinished && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between items-center mt-6">
                <div></div>
                {!submittedAnswers[activeQuiz.questions[currentQuestionIndex].id] ? (
                  <button
                    onClick={() => handleCheckAnswer(activeQuiz.questions[currentQuestionIndex].id)}
                    disabled={selectedAnswers[activeQuiz.questions[currentQuestionIndex].id] === undefined}
                    className="py-2.5 px-6 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 text-white font-semibold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="py-2.5 px-6 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    {currentQuestionIndex === activeQuiz.questions.length - 1 ? "Finish" : "Next"}
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Default Idle Screen
          <div className="flex-1 flex flex-col justify-center items-center text-center text-zinc-400 gap-3">
            <HelpIcon size={48} className="text-zinc-350 dark:text-zinc-800" />
            <div>
              <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">No active quiz session</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Select a quiz from history, or customize parameters and click "Generate Quiz" to test your knowledge.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
