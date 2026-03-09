import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

/* RESULTS */
import StudentResults from "./components/Teacher-ui/StudentResults";

/* CLASS JOIN */
import StudentClassLogin from "./components/Student-ui/StudentClassLogin";
import JoinClass from "./components/Student-ui/JoinClass";

function App() {
return ( <BrowserRouter> <Routes>

```
    {/* FRONT PAGE */}
    <Route path="/" element={<FrontPage />} />

    {/* STUDENT AUTH */}
    <Route path="/StudentLogin" element={<StudentLogin />} />
    <Route path="/Registration" element={<Registration />} />

    {/* TEACHER AUTH */}
    <Route path="/TeacherLogin" element={<TeacherLogin />} />

    {/* DASHBOARDS */}
    <Route path="/TeacherHome" element={<TeacherHome />} />
    <Route path="/StudentHome" element={<StudentHome />} />

    {/* CLASS MANAGEMENT */}
    <Route path="/CreateClass" element={<CreateClass />} />
    <Route path="/Classes" element={<Classes />} />
    <Route path="/class/:id" element={<ViewClass />} />
    <Route path="/edit-class/:id" element={<EditClass />} />

    {/* EXAMS */}
    <Route path="/CreateExam" element={<CreateExam />} />
    <Route path="/Exams" element={<Exams />} />
    <Route path="/add-question/:examId" element={<AddQuestion />} />
    <Route path="/edit-exam/:id" element={<EditExam />} />

    {/* STUDENT EXAM */}
    <Route path="/attempt-exams" element={<AttemptExam />} />
    <Route path="/exam-instructions/:examId" element={<ExamInstructions />} />
    <Route path="/attempt-exam/:examId" element={<AttemptExamPage />} />

    {/* RESULTS */}
    <Route path="/student-results/:examId" element={<StudentResults />} />

    {/* CLASS JOIN */}
    <Route path="/class-login/:classCode" element={<StudentClassLogin />} />
    <Route path="/join-class/:classId" element={<JoinClass />} />

  </Routes>
</BrowserRouter>

);
}

export default App;
