# Technical Documentation: Online Exam with AI Proctoring

## 1. Project Overview
**Purpose**: The "Online Exam with AI Proctoring" system is designed to provide a secure, scalable, and automated platform for conducting online assessments. It leverages advanced AI models to monitor students during exams, ensuring academic integrity without the need for constant human supervision.

**Target Users**:
- **Educational Institutions**: Schools and colleges looking for a robust exam system.
- **Teachers/Examiners**: To create, manage, and review exams and proctoring logs.
- **Students**: To attend exams in a controlled and monitored environment.

**Main Features**:
- **Role-based Dashboards**: Separate interfaces for teachers and students.
- **Dynamic Exam Creation**: Flexible MCQ/theory question management.
- **AI Proctoring Engine**: Real-time detection of multiple faces, head movements, gaze tracking, tab switching, and prohibited objects (mobile phones).
- **Automated Grading**: Instant results for MCQ-based exams.
- **Detailed Proctoring Logs**: Visual and data-driven violation logs for teachers to review post-exam.

**Real-World Use Case**:
During a university-wide final exam, 500 students login simultaneously. The system monitors each student's webcam feed locally (using TensorFlow.js) to detect if they look away, talk to someone, or use a phone. Violations are flagged and stored in the database with timestamps and snapshots, allowing the teacher to validate the integrity of the results afterward.

---

## 2. Tech Stack Analysis
The project follows the **MERN** (MongoDB, Express, React, Node) stack architecture.

- **Frontend**:
  - **Framework**: React.js (v19)
  - **Routing**: React Router DOM (v7)
  - **UI/Styling**: Vanilla CSS + Bootstrap (React-Bootstrap)
  - **Utilities**: Axios for API calls, `xlsx` for Excel data handling.
- **Backend**:
  - **Runtime**: Node.js
  - **Framework**: Express.js (v5)
  - **Database ODM**: Mongoose
- **Database**:
  - **Type**: NoSQL (MongoDB)
- **AI/Proctoring Technologies**:
  - **Engine**: TensorFlow.js (tfjs)
  - **Detection Models**: 
    - MediaPipe (Face Detection & Face Mesh)
    - COCO-SSD (Object Detection - phones, books, etc.)
- **Authentication**:
  - **Teacher**: Logic-based credential validation (Prototype mode).
  - **Student**: Enrollment-based validation against class-specific student records.

---

## 3. System Architecture
The system is built on a **Client-Server Architecture** with a clear separation of concerns.

- **Frontend Communication**: The React frontend communicates with the Node.js backend via **RESTful APIs** using Axios.
- **Backend Communication**: Express controllers interact with MongoDB using **Mongoose models**.
- **Request–Response Flow**:
    1. User performs an action (e.g., Log in, Submit Exam).
    2. Frontend sends an HTTP request (POST/GET) with JSON payload.
    3. Backend middleware (CORS, Express JSON) processes the request.
    4. Controller logic executes (DB queries, algorithm processing).
    5. Backend sends an HTTP response (JSON) back to the frontend.
    6. Frontend updates the UI based on the response.
- **Overall Architecture**: Modular Monolith with distinct layers for Routes, Models, and UI Components.

---

## 4. Folder Structure Explanation
The project is organized into two main root folders: `backend` and `src` (frontend).

### Backend Folders (`/backend`)
- **`models/`**: Defines the data schema (MongoDB collections).
- **`routes/`**: Handles API endpoints and route-level logic.
- **`server.js`**: The main entry point for the Express server.
- **`.env`**: Stores environment variables (MongoDB URI, Port).

### Frontend Folders (`/src`)
- **`components/`**: UI building blocks.
    - **`Authentication/`**: Login/Start pages.
    - **`Student-ui/`**: Student-centric pages (Attempt Exam, Results).
    - **`Teacher-ui/`**: Teacher-centric pages (Class Management, Exam creation).
- **`proctoring/`**: The core AI logic.
    - **`face/`, `gaze/`, `head/`, `object/`**: Specialized detection sub-modules.
    - **`ProctoringEngine.jsx`**: Orchestrator for all AI detections.
- **`App.js`**: Defines the application routes and layout.

---

## 5. Database Design
The system uses a document-oriented structure in MongoDB.

