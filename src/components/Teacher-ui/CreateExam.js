import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast    from "../Toast";
import useToast from "../useToast";
import "./CreateExam.css";
import { BASE_URL } from '../../config';

function CreateExam() {

const navigate = useNavigate();
const { toasts, showToast, removeToast } = useToast();

const today = new Date().toISOString().split("T")[0];

/* EXAM FIELDS */

const [examName,setExamName] = useState("");
const [subject,setSubject] = useState("");
const [subCode,setSubCode] = useState("");
const [examDate,setExamDate] = useState("");
const [totalQuestions,setTotalQuestions] = useState("");
const [duration,setDuration] = useState("");
const [marksPerQuestion,setMarksPerQuestion] = useState("");
const [visibility, setVisibility] = useState("private");

/* PROCTORING CONFIG */
const [proctoringConfig, setProctoringConfig] = useState({
  enabled: true,
  autoSubmitLimit: 0,
  requireFullScreen: false,
  disableTabSwitching: false,
  warningLimit: 3
});

/* CLASS DATA */

const [classId,setClassId] = useState("");
const [branch,setBranch] = useState("");
const [year,setYear] = useState("");
const [semester,setSemester] = useState("");

const [classes,setClasses] = useState([]);

/* FETCH CLASSES */

useEffect(()=>{

fetch(`${BASE_URL}/classes`)
.then(res=>res.json())
.then(data=>setClasses(data));

},[]);

/* SUBJECT OPTIONS */

const subjectOptions = {

"1st Sem":[{name:"BSC",code:"311305"}],

"2nd Sem":[{name:"BEE",code:"312302"}],

"3rd Sem":[{name:"SUB3",code:"313000"}],

"4th Sem":[{name:"EES",code:"314301"}],

"5th Sem":[{name:"SUB5",code:"315000"}],

"6th Sem":[
{name:"MAN",code:"315301"},
{name:"ETI",code:"316313"}
]

};

/* CLASS SELECT */

const handleClassChange = (id)=>{

setClassId(id);

const selectedClass = classes.find(c=>c._id === id);

if(!selectedClass) return;

setBranch(selectedClass.branch);
setYear(selectedClass.year);
setSemester(selectedClass.semester);

setSubject("");
setSubCode("");

};

/* SUBJECT SELECT */

const handleSubjectChange = (value)=>{

const selected = subjectOptions[semester]?.find(
s=>s.name === value
);

setSubject(value);
setSubCode(selected?.code || "");

};

/* SUBMIT */

const handleSubmit = async(e)=>{

e.preventDefault();

const examData = {

examName,
classId,
branch,
year,
semester,
subject,
subCode,
examDate,

totalQuestions:Number(totalQuestions),
duration:Number(duration),
marksPerQuestion:Number(marksPerQuestion),
totalMarks:Number(totalQuestions) * Number(marksPerQuestion),
visibility,
proctoringConfig
};

const res = await fetch(`${BASE_URL}/exams`,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(examData)

});

const data = await res.json();

  if (!res.ok) {
    showToast(data.message || "Failed to create exam. Please try again.", "error");
    return;
  }

  showToast("Exam created successfully! 🎉", "success");
  setTimeout(() => navigate("/Exams"), 1500);
};

return (

<div className="create-exam-page">

<Toast toasts={toasts} removeToast={removeToast} />

<h2>Create Exam</h2>

<form className="create-exam-form" onSubmit={handleSubmit}>

<label>Select Class</label>

<select
value={classId}
onChange={(e)=>handleClassChange(e.target.value)}
required

>

<option value="">Select Class</option>

{classes.map((c)=>(

<option key={c._id} value={c._id}>

{c.className} ({c.branch} - {c.semester})

</option>

))}

</select>

<label>Branch</label> <input value={branch} readOnly />

<label>Year</label> <input value={year} readOnly />

<label>Semester</label> <input value={semester} readOnly />

<label>Exam Name</label>

<input
value={examName}
onChange={(e)=>setExamName(e.target.value)}
required
/>

{semester && (

<>

<label>Subject</label>

<select
value={subject}
onChange={(e)=>handleSubjectChange(e.target.value)}
required

>

<option value="">Select Subject</option>

{subjectOptions[semester]?.map((s)=>(

<option key={s.code} value={s.name}>
{s.name}
</option>

))}

</select>

</>

)}

{subCode && (

<>

<label>Subject Code</label>

<input value={subCode} readOnly />

</>

)}

<label>Exam Date</label>

<input
type="date"
value={examDate}
min={today}
onChange={(e)=>setExamDate(e.target.value)}
required
/>

<label>No. of Questions</label>

<input
type="number"
value={totalQuestions}
onChange={(e)=>setTotalQuestions(e.target.value)}
required
/>

<label>Duration (minutes)</label>

<input
type="number"
value={duration}
onChange={(e)=>setDuration(e.target.value)}
required
/>

<label>Marks Per Question</label>

<input
type="number"
value={marksPerQuestion}
onChange={(e)=>setMarksPerQuestion(e.target.value)}
required
/>

<label>Visibility</label>
<select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
  <option value="private">Private (Only Me)</option>
  <option value="organization">Organization (Shared with Institution)</option>
</select>

<p className="total-marks-preview">
  Total Exam Marks: <strong>{(Number(totalQuestions) && Number(marksPerQuestion)) ? Number(totalQuestions) * Number(marksPerQuestion) : 0}</strong>
</p>

<div className="proctoring-settings-section">
  <h3>🛡️ Proctoring Settings</h3>
  <div className="proctor-grid">
    <div className="proctor-field">
      <label>Enable AI Proctoring</label>
      <input 
        type="checkbox" 
        checked={proctoringConfig.enabled}
        onChange={(e) => setProctoringConfig({...proctoringConfig, enabled: e.target.checked})}
      />
    </div>
    <div className="proctor-field">
      <label>Full Screen Required</label>
      <input 
        type="checkbox" 
        checked={proctoringConfig.requireFullScreen}
        onChange={(e) => setProctoringConfig({...proctoringConfig, requireFullScreen: e.target.checked})}
      />
    </div>
    <div className="proctor-field">
      <label>Disable Tab Switching</label>
      <input 
        type="checkbox" 
        checked={proctoringConfig.disableTabSwitching}
        onChange={(e) => setProctoringConfig({...proctoringConfig, disableTabSwitching: e.target.checked})}
      />
    </div>
    <div className="proctor-field">
      <label>Warning Limit</label>
      <input 
        type="number" 
        value={proctoringConfig.warningLimit}
        onChange={(e) => setProctoringConfig({...proctoringConfig, warningLimit: Number(e.target.value)})}
      />
    </div>
    <div className="proctor-field">
      <label>Auto-Submit Limit (0 to disable)</label>
      <input 
        type="number" 
        value={proctoringConfig.autoSubmitLimit}
        onChange={(e) => setProctoringConfig({...proctoringConfig, autoSubmitLimit: Number(e.target.value)})}
      />
    </div>
  </div>
</div>

<button type="submit">
Create Exam
</button>

</form>

</div>

);

}

export default CreateExam;
