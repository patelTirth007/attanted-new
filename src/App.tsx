import React, { useState, useEffect } from 'react';
import { User, Student, Faculty, Lecture, GmailNotification } from './types';
import { db } from './services/db';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Login } from './pages/Login';
import { StudentRegister } from './pages/StudentRegister';
import { FacultyRegister } from './pages/FacultyRegister';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentHistory } from './pages/StudentHistory';
import { StudentProfile } from './pages/StudentProfile';
import { GmailNotificationsView } from './pages/GmailNotificationsView';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { FacultyLiveAttendance } from './pages/FacultyLiveAttendance';
import { FacultyLectures } from './pages/FacultyLectures';
import { FacultyStudents } from './pages/FacultyStudents';
import { FacultySubjects } from './pages/FacultySubjects';
import { FacultyReports } from './pages/FacultyReports';
import { FacultySettings } from './pages/FacultySettings';
import { Mail, ExternalLink, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return hash || '/login';
  });
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // Global toast for real-time Gmail dispatch notifications
  const [gmailToast, setGmailToast] = useState<GmailNotification | null>(null);

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

  // Listen for Gmail notification dispatch events
  useEffect(() => {
    const handleNotifEvent = (e: any) => {
      if (e.detail) {
        setGmailToast(e.detail);
        setTimeout(() => setGmailToast(null), 7000);
      }
    };
    window.addEventListener('sca_gmail_notification_dispatched', handleNotifEvent);
    return () => window.removeEventListener('sca_gmail_notification_dispatched', handleNotifEvent);
  }, []);

  // Restore session or default to Login
  useEffect(() => {
    const raw = localStorage.getItem('sca_active_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed.user);
        if (parsed.user.role === 'STUDENT') {
          let s = db.getStudentByUserId(parsed.user.id);
          if (!s && parsed.user.email) {
            s = db.getStudentByEmail(parsed.user.email);
          }
          if (s) {
            setCurrentStudent(s);
            if (currentRoute === '/login' || currentRoute === '/') {
              navigateTo('/student/dashboard');
            }
          }
        } else if (parsed.user.role === 'FACULTY' || parsed.user.role === 'ADMIN') {
          let f = db.getFacultyByUserId(parsed.user.id);
          if (!f && parsed.user.email) {
            f = db.getAllFaculty().find(item => item.email.toLowerCase() === parsed.user.email.toLowerCase());
          }
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
      let student = db.getStudentByUserId(user.id);
      if (!student && user.email) {
        student = db.getStudentByEmail(user.email);
      }
      if (!student) {
        // Fallback resilient profile
        student = {
          id: `stu_${Date.now()}`,
          userId: user.id,
          email: user.email,
          enrollmentNumber: '23IT001',
          name: 'Student User',
          department: 'Information Technology',
          semester: 5,
          division: 'A',
          rollNumber: '01',
          phone: '',
          faceEnrollmentStatus: true,
          createdAt: Date.now()
        };
        db.addStudent(student);
      }
      setCurrentStudent(student);
      localStorage.setItem('sca_active_session', JSON.stringify({ user, studentId: student.id }));
      navigateTo('/student/dashboard');
    } else {
      let faculty = db.getFacultyByUserId(user.id);
      if (!faculty && user.email) {
        faculty = db.getAllFaculty().find(item => item.email.toLowerCase() === user.email.toLowerCase());
      }
      if (!faculty) {
        faculty = {
          id: `fac_${Date.now()}`,
          userId: user.id,
          name: 'Faculty Administrator',
          department: 'Information Technology',
          email: user.email,
          phone: ''
        };
        const allFac = db.getAllFaculty();
        allFac.push(faculty);
        localStorage.setItem('sca_faculty', JSON.stringify(allFac));
      }
      setCurrentFaculty(faculty);
      localStorage.setItem('sca_active_session', JSON.stringify({ user, facultyId: faculty.id }));
      navigateTo('/faculty/dashboard');
    }
  };

  const handleRegisterSuccess = (user: User, student: Student) => {
    setCurrentUser(user);
    setCurrentStudent(student);
    localStorage.setItem('sca_active_session', JSON.stringify({ user, studentId: student.id }));
    navigateTo('/student/dashboard');
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
      {/* Real-time Gmail Dispatch Banner Toast */}
      {gmailToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-red-500/30 flex items-start justify-between gap-3 animate-bounce">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Gmail Alert Dispatched</span>
                <span className="text-[10px] text-slate-400 font-mono">{gmailToast.sentTimeStr}</span>
              </div>
              <h5 className="text-xs font-bold text-white mt-0.5">{gmailToast.subject}</h5>
              <p className="text-[11px] text-slate-300">Sent to: <span className="font-mono text-emerald-300">{gmailToast.recipientEmail}</span></p>
              
              <a
                href={gmailToast.gmailUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 underline"
              >
                Open in Gmail <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={() => setGmailToast(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          {!currentUser && currentRoute === '/student/register' && (
            <StudentRegister
              onSuccess={handleRegisterSuccess}
              onBackToLogin={() => navigateTo('/login')}
            />
          )}

          {!currentUser && currentRoute === '/faculty/register' && (
            <FacultyRegister
              onSuccess={(user, faculty) => {
                setCurrentUser(user);
                setCurrentFaculty(faculty);
                localStorage.setItem('sca_active_session', JSON.stringify({ user, facultyId: faculty.id }));
                navigateTo('/faculty/dashboard');
              }}
              onBackToLogin={() => navigateTo('/login')}
            />
          )}

          {!currentUser && currentRoute !== '/student/register' && currentRoute !== '/faculty/register' && (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => navigateTo('/student/register')}
              onNavigateToFacultyRegister={() => navigateTo('/faculty/register')}
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
                  onNavigateToHistory={() => navigateTo('/student/history')}
                  onNavigateToNotifications={() => navigateTo('/student/notifications')}
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

              {currentRoute === '/student/notifications' && (
                <GmailNotificationsView
                  userEmail={currentStudent.email || currentUser.email}
                  role="STUDENT"
                  onBack={() => navigateTo('/student/dashboard')}
                />
              )}

              {currentRoute === '/student/history' && (
                <StudentHistory student={currentStudent} />
              )}

              {currentRoute === '/student/profile' && (
                <StudentProfile student={currentStudent} />
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

              {currentRoute === '/faculty/notifications' && (
                <GmailNotificationsView
                  role="FACULTY"
                  onBack={() => navigateTo('/faculty/dashboard')}
                />
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
