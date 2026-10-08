import React, { useState, useEffect } from 'react';
import { User, Student, Faculty, Lecture } from './types';
import { db } from './services/db';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Login } from './pages/Login';
import { StudentRegister } from './pages/StudentRegister';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentFaceEnrollment } from './pages/StudentFaceEnrollment';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentHistory } from './pages/StudentHistory';
import { StudentProfile } from './pages/StudentProfile';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { FacultyLiveAttendance } from './pages/FacultyLiveAttendance';
import { FacultyLectures } from './pages/FacultyLectures';
import { FacultyStudents } from './pages/FacultyStudents';
import { FacultySubjects } from './pages/FacultySubjects';
import { FacultyReports } from './pages/FacultyReports';
import { FacultySettings } from './pages/FacultySettings';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return hash || '/login';
  });
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // Sync route with window.location.hash
  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && hash !== currentRoute) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentRoute]);

  // Restore session or default to Login
  useEffect(() => {
    const raw = localStorage.getItem('sca_active_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed.user);
        if (parsed.user.role === 'STUDENT') {
          const s = db.getStudentByUserId(parsed.user.id);
          if (s) {
            setCurrentStudent(s);
            if (!s.faceEnrollmentStatus) {
              navigateTo('/student/face-enrollment');
            } else if (currentRoute === '/login' || currentRoute === '/') {
              navigateTo('/student/dashboard');
            }
          }
        } else if (parsed.user.role === 'FACULTY' || parsed.user.role === 'ADMIN') {
          const f = db.getFacultyByUserId(parsed.user.id);
          if (f) {
            setCurrentFaculty(f);
            if (currentRoute === '/login' || currentRoute === '/') {
              navigateTo('/faculty/dashboard');
            }
          }
        }
      } catch (e) {
        localStorage.removeItem('sca_active_session');
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'STUDENT') {
      const student = db.getStudentByUserId(user.id);
      if (student) {
        setCurrentStudent(student);
        localStorage.setItem('sca_active_session', JSON.stringify({ user, studentId: student.id }));
        if (!student.faceEnrollmentStatus) {
          navigateTo('/student/face-enrollment');
        } else {
          navigateTo('/student/dashboard');
        }
      }
    } else {
      const faculty = db.getFacultyByUserId(user.id);
      if (faculty) {
        setCurrentFaculty(faculty);
        localStorage.setItem('sca_active_session', JSON.stringify({ user, facultyId: faculty.id }));
        navigateTo('/faculty/dashboard');
      }
    }
  };

  const handleRegisterSuccess = (user: User, student: Student) => {
    setCurrentUser(user);
    setCurrentStudent(student);
    localStorage.setItem('sca_active_session', JSON.stringify({ user, studentId: student.id }));
    navigateTo('/student/face-enrollment');
  };

  const handleLogout = () => {
    localStorage.removeItem('sca_active_session');
    setCurrentUser(null);
    setCurrentStudent(null);
    setCurrentFaculty(null);
    setSelectedLecture(null);
    navigateTo('/login');
  };

  const collegeSettings = db.getCollegeSettings();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        user={currentUser}
        profileName={currentStudent?.name || currentFaculty?.name || 'Academic Portal'}
        onLogout={handleLogout}
        collegeName={collegeSettings.collegeName}
      />

      <div className="flex-1 flex">
        {currentUser && (
          <Sidebar
            role={currentUser.role}
            currentRoute={currentRoute}
            onNavigate={navigateTo}
          />
        )}

        <main className="flex-1 overflow-y-auto pb-16 md:pb-6">
          {/* Guest / Auth Routes */}
          {!currentUser && currentRoute === '/login' && (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => navigateTo('/student/register')}
            />
          )}

          {!currentUser && currentRoute === '/student/register' && (
            <StudentRegister
              onSuccess={handleRegisterSuccess}
              onBackToLogin={() => navigateTo('/login')}
            />
          )}

          {/* Student Routes */}
          {currentUser?.role === 'STUDENT' && currentStudent && (
            <>
              {currentRoute === '/student/dashboard' && (
                <StudentDashboard
                  student={currentStudent}
                  onNavigateToMarkAttendance={(lec) => {
                    setSelectedLecture(lec);
                    navigateTo('/student/attendance');
                  }}
                  onNavigateToEnrollment={() => navigateTo('/student/face-enrollment')}
                  onNavigateToHistory={() => navigateTo('/student/history')}
                />
              )}

              {currentRoute === '/student/face-enrollment' && (
                <StudentFaceEnrollment
                  student={currentStudent}
                  onEnrollmentComplete={(updated) => {
                    setCurrentStudent(updated);
                    navigateTo('/student/dashboard');
                  }}
                />
              )}

              {currentRoute === '/student/attendance' && (
                <StudentAttendance
                  student={currentStudent}
                  lecture={selectedLecture || db.getAllLectures()[0]}
                  onBack={() => navigateTo('/student/dashboard')}
                  onSuccess={() => navigateTo('/student/dashboard')}
                />
              )}

              {currentRoute === '/student/history' && (
                <StudentHistory student={currentStudent} />
              )}

              {currentRoute === '/student/profile' && (
                <StudentProfile
                  student={currentStudent}
                  onReEnrollFace={() => navigateTo('/student/face-enrollment')}
                />
              )}
            </>
          )}

          {/* Faculty Routes */}
          {currentUser && (currentUser.role === 'FACULTY' || currentUser.role === 'ADMIN') && currentFaculty && (
            <>
              {currentRoute === '/faculty/dashboard' && (
                <FacultyDashboard
                  faculty={currentFaculty}
                  onCreateLecture={() => navigateTo('/faculty/lectures')}
                  onOpenLiveAttendance={(lec) => {
                    setSelectedLecture(lec);
                    navigateTo('/faculty/attendance');
                  }}
                  onNavigateToStudents={() => navigateTo('/faculty/students')}
                  onNavigateToReports={() => navigateTo('/faculty/reports')}
                  onNavigateToSettings={() => navigateTo('/faculty/settings')}
                />
              )}

              {currentRoute === '/faculty/attendance' && (
                <FacultyLiveAttendance
                  lecture={selectedLecture || db.getAllLectures()[0]}
                  facultyId={currentFaculty.id}
                  onBack={() => navigateTo('/faculty/dashboard')}
                />
              )}

              {currentRoute === '/faculty/lectures' && (
                <FacultyLectures
                  facultyId={currentFaculty.id}
                  facultyName={currentFaculty.name}
                  onOpenLiveAttendance={(lec) => {
                    setSelectedLecture(lec);
                    navigateTo('/faculty/attendance');
                  }}
                />
              )}

              {currentRoute === '/faculty/students' && (
                <FacultyStudents />
              )}

              {currentRoute === '/faculty/subjects' && (
                <FacultySubjects />
              )}

              {currentRoute === '/faculty/reports' && (
                <FacultyReports />
              )}

              {currentRoute === '/faculty/settings' && (
                <FacultySettings />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {currentUser && (
        <MobileNav
          role={currentUser.role}
          currentRoute={currentRoute}
          onNavigate={navigateTo}
        />
      )}
    </div>
  );
};
export default App;
