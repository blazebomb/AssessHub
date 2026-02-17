import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { testService } from '../../services/testService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { BookOpen, Trophy, Clock } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, resultsRes] = await Promise.all([
        testService.getAssignedTests(),
        testService.getResults(),
      ]);
      setTests(testsRes.data.data || []);
      setResults(resultsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  const available = tests.filter((t) => !t.alreadySubmitted);
  const completed = tests.filter((t) => t.alreadySubmitted);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Welcome, {user?.name}!</h1>
        <p className="text-text-light mt-1">Here's your assessment overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{available.length}</p>
            <p className="text-sm text-text-light">Available Tests</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{completed.length}</p>
            <p className="text-sm text-text-light">Completed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{results.length}</p>
            <p className="text-sm text-text-light">Results Available</p>
          </div>
        </Card>
      </div>

      {available.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Available Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {available.slice(0, 4).map((test) => (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{test.title}</h3>
                  <Badge variant="primary">{test.timeLimitMinutes} min</Badge>
                </div>
                <p className="text-sm text-text-light mb-4 line-clamp-2">{test.description}</p>
                <Link
                  to={`/dashboard/tests/${test.id}/take`}
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                >
                  Start Test →
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