### Collections:
1. **`Class`**: Stores class metadata and an array of `students` (Sub-documents).
2. **`Exam`**: Stores exam details (date, duration, subject code, marks).
3. **`Question`**: Linked to `Exam` via `examId`.
4. **`Result`**: Stores student scores, answers, and grades.
5. **`ProctorLog`**: Stores violation data (type, severity, snapshot, metadata).
6. **`ExamAccess`**: Manages unique access codes for students.

**Relationships**:
- **One-to-Many**: One Class has many Exams. One Exam has many Questions.
- **Ref Relationship**: `Result` and `ProctorLog` refer back to `Exam` and `Student` via IDs.

---

## 6. API Analysis
Primary API endpoints used in the system:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/teacher/login` | POST | Authenticates teachers with static credentials. |
| `/api/student/login` | POST | Authenticates students against their enrolled class record. |
| `/api/exams` | POST | Creates a new exam record. |
| `/api/questions` | POST | Adds questions to a specific exam. |
| `/api/exams/verify-code` | POST | Validates the 6-digit access code for an exam. |
| `/api/violations/log` | POST | Saves a proctoring violation to the database. |
| `/api/results/exam/:id` | GET | Fetches all results for a specific exam (Teacher view). |

---

## 7. Authentication & Authorization
- **Teacher Authentication**: Currently utilizes a centralized logic check for prototyping (`teacher@123` / `123456`).
- **Student Authentication**: Requires the student's enrollment number and a password. The system looks up the student inside the `Class` collection to authorize access.
- **Authorization**: Protected routes in the React frontend (using conditional rendering in `App.js`) ensure students cannot access teacher pages and vice versa.

---

## 8. Frontend Pages & Components
- **FrontPage**: The entry point to choose between Teacher and Student roles.
- **Teacher Dashboard**: Overview of classes and exams.
- **Create Exam Page**: Form to define exam parameters.
- **Exam Instructions**: Pre-exam briefing for students.
- **Attempt Exam Page**: The core interface with question navigation and AI proctoring overlay.
- **Proctoring Engine**: Runs in the background during exams, using the device's camera.
- **Result Page**: Visual representation (Progress bars, Pie charts) of exam performance.

---

## 9. Backend Logic
- **Modular Routes**: APIs are split into functional files (e.g., `examRoutes.js`, `classRoutes.js`).
- **Middleware**: Uses `cors` for cross-origin requests and `express.json` with high limits (50MB) to handle Base64 proctoring snapshots.
- **Business Logic Flow**:
    - **Grading**: Logic in `examRoutes.js` (`/submit`) compares student answers with the key, handles string normalization, and calculates scores/grades instantly.
    - **Data Integrity**: Cascade deletion is implemented (e.g., deleting a class removes all its exams, questions, and results).

---

## 10. Security Analysis
- **Current Handling**:
  - **Input Validation**: Basic checks for missing fields in controllers.
  - **API Protection**: Access codes required for students to enter exams.
- **Suggested Improvements**:
  - **JWT Implementation**: Replace static/simple auth with JSON Web Tokens (JWT) for better session management.
  - **Bcrypt**: Hash passwords in the database (currently stored as plain text).
  - **Rate Limiting**: Implement to prevent brute-force attacks on login endpoints.

---

## 11. Deployment
- **Frontend**: Best hosted on **Vercel** or **Netlify** (configured via `vercel.json`).
- **Backend**: Can be deployed on **Render**, **Railway**, or **Heroku**.
- **Database**: **MongoDB Atlas** for a scalable, cloud-based NoSQL cluster.

---

## 12. Code Quality Review
- **Performance**: AI processing is done client-side (TensorFlow.js), which offloads server stress and ensures lower latency.
- **Best Practices Detected**:
  - Modularized proctoring logic.
  - Normalized responses from the backend.
  - Custom React hooks (e.g., `useToast`) for consistent UI notifications.
- **Improvements**:
  - Implement **Redux** or **Context API** for global state management (currently relies heavily on local state and props).
  - Add **Unit Testing** for critical grading logic.

---

## 13. Complete Working Flow
1. **Setup**: Teacher creates a `Class` and imports `Students`.
2. **Scheduling**: Teacher creates an `Exam` and adds `Questions`.
3. **Entry**: Student logs in, joins the class, and enters the `Exam Code`.
4. **Testing**:
   - System checks Webcam permissions.
   - Exam starts; **Proctoring Engine** initializes.
   - AI monitors the student continuously.
5. **Completion**: Student submits the exam; System calculates the final score.
6. **Review**: Teacher reviews the **Proctoring Logs** to check for any high-severity flags before finalizing results.
