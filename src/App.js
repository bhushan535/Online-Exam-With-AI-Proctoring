import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

/* FRONT PAGE */
import FrontPage from "./components/Authentication/FrontPage";

/* STUDENT AUTH */
import StudentLogin from "./components/Student-ui/StudentLogin";

/* TEACHER AUTH */
import TeacherLogin from "./components/Teacher-ui/TeacherLogin";

/* DASHBOARDS */
import TeacherHome from "./components/Teacher-ui/TeacherHome";
import StudentHome from "./components/Student-ui/StudentHome";

/* TEACHER CLASS MANAGEMENT */
import CreateClass from "./components/Teacher-ui/CreateClass";
import Classes from "./components/Teacher-ui/Classes";
import ViewClass from "./components/Teacher-ui/ViewClass";
import EditClass from "./components/Teacher-ui/EditClass";

/* EXAM MANAGEMENT */
import CreateExam from "./components/Teacher-ui/CreateExam";
import Exams from "./components/Teacher-ui/Exams";
import AddQuestion from "./components/Teacher-ui/AddQuestion";
import EditExam from "./components/Teacher-ui/EditExam";

/* STUDENT EXAM */
import AttemptExam from "./components/Student-ui/AttemptExam";
import AttemptExamPage from "./components/Student-ui/AttemptExamPage";
import ExamInstructions from "./components/Student-ui/ExamInstructions";
import Cameracheckscreen from "./components/Student-ui/Cameracheckscreen";

/* RESULTS */
import StudentResults from "./components/Teacher-ui/StudentResults";
import ExamResults from "./components/Teacher-ui/ExamResults";
import StudentResult from "./components/Student-ui/StudentResult";
import ExamStartCountdown from "./components/Student-ui/ExamStartCountdown";

/* CLASS JOIN */
import StudentClassLogin from "./components/Student-ui/StudentClassLogin";
import JoinClass from "./components/Student-ui/JoinClass";

/* PRINCIPAL MANAGEMENT */
import TeacherManagement from "./components/Teacher-ui/TeacherManagement";
import OrgSettings from "./components/Teacher-ui/OrgSettings";
import Promotion from "./components/Teacher-ui/Promotion";
import StudentManagement from "./components/Teacher-ui/StudentManagement";
import Analytics from "./components/Teacher-ui/Analytics";
import NoticeManagement from "./components/Teacher-ui/NoticeManagement";

/* PAGES */
import ModeSelection from "./pages/ModeSelection";
import Registration from "./components/Authentication/Registration";


function App() {
  return (
  <AuthProvider>
  <BrowserRouter> <Routes>

    {/* FRONT PAGE */}
    <Route path="/" element={<FrontPage />} />

    {/* AUTH ROUTES */}
    <Route path="/login" element={<TeacherLogin />} />
    <Route path="/signup" element={<ModeSelection />} />
    <Route path="/signup/teacher-solo" element={<Registration role="teacher" mode="solo" />} />
    <Route path="/signup/principal" element={<Registration role="principal" mode="organization" />} /> 

    {/* STUDENT AUTH (Legacy/Special) */}
    <Route path="/StudentLogin" element={<StudentLogin />} />

    {/* DASHBOARDS */}
    <Route path="/TeacherHome" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <TeacherHome />
      </ProtectedRoute>
    } />
    <Route path="/StudentHome" element={
      <ProtectedRoute allowedRoles={['student']}>
        <StudentHome />
      </ProtectedRoute>
    } />

    {/* CLASS MANAGEMENT */}
    <Route path="/CreateClass" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <CreateClass />
      </ProtectedRoute>
    } />
    <Route path="/Classes" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <Classes />
      </ProtectedRoute>
    } />
    <Route path="/class/:id" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <ViewClass />
      </ProtectedRoute>
    } />
    <Route path="/edit-class/:id" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <EditClass />
      </ProtectedRoute>
    } />

    {/* EXAMS */}
    <Route path="/CreateExam" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <CreateExam />
      </ProtectedRoute>
    } />
    <Route path="/Exams" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <Exams />
      </ProtectedRoute>
    } />
    <Route path="/add-question/:examId" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <AddQuestion />
      </ProtectedRoute>
    } />
    <Route path="/edit-exam/:id" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <EditExam />
      </ProtectedRoute>
    } />

    {/* STUDENT EXAM */}
    <Route path="/attempt-exams" element={
      <ProtectedRoute allowedRoles={['student']}>
        <AttemptExam />
      </ProtectedRoute>
    } />
    <Route path="/exam-instructions/:examId" element={
      <ProtectedRoute allowedRoles={['student']}>
        <ExamInstructions />
      </ProtectedRoute>
    } />
    <Route path="/camera-check/:examId" element={
      <ProtectedRoute allowedRoles={['student']}>
        <Cameracheckscreen />
      </ProtectedRoute>
    } />
    <Route path="/exam-countdown/:examId" element={
      <ProtectedRoute allowedRoles={['student']}>
        <ExamStartCountdown />
      </ProtectedRoute>
    } />
    <Route path="/attempt-exam/:examId" element={
      <ProtectedRoute allowedRoles={['student']}>
        <AttemptExamPage />
      </ProtectedRoute>
    } />

    {/* RESULTS */}
    <Route path="/student-results/:examId" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <StudentResults />
      </ProtectedRoute>
    } />
    <Route path="/StudentResults" element={
      <ProtectedRoute allowedRoles={['student']}>
        <StudentResult />
      </ProtectedRoute>
    } />
    <Route path="/exam-results/:examId" element={
      <ProtectedRoute allowedRoles={['teacher', 'principal']}>
        <ExamResults />
      </ProtectedRoute>
    } />

    {/* CLASS JOIN */}
    <Route path="/class-login/:classCode" element={<StudentClassLogin />} />
    <Route path="/join-class/:classId" element={<JoinClass />} />

    {/* PRINCIPAL ONLY */}
    <Route path="/TeacherManagement" element={
      <ProtectedRoute allowedRoles={['principal']}>
        <TeacherManagement />
      </ProtectedRoute>
    } />
    <Route path="/OrgSettings" element={
      <ProtectedRoute allowedRoles={['principal']}>
        <OrgSettings />
      </ProtectedRoute>
    } />
    <Route path="/Promotion" element={
      <ProtectedRoute allowedRoles={['principal']}>
        <Promotion />
      </ProtectedRoute>
    } />
    <Route path="/StudentManagement" element={
      <ProtectedRoute allowedRoles={['principal']}>
        <StudentManagement />
      </ProtectedRoute>
    } />
    <Route path="/Analytics" element={
      <ProtectedRoute allowedRoles={['principal']}>
        <Analytics />
      </ProtectedRoute>
    } />
    <Route path="/Notices" element={
      <ProtectedRoute allowedRoles={['principal']}>
        <NoticeManagement />
      </ProtectedRoute>
    } />

  </Routes>
  </BrowserRouter>
  </AuthProvider>

  );
}

export default App;
