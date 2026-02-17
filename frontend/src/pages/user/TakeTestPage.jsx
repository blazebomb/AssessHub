import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testService } from '../../services/testService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

export default function TakeTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: [optionId1, optionId2] } for multi-correct, { questionId: optionId } for single
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef(new Date().toISOString());
  const timerRef = useRef(null);

  useEffect(() => {
    fetchTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await testService.getTestById(id);
      const testData = res.data.data;
      setTest(testData);
      setTimeLeft(testData.timeLimitMinutes * 60);
      startTimeRef.current = new Date().toISOString();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load test';
      toast.error(errorMsg);
      setTimeout(() => navigate('/dashboard/tests'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);

    const answersPayload = test.questions.map((q) => {
      const answer = answers[q.id];
      // Handle both single (number) and multi (array) selections
      const selectedOptionIds = Array.isArray(answer) ? answer : (answer ? [answer] : []);
      
      return {
        questionId: q.id,
        selectedOptionIds: selectedOptionIds,
      };
    });

    try {
      await testService.submitTest(id, {
        startTime: startTimeRef.current,
        answers: answersPayload,
      });
      setSubmitted(true);
      toast.success('Test submitted successfully!');
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => navigate('/dashboard/tests'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit test';
      toast.error(errorMsg);
      // Don't navigate on error - let user retry
    } finally {
      setSubmitting(false);
    }
  }, [test, answers, id, submitted, submitting, navigate]);

  useEffect(() => {
    if (!test || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, submitted, handleSubmit]);

  const selectOption = (questionId, optionId, isMultiCorrect) => {
    setAnswers((prev) => {
      const currentAnswer = prev[questionId];
      
      if (isMultiCorrect) {
        // Multi-correct: use array
        const currentArray = Array.isArray(currentAnswer) ? currentAnswer : (currentAnswer ? [currentAnswer] : []);
        const isSelected = currentArray.includes(optionId);
        
        if (isSelected) {
          // Deselect
          return { ...prev, [questionId]: currentArray.filter(id => id !== optionId) };
        } else {
          // Select
          return { ...prev, [questionId]: [...currentArray, optionId] };
        }
      } else {
        // Single-correct: replace selection
        return { ...prev, [questionId]: optionId };
      }
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;
  if (!test) return null;

  const question = test.questions[currentQ];
  const isLowTime = timeLeft < 60;
  const isMultiCorrect = question.multiCorrect || false;
  const answeredCount = Object.keys(answers).filter(qId => {
    const answer = answers[qId];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return answer != null;
  }).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Timer bar */}
      <div className={`sticky top-0 z-40 bg-surface border-b border-border p-4 rounded-b-xl shadow-sm mb-6 flex items-center justify-between ${isLowTime ? 'bg-red-50' : ''}`}>
        <div>
          <h2 className="font-semibold text-text">{test.title}</h2>
          <p className="text-sm text-text-light">
            Question {currentQ + 1} of {test.questions.length} • {answeredCount}/{test.questions.length} answered
          </p>
        </div>
        <div className={`flex items-center gap-2 text-lg font-mono font-bold ${isLowTime ? 'text-danger animate-pulse' : 'text-text'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question navigation pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {test.questions.map((q, i) => {
          const answer = answers[q.id];
          const isAnswered = Array.isArray(answer) ? answer.length > 0 : answer != null;
          
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                i === currentQ
                  ? 'bg-primary text-white'
                  : isAnswered
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-text-light hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-medium">{question.questionText}</p>
          {isMultiCorrect && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              Multiple answers allowed
            </span>
          )}
        </div>

        <div className="space-y-3">
          {question.options.map((option) => {
            const answer = answers[question.id];
            const isSelected = isMultiCorrect
              ? (Array.isArray(answer) && answer.includes(option.id))
              : (answer === option.id);
            
            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/30 hover:bg-gray-50'
                }`}
                onClick={(e) => {
                  // Prevent double-triggering when clicking the label
                  if (e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    selectOption(question.id, option.id, isMultiCorrect);
                  }
                }}
              >
                <input
                  type={isMultiCorrect ? 'checkbox' : 'radio'}
                  name={isMultiCorrect ? `question-${question.id}-${option.id}` : `question-${question.id}`}
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    selectOption(question.id, option.id, isMultiCorrect);
                  }}
                  className={`w-5 h-5 cursor-pointer ${
                    isMultiCorrect 
                      ? 'rounded border-gray-300 text-primary focus:ring-primary' 
                      : 'border-gray-300 text-primary focus:ring-primary'
                  }`}
                />
                <span className="text-sm flex-1 cursor-pointer">{option.optionText}</span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {currentQ < test.questions.length - 1 ? (
          <Button onClick={() => setCurrentQ((prev) => prev + 1)}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={submitting}
            variant={answeredCount < test.questions.length ? 'danger' : 'success'}
          >
            {answeredCount < test.questions.length && (
              <AlertTriangle className="w-4 h-4 mr-1" />
            )}
            Submit Test
          </Button>
        )}
      </div>
    </div>
  );
}
