import ProctoringEngine from "../ProctoringEngine";

export default function ProctorTest() {
  return (
    <div style={{ padding: 20 }}>
      <h2>AI Proctoring – Test Page</h2>
      <ProctoringEngine
        examId="test-123"
        studentId="student-456"
        onAutoSubmit={() => alert("AUTO SUBMIT")}
        onWarning={(msg) => console.log("WARNING:", msg)}
      />
    </div>
  );
}