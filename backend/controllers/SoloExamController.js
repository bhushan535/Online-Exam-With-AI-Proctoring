const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const TeacherProfile = require("../models/TeacherProfile");

/**
 * SoloExamController
 * Dedicated controller for handling exam operations specifically for Solo Teacher Mode.
 * This class ensures complete isolation from Organization Mode logic.
 */
class SoloExamController {
  
  /**
   * deleteSoloExam
   * Orchestrates the deletion of an exam and all its associated questions for a solo teacher.
   * Ensures ownership verification, atomicity via transactions, and detailed solo-mode logging.
   */
  static async deleteSoloExam(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const examId = req.params.id;
      const userId = req.userId || (req.user && req.user._id);

      // 1. Ownership Verification Step
      // Dedicated query to verify this specific teacher owns the exam record.
      const exam = await Exam.findOne({ _id: examId, createdBy: userId }).session(session);

      if (!exam) {
        await session.abortTransaction();
        session.endSession();
        // Validation Step: Return 403 if ownership is not confirmed
        return res.status(403).json({ 
          success: false, 
          message: "Deletion unauthorized. You do not own this exam or it does not exist in Solo Teacher Mode." 
        });
      }

      // 2. Data Retrieval Step
      // Query and fetch associated questions count before deletion for detailed logging.
      const questionCount = await Question.countDocuments({ examId: examId }).session(session);

      // 3. Logging Step: Pre-deletion details
      const logMetadata = {
        teacherId: userId,
        examId: examId,
        examName: exam.examName,
        questionsCount: questionCount,
        timestamp: new Date().toISOString(),
        mode: "SOLO_TEACHER_MODE"
      };
      
      console.log(`[SOLO TEACHER MODE] Deletion Initiated:`, logMetadata);

      // 4. Database Transaction Step
      // Cascade delete triggers via Mongoose middleware 'findOneAndDelete' hook in Exam model.
      // This ensures referential integrity as defined in requirements.
      await Exam.findOneAndDelete({ _id: examId, createdBy: userId }).session(session);

      // 5. Application-Level Deletion Step: Sync profile
      // Orchestrate the cleanup of teacher's internal exam list.
      await TeacherProfile.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { examsCreated: examId } },
        { session }
      );

      // Finalize the operation
      await session.commitTransaction();
      session.endSession();

      // 6. Completion Step: Clear audit log of success
      console.log(`[SOLO TEACHER MODE] Deletion Successful. Atomic operation completed for Exam ID: ${examId}`);
      
      return res.status(200).json({
        success: true,
        message: `Exam and all ${questionCount} associated questions deleted successfully in Solo Teacher Mode.`,
        deletedCount: { exams: 1, questions: questionCount }
      });

    } catch (err) {
      // 7. Rollback Mechanism
      // Prevent partial deletions if any step fails.
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();

      // 8. Error Handling Step
      console.error(`[SOLO TEACHER MODE ERROR] Deletion failed:`, err);
      return res.status(500).json({
        success: false,
        message: "Solo Teacher Mode deletion failed. Transaction rolled back.",
        error: err.message
      });
    }
  }
}

module.exports = SoloExamController;
