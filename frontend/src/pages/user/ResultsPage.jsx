import { useState, useEffect } from 'react';
import { testService } from '../../services/testService';
import Card, { CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Trophy, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await testService.getResults();
      setResults(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">My Results</h1>
        <p className="text-text-light mt-1">Results are shown after admin releases them</p>
      </div>

      {results.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy className="w-12 h-12 text-text-light mx-auto mb-3" />
          <p className="text-text-light">No results available yet</p>
          <p className="text-xs text-text-light mt-1">Results will appear here after admin releases them</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {results.map((result) => {
            const percentage = Math.round((result.score / result.totalMarks) * 100);
            const variant = percentage >= 70 ? 'success' : percentage >= 40 ? 'warning' : 'danger';

            return (
              <Card key={result.id}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(expanded === result.id ? null : result.id)}
                >
                  <div>
                    <h3 className="font-semibold text-text">{result.testTitle}</h3>
                    <p className="text-sm text-text-light mt-1">
                      Submitted: {result.endTime ? new Date(result.endTime).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{result.score}/{result.totalMarks}</p>
                      <Badge variant={variant}>{percentage}%</Badge>
                    </div>
                    {expanded === result.id ? (
                      <ChevronUp className="w-5 h-5 text-text-light" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-light" />
                    )}
                  </div>
                </div>

                {expanded === result.id && result.answers && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <h4 className="font-medium text-sm text-text-light mb-2">Answer Key</h4>
                    {result.answers.map((answer, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-lg border ${
                          answer.isCorrect
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm">
                            {i + 1}. {answer.questionText}
                          </p>
                          {answer.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <span className="text-text-light">Your Answer: </span>
                            <span className={answer.isCorrect ? 'text-emerald-700 font-medium' : 'text-red-700'}>
                              {answer.selectedOptionTexts && answer.selectedOptionTexts.length > 0
                                ? answer.selectedOptionTexts.join(', ')
                                : answer.selectedOptionText || 'Not answered'}
                            </span>
                          </p>
                          <p>
                            <span className="text-text-light">Correct Answer: </span>
                            <span className="text-emerald-700 font-medium">
                              {answer.correctOptionTexts && answer.correctOptionTexts.length > 0
                                ? answer.correctOptionTexts.join(', ')
                                : answer.correctOptionText || 'N/A'}
                            </span>
                          </p>
                          {answer.correctOptionTexts && answer.correctOptionTexts.length === 0 && 
                           !answer.correctOptionText && (
                            <p className="text-xs text-amber-600 mt-1">
                              ⚠️ No correct answer was set for this question during test creation
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
