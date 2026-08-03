import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
      return NextResponse.json({ message: 'Only admins can export data' }, { status: 403 });
    }

    // Fetch all required data from Prisma
    const students = await prisma.student.findMany({
      include: {
        user: { select: { email: true } },
        tests: {
          include: {
            test_responses: {
              include: {
                question: true,
                ai_evaluation: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { full_name: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CampusScreen Admin';
    workbook.created = new Date();

    // Reusable styling function
    const applyHeaderStyle = (sheet: ExcelJS.Worksheet) => {
      sheet.getRow(1).eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Dark blue/slate
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sheet.columns.length }
      };
    };

    // --- SHEET 1: Student Summary ---
    const summarySheet = workbook.addWorksheet('Student Summary');
    summarySheet.columns = [
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'USN', key: 'usn', width: 15 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Total Score', key: 'score', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
      { header: 'Rank', key: 'rank', width: 10 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Time Taken (mins)', key: 'time_taken', width: 20 },
      { header: 'Submission Time', key: 'submission_time', width: 25 },
    ];

    applyHeaderStyle(summarySheet);

    students.forEach((s, idx) => {
      const latestTest = s.tests[0]; // Assuming most recent test is the primary one
      
      let timeTaken = 'N/A';
      if (latestTest?.start_time && latestTest?.end_time) {
        const start = new Date(latestTest.start_time).getTime();
        const end = new Date(latestTest.end_time).getTime();
        timeTaken = String(Math.round((end - start) / 60000));
      }

      summarySheet.addRow({
        name: s.full_name || 'N/A',
        usn: s.usn || 'N/A',
        branch: s.branch_name || 'N/A',
        email: s.user?.email || 'N/A',
        score: latestTest?.score != null ? Number(latestTest.score) : 'N/A',
        percentage: 'N/A', // Compute if needed
        rank: idx + 1, // Basic sorting by DB returned order, can be enhanced
        status: latestTest?.status || 'Not Started',
        time_taken: timeTaken,
        submission_time: latestTest?.end_time ? new Date(latestTest.end_time).toLocaleString() : 'N/A',
      });
    });

    // --- SHEET 2: Question Wise Responses ---
    const qSheet = workbook.addWorksheet('Question Wise Responses');
    qSheet.columns = [
      { header: 'Student Name', key: 'student', width: 20 },
      { header: 'USN', key: 'usn', width: 15 },
      { header: 'Test ID', key: 'test_id', width: 36 },
      { header: 'Section', key: 'section', width: 20 },
      { header: 'Question Type', key: 'type', width: 20 },
      { header: 'Question Text', key: 'question', width: 50 },
      { header: 'Max Marks', key: 'max_marks', width: 15 },
      { header: 'Student Answer', key: 'answer', width: 50 },
      { header: 'Final Marks', key: 'marks', width: 15 },
      { header: 'Evaluation Status', key: 'eval_status', width: 20 },
    ];
    applyHeaderStyle(qSheet);

    // --- SHEET 3: AI Evaluation ---
    const aiSheet = workbook.addWorksheet('AI Evaluation');
    aiSheet.columns = [
      { header: 'Student Name', key: 'student', width: 20 },
      { header: 'USN', key: 'usn', width: 15 },
      { header: 'Question', key: 'question', width: 40 },
      { header: 'AI Marks', key: 'ai_marks', width: 12 },
      { header: 'Strengths', key: 'strengths', width: 35 },
      { header: 'Weaknesses', key: 'weaknesses', width: 35 },
      { header: 'Improvements', key: 'improvements', width: 35 },
      { header: 'Feedback', key: 'feedback', width: 40 },
      { header: 'Model Used', key: 'model', width: 15 },
      { header: 'Evaluated At', key: 'eval_time', width: 20 },
    ];
    applyHeaderStyle(aiSheet);

    // --- SHEET 4: Coding Results ---
    const codeSheet = workbook.addWorksheet('Coding Results');
    codeSheet.columns = [
      { header: 'Student Name', key: 'student', width: 20 },
      { header: 'USN', key: 'usn', width: 15 },
      { header: 'Question', key: 'question', width: 30 },
      { header: 'Language', key: 'language', width: 15 },
      { header: 'Code', key: 'code', width: 60 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Compilation', key: 'compilation', width: 15 },
      { header: 'Execution', key: 'execution', width: 15 },
      { header: 'Feedback', key: 'feedback', width: 40 },
    ];
    applyHeaderStyle(codeSheet);

    // Populate Sheet 2, 3, 4
    students.forEach(s => {
      s.tests.forEach(test => {
        test.test_responses.forEach(res => {
          const q = res.question;
          const ai = res.ai_evaluation;

          // Sheet 2
          qSheet.addRow({
            student: s.full_name || 'N/A',
            usn: s.usn || 'N/A',
            test_id: test.id,
            section: q?.section || 'N/A',
            type: q?.type || 'N/A',
            question: q?.question_text || 'N/A',
            max_marks: q?.points || 0,
            answer: res.student_answer || '',
            marks: res.points_earned != null ? Number(res.points_earned) : 'N/A',
            eval_status: res.evaluation_status || 'N/A'
          });

          // Sheet 3
          if (ai) {
            aiSheet.addRow({
              student: s.full_name || 'N/A',
              usn: s.usn || 'N/A',
              question: q?.question_text || 'N/A',
              ai_marks: ai.obtained_marks != null ? Number(ai.obtained_marks) : 'N/A',
              strengths: Array.isArray(ai.strengths) ? ai.strengths.join('; ') : '',
              weaknesses: Array.isArray((ai as any).weaknesses) ? (ai as any).weaknesses.join('; ') : '',
              improvements: Array.isArray(ai.improvements) ? ai.improvements.join('; ') : '',
              feedback: ai.feedback || '',
              model: ai.model_used || 'N/A',
              eval_time: ai.evaluated_at ? new Date(ai.evaluated_at).toLocaleString() : 'N/A'
            });
          }

          // Sheet 4
          if (q?.type === 'coding') {
            let codeAnswer = res.student_answer || '';
            let language = 'javascript';
            let executionInfo = '';
            
            try {
              if (codeAnswer.startsWith('{')) {
                const parsed = JSON.parse(codeAnswer);
                codeAnswer = parsed.code || '';
                language = parsed.language || 'javascript';
                executionInfo = parsed.result ? JSON.stringify(parsed.result) : '';
              }
            } catch (e) {}

            codeSheet.addRow({
              student: s.full_name || 'N/A',
              usn: s.usn || 'N/A',
              question: q?.question_text || 'N/A',
              language: language,
              code: codeAnswer,
              score: res.points_earned != null ? Number(res.points_earned) : 'N/A',
              compilation: 'N/A', // Extracted from executionInfo if available
              execution: executionInfo, // Simplified
              feedback: ai?.feedback || ''
            });
          }
        });
      });
    });

    // Formatting for text wrapping in specific columns
    [qSheet, aiSheet, codeSheet].forEach(sheet => {
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
            cell.alignment = { wrapText: true, vertical: 'top' };
          });
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Student_Assessment_Results.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('[Export Excel Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to export Excel data' },
      { status: 500 }
    );
  }
}
