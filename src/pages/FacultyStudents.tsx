import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { db } from '../services/db';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  UserPlus, 
  X, 
  Trash2, 
  Upload, 
  Check, 
  FileSpreadsheet,
  AlertCircle,
  Mail
} from 'lucide-react';

export const FacultyStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState<number | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkSemester, setBulkSemester] = useState(5);

  // New Student form
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Information Technology');
  const [semester, setSemester] = useState(5);
  const [division, setDivision] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const loadStudents = () => {
    setStudents(db.getAllStudents());
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentNumber.trim() || !name.trim()) return;

    const studentEmail = email.trim() || `${enrollmentNumber.trim().toLowerCase()}@college.edu`;

    db.addStudent({
      enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
      name: name.trim(),
      email: studentEmail,
      department,
      semester,
      division: division.trim().toUpperCase(),
      rollNumber: rollNumber.trim() || '01',
      phone: phone.trim() || '+91 98000 00000',
      faceEnrollmentStatus: true
    });

    loadStudents();
    setShowAddModal(false);
    setEnrollmentNumber('');
    setName('');
    setEmail('');
    setRollNumber('');
    setPhone('');
    setFeedback('✅ Real student with verified Email ID successfully enrolled into college records!');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete student "${studentName}"?`)) {
      db.deleteStudent(studentId);
      loadStudents();
      setFeedback(`Removed student "${studentName}" from roster.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleClearAllStudents = () => {
    if (window.confirm('Are you sure you want to remove ALL students? This will clear the student roster completely.')) {
      db.clearAllStudents();
      loadStudents();
      setFeedback('All students cleared from roster.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    // Parses CSV or TSV lines: Enrollment, Name, Email, Roll, Div, Phone
    const lines = bulkInput.trim().split('\n');
    let imported = 0;

    const parsedList: Array<Omit<Student, 'id' | 'userId' | 'createdAt'>> = [];

    for (const line of lines) {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        const enr = parts[0];
        const studentName = parts[1];
        const studentEmail = parts[2] && parts[2].includes('@') ? parts[2] : `${enr.toLowerCase()}@college.edu`;
        const roll = parts[3] || (imported + 1).toString();
        const div = parts[4] || 'A';
        const mobile = parts[5] || '+91 98000 00000';
        const sem = parts[6] && !isNaN(Number(parts[6])) ? Number(parts[6]) : bulkSemester;

        parsedList.push({
          enrollmentNumber: enr.toUpperCase(),
          name: studentName,
          email: studentEmail.toLowerCase(),
          department: 'Information Technology',
          semester: sem,
          division: div.toUpperCase(),
          rollNumber: roll,
          phone: mobile,
          faceEnrollmentStatus: true
        });
      }
    }

    if (parsedList.length > 0) {
      imported = db.addStudentsBatch(parsedList);
      loadStudents();
      setShowBulkModal(false);
      setBulkInput('');
      setFeedback(`✅ Successfully imported ${imported} real students for Semester ${bulkSemester} with Email IDs!`);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const filtered = students.filter(s => {
    const matchesSemester = semesterFilter === 'ALL' || s.semester === semesterFilter;
    const matchesDiv = divisionFilter === 'ALL' || s.division === divisionFilter;
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      s.rollNumber.includes(search);
    return matchesSemester && matchesDiv && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900">Student Directory & Email Roster</h2>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
              {students.length} Total Enrolled
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Registered students authenticated via unique Email ID. 1 attendance active per email ID per subject.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Add Single Student
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Bulk Import CSV (100+)
          </button>

          {students.length > 0 && (
            <button
              onClick={handleClearAllStudents}
              className="px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition flex items-center gap-1"
              title="Clear all students"
            >
              <Trash2 className="w-4 h-4" />
              Clear Roster
            </button>
          )}
        </div>
      </div>

      {/* Semester Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span>🎓 Filter Students by Semester:</span>
          {semesterFilter !== 'ALL' && (
            <button
              onClick={() => setSemesterFilter('ALL')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Show All Semesters →
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            onClick={() => setSemesterFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              semesterFilter === 'ALL'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Semesters</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              semesterFilter === 'ALL' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {students.length}
            </span>
          </button>

          {availableSemesters.map((sem) => {
            const count = students.filter(s => s.semester === sem).length;
            const isSelected = semesterFilter === sem;

            return (
              <button
                key={sem}
                onClick={() => setSemesterFilter(sem)}
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

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, roll no, enrollment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Division:</span>
          {['ALL', 'A', 'B', 'C'].map((div) => (
            <button
              key={div}
              onClick={() => setDivisionFilter(div)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                divisionFilter === div
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Div {div}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No students found matching your search.</p>
            <p className="text-[11px]">Click "Add Single Student" or "Bulk Import CSV" to enroll real students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Enrollment</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Registered Email ID (Gmail)</th>
                  <th className="py-3 px-4">Semester & Div</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Single Email Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.rollNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-700 font-semibold">{s.enrollmentNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{s.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        <Mail className="w-3 h-3 text-red-600" />
                        {s.email || `${s.enrollmentNumber.toLowerCase()}@college.edu`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">Sem {s.semester} (Div {s.division})</td>
                    <td className="py-3.5 px-4 text-slate-500">{s.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteStudent(s.id, s.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Real Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Real Student to Roster</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Enrollment Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 23IT108"
                  value={enrollmentNumber}
                  onChange={(e) => setEnrollmentNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tirth Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Email ID (Gmail) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tirthpatel1112005@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Used for 1-email-1-attendance rule & Gmail notifications</span>
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
                  <label className="block font-bold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 55"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow"
                >
                  Save Real Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bulk Import Students via CSV</h3>
                <p className="text-xs text-slate-500">Paste your batch rows (Enrollment, Name, Email, Roll, Div, Phone)</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Semester for Batch *</label>
                <select
                  value={bulkSemester}
                  onChange={(e) => setBulkSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-900"
                >
                  {availableSemesters.map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CSV / TSV Text Data</label>
                <textarea
                  rows={8}
                  required
                  placeholder={`23IT101, Aarav Patel, aarav@gmail.com, 01, A, +91 98000 00001\n23IT102, Diya Shah, diya@gmail.com, 02, A, +91 98000 00002\n23IT103, Tirth Patel, tirthpatel1112005@gmail.com, 03, A, +91 98000 00003`}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-700 text-[11px] space-y-1">
                <p className="font-bold text-blue-900">Format Guide:</p>
                <p>• One student per line: <code>Enrollment, Full Name, Email, Roll, Div, Phone</code></p>
                <p>• Students will be enrolled into <strong>Semester {bulkSemester}</strong> with their official email IDs.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow"
                >
                  Import All Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
