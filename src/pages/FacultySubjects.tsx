import React, { useState, useEffect } from 'react';
import { Subject } from '../types';
import { db } from '../services/db';
import { BookOpen, Plus, X, Trash2, Check } from 'lucide-react';

export const FacultySubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterSemester, setFilterSemester] = useState<number | 'ALL'>('ALL');

  // New Subject form
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [semester, setSemester] = useState(5);
  const [department, setDepartment] = useState('Information Technology');

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const loadSubjects = () => {
    setSubjects(db.getAllSubjects());
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const displayedSubjects = filterSemester === 'ALL'
    ? subjects
    : subjects.filter(s => s.semester === filterSemester);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim() || !subjectName.trim()) return;

    db.addSubject({
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),
      semester,
      department
    });

    loadSubjects();
    setShowAddModal(false);
    setSubjectCode('');
    setSubjectName('');
    setFeedback('✅ Academic course added to curriculum!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteSubject = (subjectId: string, name: string) => {
    if (window.confirm(`Delete subject "${name}"?`)) {
      db.deleteSubject(subjectId);
      loadSubjects();
      setFeedback(`Removed "${name}".`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleClearAllSubjects = () => {
    if (window.confirm('Are you sure you want to remove ALL courses from the subject catalog?')) {
      db.clearAllSubjects();
      loadSubjects();
      setFeedback('All courses cleared.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Academic Subjects ({subjects.length})</h2>
          <p className="text-xs text-slate-500">
            Curriculum course catalog with subject codes, semester and department mapping.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {subjects.length > 0 && (
            <button
              onClick={handleClearAllSubjects}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Add Real Subject
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Semester Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>🎓 Filter Courses by Semester:</span>
          {filterSemester !== 'ALL' && (
            <button
              onClick={() => setFilterSemester('ALL')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Show All Semesters →
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setFilterSemester('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              filterSemester === 'ALL'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Semesters</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterSemester === 'ALL' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {subjects.length}
            </span>
          </button>

          {availableSemesters.map((sem) => {
            const count = subjects.filter(s => s.semester === sem).length;
            const isSelected = filterSemester === sem;

            return (
              <button
                key={sem}
                onClick={() => {
                  setFilterSemester(sem);
                  setSemester(sem);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Sem {sem}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700 font-extrabold'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {displayedSubjects.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
          {filterSemester === 'ALL'
            ? 'No courses found. Click + Add Real Subject to insert your college courses.'
            : `No courses found for Semester ${filterSemester}. Click + Add Real Subject to add a course for Semester ${filterSemester}.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                  Code: {sub.subjectCode}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Semester {sub.semester}
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{sub.subjectName}</h4>
                <p className="text-xs text-slate-500">{sub.department}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDeleteSubject(sub.id, sub.subjectName)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Academic Course</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3150718"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Learning & Neural Networks"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow"
                >
                  Insert Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
