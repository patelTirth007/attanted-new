import React, { useState, useEffect } from 'react';
import { Subject } from '../types';
import { db } from '../services/db';
import { BookOpen } from 'lucide-react';

export const FacultySubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    setSubjects(db.getAllSubjects());
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Academic Subjects ({subjects.length})</h2>
        <p className="text-xs text-slate-500">
          Curriculum course catalog with subject codes and semester mapping.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 hover:border-blue-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Code: {sub.subjectCode}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Semester {sub.semester}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">{sub.subjectName}</h4>
            <p className="text-xs text-slate-500">{sub.department}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
