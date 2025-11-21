// src/components/TestTaking.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import type { User, Assessment, Question } from '../utils/supabaseClient';
import { autoGradeMCQ } from '../utils/autoGrading';
import NavigationSidebar from './NavigationSidebar';
import { Clock, Send } from 'lucide-react';

interface TestTakingProps {
  user: User;
}

const TestTaking: React.FC<TestTakingProps> = ({ user }) => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchAssessment = async () => {
    try {
      // Fetch assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Set timer
      setTimeLeft(assessmentData.duration_minutes * 60);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      alert('Error loading assessment');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const confirmed = window.confirm('Are you sure you want to submit your test?');
    if (!confirmed) return;

    setSubmitting(true);

    try {
      // Auto-grade MCQ
      const mcqScore = autoGradeMCQ(questions, answers);
      
      // Calculate total possible marks
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      
      
      // Calculate percentage score
      const percentageScore = totalMarks > 0 ? Math.round((mcqScore / totalMarks) * 100) : 0;

      // Create submission
      const { data: submission, error } = await supabase
        .from('submissions')
        .insert({
          assessment_id: assessmentId,
          student_id: user.id,
          answers: answers,
          mcq_score: mcqScore,
          theory_score: null, // Will be graded by faculty
          total_score: percentageScore,
        })
        .select()
        .single();

      if (error) throw error;

      alert('Test submitted successfully!');
      navigate(`/results/${submission.id}`);
    } catch (error: any) {
      console.error('Error submitting test:', error);
      alert('Error submitting test: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading test...</div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex">
        <NavigationSidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg text-red-600">Assessment not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <NavigationSidebar user={user} />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{assessment.title}</h2>
                <p className="text-gray-600">
                  {assessment.subject} - Unit {assessment.unit}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-lg font-semibold text-primary-600">
                  <Clock className="w-5 h-5" />
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-gray-600 mt-1">Time Remaining</p>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6 mb-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Question {index + 1}
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({question.marks} {question.marks === 1 ? 'mark' : 'marks'})
                    </span>
                  </h3>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {question.type}
                  </span>
                </div>

                <p className="text-gray-700 mb-4">{question.question_text}</p>

                {question.type === 'MCQ' && question.options ? (
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-gray-700">
                          {String.fromCharCode(65 + oIndex)}. {option}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={6}
                    placeholder="Type your answer here..."
                  />
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {Object.keys(answers).length} of {questions.length} questions answered
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-gray-50 text-orange-400 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaking;