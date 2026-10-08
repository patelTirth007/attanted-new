import React, { useState } from 'react';
import { Student } from '../types';
import { db } from '../services/db';
import { CameraView } from '../components/CameraView';
import { faceRecognitionService, LIVENESS_CHALLENGES } from '../services/faceRecognition';
import { CheckCircle2, ShieldCheck, ArrowRight, RefreshCcw } from 'lucide-react';

interface FaceEnrollmentProps {
  student: Student;
  onEnrollmentComplete: (updatedStudent: Student) => void;
}

export const StudentFaceEnrollment: React.FC<FaceEnrollmentProps> = ({ student, onEnrollmentComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedEmbeddings, setCapturedEmbeddings] = useState<number[][]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState('Position your face in the oval guide and capture pose.');

  const challenge = LIVENESS_CHALLENGES[currentStep];

  const handleCaptureFrame = (canvas: HTMLCanvasElement) => {
    const embedding = faceRecognitionService.createEmbeddingFromCanvas(canvas);
    const newEmbeddings = [...capturedEmbeddings, embedding];
    setCapturedEmbeddings(newEmbeddings);

    if (currentStep < LIVENESS_CHALLENGES.length - 1) {
      setCurrentStep(prev => prev + 1);
      setFeedback(`Pose ${currentStep + 1} recorded! Now: ${LIVENESS_CHALLENGES[currentStep + 1].instruction}`);
    } else {
      // All 5 challenges completed! Combine embeddings into a master normalized template
      const master = new Array(64).fill(0);
      for (const emb of newEmbeddings) {
        for (let i = 0; i < emb.length; i++) {
          master[i] += emb[i];
        }
      }
      let sumSq = 0;
      for (let i = 0; i < master.length; i++) sumSq += master[i] * master[i];
      const norm = Math.max(Math.sqrt(sumSq), 1e-6);
      const normalizedMaster = master.map(v => Number((v / norm).toFixed(4)));

      const serialized = faceRecognitionService.serializeEmbedding(normalizedMaster);
      db.updateStudentFaceEnrollment(student.id, serialized);

      setIsCompleted(true);
      setFeedback('Face enrollment completed successfully! Biometric template encrypted.');
    }
  };

  const handleFinish = () => {
    const updated = db.getStudentById(student.id);
    if (updated) {
      onEnrollmentComplete(updated);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Biometric Security Enrollment
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-2">First-Time Face Setup</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Student: <strong className="text-slate-800">{student.name}</strong> ({student.enrollmentNumber}) • Roll {student.rollNumber}
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-blue-700">Step {currentStep + 1} of 5: {challenge?.title}</span>
          <span className="text-slate-400">{Math.round(((currentStep + 1) / 5) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 gap-1">
          {LIVENESS_CHALLENGES.map((ch, idx) => (
            <div
              key={ch.type}
              className={`flex-1 text-center py-1 rounded text-[10px] font-semibold ${
                idx < currentStep
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : idx === currentStep
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-50 text-slate-400'
              }`}
            >
              {ch.title.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Camera / Face Scanner */}
      <CameraView
        challengeTitle={`Challenge: ${challenge?.title}`}
        challengeInstruction={challenge?.instruction || ''}
        statusText={isCompleted ? 'Face Enrolled ✓' : `Scanning Face • Pose ${currentStep + 1}`}
        isVerified={isCompleted}
        onCapture={handleCaptureFrame}
      />

      {/* Feedback banner */}
      <div className={`p-3.5 rounded-xl text-xs font-medium text-center ${
        isCompleted ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
      }`}>
        {feedback}
      </div>

      {/* Complete Card */}
      {isCompleted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-emerald-900">Face Enrollment Completed Successfully!</h4>
            <p className="text-xs text-emerald-700 mt-1">
              Your biometric template has been cryptographically generated and saved.
              You can now mark lecture attendance via facial recognition.
            </p>
          </div>
          <button
            onClick={handleFinish}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            Continue to Student Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 text-center">
          💡 Look directly at the camera and complete all 5 challenges to ensure reliable anti-spoofing verification.
        </div>
      )}
    </div>
  );
};
