import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  AlertTriangle,
  Mail,
  Smartphone,
  RotateCcw,
  GraduationCap,
  ArrowRight,
  CheckSquare,
  Square,
  Sparkles,
  UserX
} from 'lucide-react';
import { generateStudentAvatarSvg } from '../services/biometrics';

export const FacultyStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState<number | 'ALL'>('ALL');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedStudentForBio, setSelectedStudentForBio] = useState<Student | null>(null);

  // Deletion Modals state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [showClearSemesterModal, setShowClearSemesterModal] = useState(false);

  // Multi-select for Promotion & Batch Deletion
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [promotionTargetSemester, setPromotionTargetSemester] = useState<number>(2);
  const [studentsToPromoteList, setStudentsToPromoteList] = useState<Student[]>([]);

  // Add Single Student Form state (Semester first!)
  const [addSemester, setAddSemester] = useState<number>(1);
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Information Technology');
  const [division, setDivision] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Bulk import state
  const [bulkSemester, setBulkSemester] = useState(1);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const loadStudents = () => {
    setStudents(db.getAllStudents());
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Sync addSemester with active filter if viewing a specific semester
  useEffect(() => {
    if (semesterFilter !== 'ALL') {
      setAddSemester(semesterFilter);
      setBulkSemester(semesterFilter);
    }
  }, [semesterFilter]);

  // Real-time validation for Add Student enrollment number against selected semester
  const enrollmentValidation = useMemo(() => {
    if (!enrollmentNumber.trim()) return null;
    return db.validateEnrollmentNumber(enrollmentNumber.trim(), addSemester);
  }, [enrollmentNumber, addSemester, students]);

  // Clear selections when semester filter changes
  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [semesterFilter]);

  // Open Add Modal with clean defaults
  const handleOpenAddModal = (presetSemester?: number) => {
    const sem = presetSemester || (semesterFilter !== 'ALL' ? semesterFilter : 1);
    setAddSemester(sem);
    setEnrollmentNumber('');
    setName('');
    setEmail('');
    setRollNumber('');
    setPhone('');
    setDivision('A');
    setAddFormError(null);
    setShowAddModal(true);
  };

  // Open Promote Modal for a single student
  const handleOpenPromoteSingle = (student: Student) => {
    if (student.semester >= 8) {
      setFeedback({
        message: `Student ${student.name} (${student.enrollmentNumber}) is already in Semester 8 (Final Semester).`,
        type: 'error'
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    setStudentsToPromoteList([student]);
    setPromotionTargetSemester(student.semester + 1);
    setShowPromoteModal(true);
  };

  // Open Promote Modal for all selected students
  const handleOpenPromoteBatch = () => {
    const toPromote = students.filter(s => selectedStudentIds.has(s.id) && s.semester < 8);
    if (toPromote.length === 0) {
      setFeedback({
        message: 'Please select eligible students (Semesters 1 to 7) to promote.',
        type: 'error'
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    setStudentsToPromoteList(toPromote);
    const minSem = Math.min(...toPromote.map(s => s.semester));
    setPromotionTargetSemester(minSem + 1);
    setShowPromoteModal(true);
  };

  // Open Promote Modal for all students in current semester filter
  const handleOpenPromoteAllInSemester = (currentSem: number) => {
    if (currentSem >= 8) return;
    const semStudents = students.filter(s => s.semester === currentSem);
    if (semStudents.length === 0) {
      setFeedback({
        message: `No students enrolled in Semester ${currentSem} to promote.`,
        type: 'error'
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    setStudentsToPromoteList(semStudents);
    setPromotionTargetSemester(currentSem + 1);
    setShowPromoteModal(true);
  };

  // Execute promotion
  const handleConfirmPromotion = () => {
    if (studentsToPromoteList.length === 0) return;

    let successCount = 0;
    const errors: string[] = [];

    studentsToPromoteList.forEach(st => {
      const target = promotionTargetSemester > st.semester ? promotionTargetSemester : st.semester + 1;
      const res = db.promoteStudent(st.id, target, 'FACULTY');
      if (res.success) {
        successCount++;
      } else if (res.error) {
        errors.push(`${st.enrollmentNumber}: ${res.error}`);
      }
    });

    loadStudents();
    setShowPromoteModal(false);
    setSelectedStudentIds(new Set());

    if (successCount > 0) {
      setFeedback({
        message: `✅ Successfully promoted ${successCount} student(s) to Semester ${promotionTargetSemester}! Historical attendance records remain preserved.`,
        type: 'success'
      });
    } else {
      setFeedback({
        message: `Promotion failed: ${errors.join(', ')}`,
        type: 'error'
      });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  // Add Student Handler with strict semester validation
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    const cleanEnroll = enrollmentNumber.trim().toUpperCase();
    if (!cleanEnroll) {
      setAddFormError('Please enter a student enrollment number.');
      return;
    }

    if (!name.trim()) {
      setAddFormError('Please enter the student\'s full name.');
      return;
    }

    // Strict enrollment validation against database
    const validation = db.validateEnrollmentNumber(cleanEnroll, addSemester);
    if (!validation.valid) {
      setAddFormError(validation.error || 'Enrollment number does not belong to the selected semester.');
      return;
    }

    const studentEmail = email.trim() || `${cleanEnroll.toLowerCase()}@college.edu`;

    try {
      db.addStudent({
        enrollmentNumber: cleanEnroll,
        name: name.trim(),
        email: studentEmail,
        department,
        semester: addSemester,
        division: division.trim().toUpperCase() || 'A',
        rollNumber: rollNumber.trim() || '01',
        phone: phone.trim() || '+91 98000 00000'
      });

      loadStudents();
      setShowAddModal(false);
      setFeedback({
        message: `✅ Student ${name.trim()} (${cleanEnroll}) successfully registered in Semester ${addSemester}!`,
        type: 'success'
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setAddFormError(err.message || 'Failed to enroll student.');
    }
  };

  // Single Student Delete Execution
  const handleConfirmDeleteSingle = () => {
    if (!studentToDelete) return;
    const { id, name: sName, enrollmentNumber: enr, semester: sem } = studentToDelete;
    const success = db.deleteStudent(id);
    if (success) {
      loadStudents();
      setSelectedStudentIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setStudentToDelete(null);
      setFeedback({
        message: `🗑️ Successfully deleted student "${sName}" (${enr}) from Semester ${sem} records.`,
        type: 'success'
      });
    } else {
      setFeedback({
        message: `Failed to delete student ${sName}.`,
        type: 'error'
      });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  // Batch Delete Execution
  const handleConfirmBatchDelete = () => {
    const ids = Array.from(selectedStudentIds);
    if (ids.length === 0) return;

    const count = db.deleteStudentsBatch(ids);
    loadStudents();
    setSelectedStudentIds(new Set());
    setShowBatchDeleteModal(false);
    setFeedback({
      message: `🗑️ Successfully deleted ${count} student(s) from college records.`,
      type: 'success'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Clear Semester Roster Execution
  const handleConfirmClearSemester = () => {
    if (semesterFilter === 'ALL') {
      db.clearAllStudents();
      loadStudents();
      setShowClearSemesterModal(false);
      setSelectedStudentIds(new Set());
      setFeedback({
        message: '🗑️ Cleared all students across all semesters.',
        type: 'success'
      });
    } else {
      const count = db.deleteStudentsBySemester(semesterFilter);
      loadStudents();
      setShowClearSemesterModal(false);
      setSelectedStudentIds(new Set());
      setFeedback({
        message: `🗑️ Successfully removed ${count} student(s) from Semester ${semesterFilter}.`,
        type: 'success'
      });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleResetDevice = (s: Student) => {
    db.resetStudentDevice(s.id);
    loadStudents();
    if (selectedStudentForBio?.id === s.id) {
      setSelectedStudentForBio(prev => prev ? { ...prev, deviceId: undefined, deviceName: undefined, deviceVerified: false } : null);
    }
    setFeedback({
      message: `✅ Authorized device reset for ${s.name} (${s.enrollmentNumber}). Student can now bind their new phone on next login.`,
      type: 'success'
    });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    setBulkErrors([]);
    const lines = bulkInput.trim().split('\n');
    const parsedList: Array<Omit<Student, 'id' | 'userId' | 'createdAt'>> = [];
    const validationErrors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        const enr = parts[0].toUpperCase();
        const studentName = parts[1];
        const studentEmail = parts[2] && parts[2].includes('@') ? parts[2].toLowerCase() : `${enr.toLowerCase()}@college.edu`;
        const roll = parts[3] || (index + 1).toString();
        const div = parts[4] || 'A';
        const mobile = parts[5] || '+91 98000 00000';

        const val = db.validateEnrollmentNumber(enr, bulkSemester);
        if (!val.valid) {
          validationErrors.push(`Row ${index + 1} (${enr}): ${val.error}`);
        } else {
          parsedList.push({
            enrollmentNumber: enr,
            name: studentName,
            email: studentEmail,
            department: 'Information Technology',
            semester: bulkSemester,
            division: div.toUpperCase(),
            rollNumber: roll,
            phone: mobile
          });
        }
      }
    });

    if (validationErrors.length > 0) {
      setBulkErrors(validationErrors);
      return;
    }

    if (parsedList.length > 0) {
      const result = db.addStudentsBatch(parsedList);
      loadStudents();
      setShowBulkModal(false);
      setBulkInput('');
      setFeedback({
        message: `✅ Successfully imported ${result.added} student(s) into Semester ${bulkSemester}!`,
        type: 'success'
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Toggle selection for promotion or batch delete
  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Toggle all students in current filtered view
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === filtered.length && filtered.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filtered.map(s => s.id)));
    }
  };

  // Filter students strictly by selected semester
  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSemester = semesterFilter === 'ALL' || s.semester === semesterFilter;
      const matchesDiv = divisionFilter === 'ALL' || s.division.toUpperCase() === divisionFilter.toUpperCase();
      const matchesSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollmentNumber.toLowerCase().includes(search.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
        s.rollNumber.includes(search);
      return matchesSemester && matchesDiv && matchesSearch;
    });
  }, [students, semesterFilter, divisionFilter, search]);

  const selectedStudentsInView = useMemo(() => {
    return students.filter(s => selectedStudentIds.has(s.id));
  }, [students, selectedStudentIds]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {feedback && (
        <div className={`p-4 border rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">×</button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900">Semester-Wise Student Enrollment Management</h2>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {students.length} Total Enrolled
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Separate rosters for Semesters 1 through 8. Manage enrollments, promotions, and student deletions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Selection Action Buttons */}
          {selectedStudentIds.size > 0 && (
            <>
              <button
                onClick={handleOpenPromoteBatch}
                className="px-3.5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                Promote Selected ({selectedStudentIds.size})
              </button>

              <button
                onClick={() => setShowBatchDeleteModal(true)}
                className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 animate-pulse"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedStudentIds.size})
              </button>
            </>
          )}

          {semesterFilter !== 'ALL' && semesterFilter < 8 && selectedStudentIds.size === 0 && (
            <button
              onClick={() => handleOpenPromoteAllInSemester(semesterFilter)}
              className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-purple-700" />
              Promote Sem {semesterFilter} → Sem {semesterFilter + 1}
            </button>
          )}

          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Bulk CSV
          </button>

          {/* Clear / Delete Semester Roster button */}
          {filtered.length > 0 && selectedStudentIds.size === 0 && (
            <button
              onClick={() => setShowClearSemesterModal(true)}
              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              title={semesterFilter === 'ALL' ? 'Delete all students' : `Delete all students in Semester ${semesterFilter}`}
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              {semesterFilter === 'ALL' ? 'Clear All Students' : `Clear Sem ${semesterFilter} Roster`}
            </button>
          )}
        </div>
      </div>

      {/* 8-Semester Tabs Bar (Requirement 1 & 4) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Select Semester (Semesters 1 through 8 have separate student lists):</span>
          </div>
          {semesterFilter !== 'ALL' && (
            <button
              onClick={() => setSemesterFilter('ALL')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              View All Semesters ({students.length}) →
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {/* All Semesters Button */}
          <button
            onClick={() => setSemesterFilter('ALL')}
            className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
              semesterFilter === 'ALL'
                ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider opacity-80">Overview</span>
            <span className="font-extrabold text-xs">All Semesters</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              semesterFilter === 'ALL' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {students.length}
            </span>
          </button>

          {/* Semesters 1 to 8 Buttons */}
          {availableSemesters.map((sem) => {
            const semStudents = students.filter(s => s.semester === sem);
            const count = semStudents.length;
            const isSelected = semesterFilter === sem;

            return (
              <button
                key={sem}
                onClick={() => setSemesterFilter(sem)}
                className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border ${
                  isSelected
                    ? 'bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-80">Roster</span>
                <span className="font-black text-sm">Semester {sem}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected 
                    ? 'bg-blue-800 text-white' 
                    : count > 0 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {count} {count === 1 ? 'student' : 'students'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter, Search, and Batch Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, enrollment, roll no, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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

      {/* Semester Roster Heading Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="font-extrabold text-blue-950">
            {semesterFilter === 'ALL' 
              ? `All Students Roster (${filtered.length} students)` 
              : `Semester ${semesterFilter} Students List (${filtered.length} enrolled)`}
          </span>
          {selectedStudentIds.size > 0 && (
            <span className="font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              {selectedStudentIds.size} student(s) selected
            </span>
          )}
        </div>
        
        {semesterFilter !== 'ALL' && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-blue-800">
            <span>Enrolled Batch: <strong>Sem {semesterFilter}</strong></span>
            <span>•</span>
            <span>Divisions: <strong>{Array.from(new Set(filtered.map(s => s.division))).join(', ') || 'A'}</strong></span>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">
              {semesterFilter !== 'ALL' 
                ? `No students found in Semester ${semesterFilter}.` 
                : 'No students found matching your search.'}
            </p>
            <p className="text-[11px]">
              Click "Add Student" to register a student for Semester {semesterFilter !== 'ALL' ? semesterFilter : '1'}.
            </p>
            <button
              onClick={() => handleOpenAddModal(semesterFilter !== 'ALL' ? semesterFilter : 1)}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-blue-800 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Student to Semester {semesterFilter !== 'ALL' ? semesterFilter : '1'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-8">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-500 hover:text-blue-700 flex items-center"
                      title="Select all students in this view"
                    >
                      {selectedStudentIds.size > 0 && selectedStudentIds.size === filtered.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Roll No</th>
                  <th className="py-3 px-4">Enrollment Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-3">Current Semester</th>
                  <th className="py-3 px-3">Division</th>
                  <th className="py-3 px-4">Registered Email (Gmail)</th>
                  <th className="py-3 px-4">Registered Device</th>
                  <th className="py-3 px-4 text-right">Student Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const isSelected = selectedStudentIds.has(s.id);

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-slate-50/60 transition ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleSelectStudent(s.id)}
                          className="text-slate-500 hover:text-blue-700 flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">{s.rollNumber}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-blue-700 font-bold">
                        {s.enrollmentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={s.avatarUrl || generateStudentAvatarSvg(s.name, s.enrollmentNumber)}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-100 text-blue-800 border border-blue-200">
                          Semester {s.semester}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700">Div {s.division}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                          <Mail className="w-3 h-3 text-red-600" />
                          {s.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => setSelectedStudentForBio(s)}
                          className="cursor-pointer group flex items-center gap-1 text-[11px] text-slate-700 hover:text-blue-700"
                          title="Click to view hardware details"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[130px]">{s.deviceName || 'Registered Phone'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Promote Button */}
                        {s.semester < 8 ? (
                          <button
                            onClick={() => handleOpenPromoteSingle(s)}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition inline-flex items-center gap-1"
                            title={`Promote to Semester ${s.semester + 1}`}
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                            Promote
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Final Sem 8
                          </span>
                        )}

                        {/* Reset Device Binding */}
                        <button
                          onClick={() => handleResetDevice(s)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition"
                          title="Authorize Device Reset"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* PROMINENT STUDENT DELETE BUTTON */}
                        <button
                          onClick={() => setStudentToDelete(s)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center gap-1 shadow-xs"
                          title={`Delete student ${s.name} (${s.enrollmentNumber})`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SINGLE STUDENT DELETE CONFIRMATION MODAL */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Delete Student Confirmation</h3>
                  <p className="text-[11px] text-slate-500">Permanent removal from college database</p>
                </div>
              </div>
              <button 
                onClick={() => setStudentToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Preview Card */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-rose-200 shrink-0">
                <img
                  src={studentToDelete.avatarUrl || generateStudentAvatarSvg(studentToDelete.name, studentToDelete.enrollmentNumber)}
                  alt={studentToDelete.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-slate-900 truncate">{studentToDelete.name}</h4>
                <p className="font-mono text-xs font-bold text-blue-700">{studentToDelete.enrollmentNumber}</p>
                <span className="text-[11px] text-slate-600">
                  Semester {studentToDelete.semester} • Div {studentToDelete.division} • Roll {studentToDelete.rollNumber}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Are you sure you want to delete this student?
                </div>
                <p>
                  • Deletes student account, login access, and device binding.
                </p>
                <p>
                  • Enrollment number <strong>{studentToDelete.enrollmentNumber}</strong> will be freed and removed from Semester {studentToDelete.semester}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Delete Multiple Students ({selectedStudentIds.size})
                  </h3>
                  <p className="text-[11px] text-slate-500">Batch removal of selected student accounts</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBatchDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-[11px] space-y-1">
                <div className="font-extrabold flex items-center gap-1 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  Warning: Irreversible Batch Deletion
                </div>
                <p>
                  You are about to delete <strong>{selectedStudentIds.size} student record(s)</strong> from the database. Their accounts and device bindings will be permanently removed.
                </p>
              </div>

              {/* Roster of Selected Students */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Students to Delete:</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedStudentsInView.map(st => (
                    <div key={st.id} className="p-2 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{st.name}</span>
                        <span className="font-mono text-[10px] text-blue-700 font-semibold ml-2">
                          ({st.enrollmentNumber})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">Sem {st.semester} - Div {st.division}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirm Delete ({selectedStudentIds.size}) Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR SEMESTER ROSTER CONFIRMATION MODAL */}
      {showClearSemesterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {semesterFilter === 'ALL' ? 'Clear All Students Roster' : `Clear Semester ${semesterFilter} Roster`}
                  </h3>
                  <p className="text-[11px] text-slate-500">Remove all students in this semester scope</p>
                </div>
              </div>
              <button 
                onClick={() => setShowClearSemesterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs space-y-1">
              <div className="font-extrabold flex items-center gap-1 text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Confirm Roster Removal
              </div>
              <p>
                {semesterFilter === 'ALL' 
                  ? `Are you sure you want to delete all ${students.length} students across all semesters?` 
                  : `Are you sure you want to delete all ${filtered.length} student(s) currently enrolled in Semester ${semesterFilter}?`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearSemesterModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearSemester}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Clear Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Student Modal with Semester-First Validation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-700" />
                  Add Student to Semester Roster
                </h3>
                <p className="text-[11px] text-slate-500">
                  Step 1: Select semester • Step 2: Validate unique enrollment number
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addFormError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-semibold flex items-start gap-2 shadow-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-snug">{addFormError}</div>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              {/* STEP 1: FIRST SELECT THE SEMESTER */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                <label className="block font-black text-blue-950 uppercase tracking-wider text-[10px]">
                  Step 1: Select Semester *
                </label>
                <select
                  value={addSemester}
                  onChange={(e) => {
                    setAddSemester(Number(e.target.value));
                    setAddFormError(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-bold text-blue-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {availableSemesters.map(s => (
                    <option key={s} value={s}>
                      Semester {s} ({students.filter(st => st.semester === s).length} students enrolled)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-blue-800">
                  Student will be registered strictly under Semester {addSemester}.
                </span>
              </div>

              {/* STEP 2: ENTER ENROLLMENT NUMBER WITH REAL-TIME VALIDATION */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Step 2: Enrollment Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25IT011"
                  value={enrollmentNumber}
                  onChange={(e) => {
                    setEnrollmentNumber(e.target.value.toUpperCase());
                    setAddFormError(null);
                  }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl uppercase font-mono text-xs font-bold ${
                    enrollmentValidation?.code === 'DIFFERENT_SEMESTER'
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                      : enrollmentValidation?.code === 'DUPLICATE_SAME_SEMESTER'
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                      : enrollmentValidation?.valid
                      ? 'border-emerald-400 bg-emerald-50/30 text-emerald-900'
                      : 'border-slate-200 text-slate-800'
                  }`}
                />

                {/* Live validation feedback */}
                {enrollmentValidation && enrollmentValidation.code === 'DIFFERENT_SEMESTER' && (
                  <div className="mt-1.5 p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-[11px] space-y-1">
                    <div className="font-extrabold flex items-center gap-1 text-rose-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Enrollment number does not belong to the selected semester.
                    </div>
                    <p className="text-[10px] leading-tight text-rose-800">
                      Enrollment number '<strong>{enrollmentNumber}</strong>' is already registered in <strong>Semester {enrollmentValidation.existingSemester}</strong> in the database. Use authorized student promotion to advance this student to Semester {addSemester}.
                    </p>
                  </div>
                )}

                {enrollmentValidation && enrollmentValidation.code === 'DUPLICATE_SAME_SEMESTER' && (
                  <div className="mt-1.5 p-2 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-[11px] font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{enrollmentValidation.error}</span>
                  </div>
                )}

                {enrollmentValidation && enrollmentValidation.valid && (
                  <div className="mt-1 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Enrollment number available for Semester {addSemester}.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhyan Shah"
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
                  placeholder="e.g. dhyan.shah@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    value={division}
                    onChange={(e) => setDivision(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 01"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  placeholder="+91 98222 22001"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                  disabled={enrollmentValidation?.valid === false}
                  className={`px-4 py-2 font-bold rounded-xl shadow transition ${
                    enrollmentValidation?.valid === false
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-800 text-white'
                  }`}
                >
                  Enroll Student to Semester {addSemester}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Promotion Confirmation Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Authorized Student Promotion
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Academic advancement between semesters with full historical preservation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPromoteModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-900 block">
                    Target Next Semester
                  </span>
                  <span className="text-lg font-black text-indigo-950">
                    Promote to Semester {promotionTargetSemester}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-700 block font-semibold">Total Students</span>
                  <span className="text-base font-extrabold text-indigo-900">{studentsToPromoteList.length}</span>
                </div>
              </div>

              {/* Roster of Students Being Promoted */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Selected Students for Advancement ({studentsToPromoteList.length}):
                </label>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {studentsToPromoteList.map(st => (
                    <div key={st.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900">{st.name}</span>
                        <span className="font-mono text-[10px] text-blue-700 font-semibold ml-2">
                          ({st.enrollmentNumber})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Sem {st.semester}</span>
                        <ArrowRight className="w-3 h-3 text-indigo-600" />
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          Sem {promotionTargetSemester}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Promotion Guarantees */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-[11px] text-slate-700">
                <p className="font-bold text-slate-900">🔒 System Promotion Policy & Data Preservation:</p>
                <p className="flex items-center gap-1.5 text-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Preserves original enrollment number & device binding
                </p>
                <p className="flex items-center gap-1.5 text-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Preserves 100% of past attendance records (tied to original lecture sessions)
                </p>
                <p className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Only authorized faculty can execute student promotion
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPromotion}
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow transition"
                >
                  Confirm & Promote ({studentsToPromoteList.length}) Students →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Bulk Import Students via CSV</h3>
                <p className="text-xs text-slate-500">First select target semester, then paste enrollment records</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-700">
                  <AlertCircle className="w-4 h-4" />
                  Enrollment Validation Errors (Import blocked):
                </div>
                {bulkErrors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleBulkImport} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Semester for Batch *</label>
                <select
                  value={bulkSemester}
                  onChange={(e) => {
                    setBulkSemester(Number(e.target.value));
                    setBulkErrors([]);
                  }}
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
                  rows={6}
                  required
                  placeholder={`25IT001, Aadi Joshi, aadi.joshi@college.edu, 01, A, +91 98000 00001\n25IT002, Bhavya Patel, bhavya.patel@college.edu, 02, A, +91 98000 00002`}
                  value={bulkInput}
                  onChange={(e) => {
                    setBulkInput(e.target.value);
                    setBulkErrors([]);
                  }}
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-700 text-[11px] space-y-1">
                <p className="font-bold text-blue-900">Enrollment Validation Rule:</p>
                <p>• If an enrollment number belongs to another semester in the database, the import will be blocked with: <code>Enrollment number does not belong to the selected semester.</code></p>
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

      {/* Student Registered Device Details Modal */}
      {selectedStudentForBio && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Student Device & Hardware Profile</h3>
                  <p className="text-[11px] text-slate-500">1 Student : 1 Registered Device Anti-Proxy Security</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForBio(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-4 flex items-center gap-3.5 border border-slate-800 text-white">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-sky-400 shadow-md bg-slate-900 shrink-0">
                <img
                  src={selectedStudentForBio.avatarUrl || generateStudentAvatarSvg(selectedStudentForBio.name, selectedStudentForBio.enrollmentNumber)}
                  alt={selectedStudentForBio.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{selectedStudentForBio.name}</h4>
                <p className="font-mono text-xs font-bold text-sky-300">{selectedStudentForBio.enrollmentNumber}</p>
                <span className="text-[10px] text-slate-300">
                  Semester {selectedStudentForBio.semester} • Div {selectedStudentForBio.division} • Roll {selectedStudentForBio.rollNumber}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Semester</span>
                <span className="font-bold text-blue-800">Semester {selectedStudentForBio.semester}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Registered Email</span>
                <span className="font-mono text-slate-700 text-[11px]">{selectedStudentForBio.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Approved Device</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  {selectedStudentForBio.deviceName || 'Student Hardware'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Device Hardware ID</span>
                <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold">
                  {selectedStudentForBio.deviceId || 'DEV-BOUND'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Traced Network IP Address</span>
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-bold">
                  {selectedStudentForBio.ipAddress || '192.168.101.45'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleResetDevice(selectedStudentForBio)}
                className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Authorize Device Reset
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentForBio(null)}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
