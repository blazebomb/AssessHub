import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card, { CardTitle } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function CreateTestPage() {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 30,
    assignedRole: '',
    assignedTeamId: '',
    questions: [
      {
        questionText: '',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
      },
    ],
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await adminService.getAllTeams();
      setTeams(res.data.data || []);
    } catch {
      setTeams([
        { id: 1, name: 'Development Team 1' },
        { id: 2, name: 'Development Team 2' },
        { id: 3, name: 'Data Analyst Team 1' },
        { id: 4, name: 'Data Analyst Team 2' },
        { id: 5, name: 'DevOps Team' },
      ]);
    }
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          questionText: '',
          options: [
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
          ],
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    if (form.questions.length === 1) return;
    setForm({
      ...form,
      questions: form.questions.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (index, text) => {
    const questions = [...form.questions];
    questions[index].questionText = text;
    setForm({ ...form, questions });
  };

  const updateOption = (qIndex, oIndex, text) => {
    const questions = [...form.questions];
    questions[qIndex].options[oIndex].optionText = text;
    setForm({ ...form, questions });
  };

  const toggleCorrect = (qIndex, oIndex) => {
    const questions = [...form.questions];
    questions[qIndex].options[oIndex].isCorrect = !questions[qIndex].options[oIndex].isCorrect;
    setForm({ ...form, questions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.assignedRole || !form.assignedTeamId) {
      toast.error('Please fill all required fields');
      return;
    }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.questionText) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        toast.error(`Question ${i + 1} must have at least one correct answer`);
        return;
      }
      const allFilled = q.options.every((o) => o.optionText);
      if (!allFilled) {
        toast.error(`All options in Question ${i + 1} must be filled`);
        return;
      }
    }

    setLoading(true);
    try {
      await adminService.createTest({
        ...form,
        assignedTeamId: parseInt(form.assignedTeamId),
        timeLimitMinutes: parseInt(form.timeLimitMinutes),
      });
      toast.success('Test created successfully!');
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Create New Test</h1>
        <p className="text-text-light mt-1">Configure test details and add questions</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardTitle>Test Details</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Test Title"
              placeholder="e.g. Java Fundamentals"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              label="Time Limit (minutes)"
              type="number"
              min="1"
              value={form.timeLimitMinutes}
              onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })}
            />
            <Select
              label="Assigned Team"
              value={form.assignedTeamId}
              onChange={(e) => setForm({ ...form, assignedTeamId: e.target.value })}
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </Select>
            <Select
              label="Assigned Role"
              value={form.assignedRole}
              onChange={(e) => setForm({ ...form, assignedRole: e.target.value })}
            >
              <option value="">Select a role</option>
              <option value="TRAINEE">Trainee</option>
              <option value="INTERN">Intern</option>
              <option value="PPO">PPO</option>
              <option value="TL">Team Lead</option>
              <option value="TR">Team Representative</option>
            </Select>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-text mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[80px]"
              placeholder="Brief description of the test..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </Card>

        <div className="space-y-4 mb-6">
          {form.questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-text-light" />
                  <span className="text-sm font-semibold text-primary">Question {qIndex + 1}</span>
                </div>
                {form.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="p-1 text-danger hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Input
                placeholder="Enter question text..."
                value={question.questionText}
                onChange={(e) => updateQuestion(qIndex, e.target.value)}
                className="mb-4"
              />

              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={() => toggleCorrect(qIndex, oIndex)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-text-light w-8">
                        {String.fromCharCode(65 + oIndex)}
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      value={option.optionText}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-light mt-2">
                Check the box next to correct answer(s)
              </p>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={addQuestion}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          <Button type="submit" loading={loading}>
            Create Test
          </Button>
        </div>
      </form>
    </div>
  );
}
