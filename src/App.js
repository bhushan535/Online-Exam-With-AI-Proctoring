import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

/* FRONT PAGE */
import FrontPage from "./components/Authentication/FrontPage";

/* STUDENT AUTH */
import StudentLogin from "./components/Student-ui/StudentLogin";
import Registration from "./components/Student-ui/Registration";

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

/* MODE SELECTION */
import ModeSelection from "./pages/ModeSelection";


function App() {
  return (
  <AuthProvider>
  <BrowserRouter> <Routes>

    {/* FRONT PAGE */}
    <Route path="/" element={<FrontPage />} />

    {/* NEW AUTH ROUTES */}
    <Route path="/login" element={<TeacherLogin />} />
    <Route path="/signup" element={<ModeSelection />} />
    <Route path="/signup/teacher-solo" element={<Registration />} />
    <Route path="/signup/principal" element={<Registration />} /> 


    {/* STUDENT AUTH */}
    <Route path="/StudentLogin" element={<StudentLogin />} />
    <Route path="/Registration" element={<Registration />} />

    {/* TEACHER AUTH */}
    <Route path="/TeacherLogin" element={<TeacherLogin />} />

    {/* DASHBOARDS */}
    <Route path="/TeacherHome" element={
      <ProtectedRoute allowedRoles={['teacher']}>
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
      <ProtectedRoute allowedRoles={['teacher']}>
        <CreateClass />
      </ProtectedRoute>
    } />
    <Route path="/Classes" element={
      <ProtectedRoute allowedRoles={['teacher']}>
        <Classes />
      </ProtectedRoute>
    } />
    <Route path="/class/:id" element={
      <ProtectedRoute allowedRoles={['teacher']}>
        <ViewClass />
      </ProtectedRoute>
    } />
    <Route path="/edit-class/:id" element={
      <ProtectedRoute allowedRoles={['teacher']}>
        <EditClass />
      </ProtectedRoute>
    } />

    {/* EXAMS */}
    <Route path="/CreateExam" element={
      <ProtectedRoute allowedRoles={['teacher']}>
        <CreateExam />
      </ProtectedRoute>
    } />
    <Route path="/Exams" element={
      <ProtectedRoute allowedRoles={['teacher']}>
        <Exams />
      </ProtectedRoute>
    } />
    <Route path="/add-question/:examId" element={
      <ProtectedRoute allowedRoles={['teacher']}>
        <AddQuestion />
      </ProtectedRoute>
    } />
    <Route path="/edit-exam/:id" element={
      <ProtectedRoute allowedRoles={['teacher']}>
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
      <ProtectedRoute allowedRoles={['teacher']}>
        <StudentResults />
      </ProtectedRoute>
    } />
    <Route path="/StudentResults" element={
      <ProtectedRoute allowedRoles={['student']}>
        <StudentResult />
      </ProtectedRoute>
    } />
    <Route path="/exam-results/:examId" element={
      <ProtectedRoute allowedRoles={['teacher']}>
        <ExamResults />
      </ProtectedRoute>
    } />

    {/* CLASS JOIN */}
    <Route path="/class-login/:classCode" element={<StudentClassLogin />} />
    <Route path="/join-class/:classId" element={<JoinClass />} />

  </Routes>
  </BrowserRouter>
  </AuthProvider>

  );
}

export default App;
