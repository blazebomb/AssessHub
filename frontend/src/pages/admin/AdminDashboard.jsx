import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card, { CardTitle, CardDescription } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { FileText, Users, ClipboardList, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ tests: 0, users: 0, released: 0 });
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, usersRes] = await Promise.all([
        adminService.getAllTests(),
        adminService.getAllUsers(),
      ]);
      const testsData = testsRes.data.data || [];
      const usersData = usersRes.data.data || [];
      setTests(testsData.slice(0, 5));
      setStats({
        tests: testsData.length,
        users: usersData.length,
        released: testsData.filter((t) => t.resultsReleased).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  const statCards = [
    { label: 'Total Tests', value: stats.tests, icon: FileText, color: 'text-primary' },
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-secondary' },
    { label: 'Results Released', value: stats.released, icon: CheckCircle, color: 'text-success' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
        <p className="text-text-light mt-1">Overview of your assessment platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-text-light">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>Recent Tests</CardTitle>
        <CardDescription>Latest created assessments</CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-text-light">Title</th>
                <th className="text-left py-3 px-2 font-medium text-text-light">Team</th>
                <th className="text-left py-3 px-2 font-medium text-text-light">Role</th>
                <th className="text-left py-3 px-2 font-medium text-text-light">Status</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{test.title}</td>
                  <td className="py-3 px-2 text-text-light">{test.assignedTeamName}</td>
                  <td className="py-3 px-2">
                    <Badge variant="primary">{test.assignedRole}</Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={test.resultsReleased ? 'success' : 'warning'}>
                      {test.resultsReleased ? 'Released' : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-light">
                    No tests created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
