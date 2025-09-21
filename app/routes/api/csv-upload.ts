import { createRoute } from 'honox/factory'

// CSV parsing utility - handles quoted fields with commas
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  // Parse CSV line with proper quote handling
  function parseLine(line: string): string[] {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    // Add last field
    result.push(current.trim())
    return result
  }
  
  const headers = parseLine(lines[0]).map(h => h.replace(/"/g, ''))
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]).map(v => v.replace(/^"|"$/g, '')) // Remove surrounding quotes
    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        row[header] = value === '' || value === null || value === undefined ? null : value
      })
      rows.push(row)
    }
  }
  
  return rows
}

// Validation functions
function validateStudentRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.name) return 'Missing name'
  if (!row.email) return 'Missing email'
  if (!row.dob) return 'Missing dob'
  if (!row.currentSemester) return 'Missing currentSemester'
  return null
}

function validateAttendanceRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.courseId) return 'Missing courseId'
  if (!row.month) return 'Missing month'
  if (!row.attendancePercent) return 'Missing attendancePercent'
  return null
}

function validateTestScoreRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.courseId) return 'Missing courseId'
  if (!row.testDate) return 'Missing testDate'
  if (!row.score) return 'Missing score'
  return null
}

function validateBacklogRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.courseId) return 'Missing courseId'
  if (!row.attempts) return 'Missing attempts'
  if (row.cleared === undefined || row.cleared === null) return 'Missing cleared field'
  return null
}

function validateFeeRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.dueDate) return 'Missing dueDate'
  if (!row.status) return 'Missing status'
  if (!row.dueMonths) return 'Missing dueMonths'
  return null
}

function validateProjectRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.title) return 'Missing title'
  if (!row.startDate) return 'Missing startDate'
  return null
}

function validatePhdRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.title) return 'Missing title'
  if (!row.researchArea) return 'Missing researchArea'
  if (!row.startDate) return 'Missing startDate'
  return null
}

function validateFellowshipRow(row: any): string | null {
  if (!row.studentId) return 'Missing studentId'
  if (!row.type) return 'Missing type'
  if (!row.amount) return 'Missing amount'
  if (!row.duration) return 'Missing duration'
  if (!row.startDate) return 'Missing startDate'
  return null
}

export const POST = createRoute(async (c) => {
  try {
    // Get teacher ID from cookies
    const cookies = c.req.raw.headers.get('Cookie') || ''
    const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
    const teacherId = uidRaw ? decodeURIComponent(uidRaw) : undefined
    
    if (!teacherId) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type) {
      return c.json({ error: 'File and type are required' }, 400)
    }

    const csvText = await file.text()
    const rows = parseCSV(csvText)
    
    if (rows.length === 0) {
      return c.json({ error: 'No valid data found in CSV' }, 400)
    }

    // Log the start of processing
    console.log(`\n📊 Processing ${type} CSV: ${file.name}`)
    console.log(`   └── ${rows.length} rows to process`)

    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    const errors: string[] = []
    let processed = 0

    // Process based on type
    switch (type) {
      case 'students':
        for (const row of rows) {
          const validationError = validateStudentRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Validate and parse date
            const dobDate = new Date(row.dob)
            if (isNaN(dobDate.getTime())) {
              errors.push(`Row ${processed + 1}: Invalid date format for dob: ${row.dob}`)
              continue
            }

            // Validate and parse semester
            const semester = parseInt(row.currentSemester)
            if (isNaN(semester) || semester < 1 || semester > 8) {
              errors.push(`Row ${processed + 1}: Invalid currentSemester: ${row.currentSemester}`)
              continue
            }

            // Handle batchId - create batch if it doesn't exist
            let finalBatchId = null
            if (row.batchId) {
              try {
                // Check if batch exists
                let batch = await prisma.batch.findUnique({
                  where: { batchId: row.batchId }
                })
                
                if (batch) {
                  console.log(`📋 Found existing batch: ${row.batchId}`)
                } else {
                  // Extract year and department from batchId (e.g., "CSE2024B" -> dept: "CSE", year: 2024)
                  const batchIdMatch = row.batchId.match(/^([A-Z]+)(\d{4})([A-Z])$/)
                  if (batchIdMatch) {
                    const [, dept, yearStr, section] = batchIdMatch
                    const year = parseInt(yearStr)
                    
                    // Create a default course for this batch
                    const defaultCourseId = `${dept}_GENERAL`
                    let course = await prisma.courseSubject.findUnique({
                      where: { courseId: defaultCourseId }
                    })
                    
                    if (!course) {
                      course = await prisma.courseSubject.create({
                        data: {
                          courseId: defaultCourseId,
                          name: `${dept} General Course`,
                          code: defaultCourseId,
                          semester: 1,
                          department: dept
                        }
                      })
                      console.log(`✅ Created course: ${defaultCourseId} for department ${dept}`)
                    }
                    
                    // Create the batch
                    batch = await prisma.batch.create({
                      data: {
                        batchId: row.batchId,
                        batchNo: section,
                        courseId: defaultCourseId,
                        year: year,
                        department: dept
                      }
                    })
                    
                    // Log successful batch creation with detailed info
                    console.log(`🎓 Created batch: ${row.batchId} for department ${dept}, year ${year}, section ${section}`)
                    console.log(`   └── Linked to course: ${defaultCourseId}`)
                  }
                }
                
                if (batch) {
                  finalBatchId = row.batchId
                }
              } catch (batchError: any) {
                // If batch creation fails, continue without batch assignment
                errors.push(`Row ${processed + 1}: Could not create/find batch ${row.batchId}: ${batchError.message}`)
              }
            }

            // Check if student already exists
            const existingStudent = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })

            if (existingStudent) {
              // If student exists but has no teacher, assign current teacher
              if (!existingStudent.teacherId) {
                console.log(`👨‍🏫 Assigning teacher to existing student: ${row.studentId} (${row.name})`)
                await prisma.student.update({
                  where: { studentId: row.studentId },
                  data: {
                    name: row.name,
                    email: row.email,
                    phone: row.phone || null,
                    dob: dobDate,
                    department: row.department || null,
                    currentSemester: semester,
                    batchId: finalBatchId,
                    teacherId: teacherId, // Assign current teacher to orphaned student
                    parentName: row.parentName || null,
                    parentEmail: row.parentEmail || null,
                    parentPhone: row.parentPhone || null,
                    address: row.address || null,
                  }
                })
              } else {
                // Student exists and has a teacher - just update other fields (keep existing teacher)
                console.log(`📝 Updating existing student: ${row.studentId} (keeping teacher: ${existingStudent.teacherId})`)
                await prisma.student.update({
                  where: { studentId: row.studentId },
                  data: {
                    name: row.name,
                    email: row.email,
                    phone: row.phone || null,
                    dob: dobDate,
                    department: row.department || null,
                    currentSemester: semester,
                    batchId: finalBatchId,
                    // Don't update teacherId - keep existing teacher
                    parentName: row.parentName || null,
                    parentEmail: row.parentEmail || null,
                    parentPhone: row.parentPhone || null,
                    address: row.address || null,
                  }
                })
              }
            } else {
              // Student doesn't exist - create new with current teacher
              console.log(`➕ Creating new student: ${row.studentId} (${row.name})`)
              await prisma.student.create({
                data: {
                  studentId: row.studentId,
                  name: row.name,
                  email: row.email,
                  phone: row.phone || null,
                  dob: dobDate,
                  department: row.department || null,
                  currentSemester: semester,
                  batchId: finalBatchId,
                  teacherId: teacherId, // Associate with current teacher
                  parentName: row.parentName || null,
                  parentEmail: row.parentEmail || null,
                  parentPhone: row.parentPhone || null,
                  address: row.address || null,
                }
              })
            }
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      case 'attendance':
        for (const row of rows) {
          const validationError = validateAttendanceRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Check if student exists
            const student = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })
            if (!student) {
              errors.push(`Row ${processed + 1}: Student ${row.studentId} not found`)
              continue
            }

            // Check if course exists, create if it doesn't
            let course = await prisma.courseSubject.findUnique({
              where: { courseId: row.courseId }
            })
            if (!course) {
              course = await prisma.courseSubject.create({
                data: {
                  courseId: row.courseId,
                  name: `Course ${row.courseId}`,
                  code: row.courseId,
                  semester: 1,
                  department: student.department || 'General'
                }
              })
            }

            // Parse month - handle both YYYY-MM and YYYY-MM-DD formats
            let monthDate: Date
            if (row.month.includes('-') && row.month.length >= 7) {
              if (row.month.length === 7) {
                // YYYY-MM format
                monthDate = new Date(row.month + '-01')
              } else {
                // YYYY-MM-DD format
                monthDate = new Date(row.month)
              }
            } else {
              errors.push(`Row ${processed + 1}: Invalid month format: ${row.month}`)
              continue
            }

            if (isNaN(monthDate.getTime())) {
              errors.push(`Row ${processed + 1}: Invalid month date: ${row.month}`)
              continue
            }

            const attendancePercent = parseFloat(row.attendancePercent)
            if (isNaN(attendancePercent) || attendancePercent < 0 || attendancePercent > 100) {
              errors.push(`Row ${processed + 1}: Invalid attendance percentage: ${row.attendancePercent}`)
              continue
            }

            // Check if attendance record already exists
            const existingAttendance = await prisma.attendance.findFirst({
              where: {
                studentId: row.studentId,
                courseId: row.courseId,
                month: monthDate
              }
            })

            if (existingAttendance) {
              // Update existing record
              await prisma.attendance.update({
                where: { attendanceId: existingAttendance.attendanceId },
                data: { attendancePercent: attendancePercent }
              })
            } else {
              // Create new record
              await prisma.attendance.create({
                data: {
                  studentId: row.studentId,
                  courseId: row.courseId,
                  month: monthDate,
                  attendancePercent: attendancePercent
                }
              })
            }
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      case 'testscores':
        for (const row of rows) {
          const validationError = validateTestScoreRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Check if student exists
            const student = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })
            if (!student) {
              errors.push(`Row ${processed + 1}: Student ${row.studentId} not found`)
              continue
            }

            // Check if course exists, create if it doesn't
            let course = await prisma.courseSubject.findUnique({
              where: { courseId: row.courseId }
            })
            if (!course) {
              course = await prisma.courseSubject.create({
                data: {
                  courseId: row.courseId,
                  name: `Course ${row.courseId}`,
                  code: row.courseId,
                  semester: 1,
                  department: student.department || 'General'
                }
              })
            }

            // Validate test date
            const testDate = new Date(row.testDate)
            if (isNaN(testDate.getTime())) {
              errors.push(`Row ${processed + 1}: Invalid test date: ${row.testDate}`)
              continue
            }

            // Validate score
            const score = parseFloat(row.score)
            if (isNaN(score) || score < 0 || score > 100) {
              errors.push(`Row ${processed + 1}: Invalid score: ${row.score}`)
              continue
            }

            await prisma.testScore.create({
              data: {
                studentId: row.studentId,
                courseId: row.courseId,
                testDate: testDate,
                score: score
              }
            })
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      case 'backlogs':
        for (const row of rows) {
          const validationError = validateBacklogRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Check if student exists
            const student = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })
            if (!student) {
              errors.push(`Row ${processed + 1}: Student ${row.studentId} not found`)
              continue
            }

            // Check if course exists, create if it doesn't
            let course = await prisma.courseSubject.findUnique({
              where: { courseId: row.courseId }
            })
            if (!course) {
              course = await prisma.courseSubject.create({
                data: {
                  courseId: row.courseId,
                  name: `Course ${row.courseId}`,
                  code: row.courseId,
                  semester: 1,
                  department: student.department || 'General'
                }
              })
            }

            // Validate attempts
            const attempts = parseInt(row.attempts)
            if (isNaN(attempts) || attempts < 1) {
              errors.push(`Row ${processed + 1}: Invalid attempts: ${row.attempts}`)
              continue
            }

            // Parse cleared status
            const cleared = row.cleared === 'true' || row.cleared === '1' || row.cleared === 'TRUE' || row.cleared === 'True'

            // Check if backlog record already exists
            const existingBacklog = await prisma.backlog.findFirst({
              where: {
                studentId: row.studentId,
                courseId: row.courseId
              }
            })

            if (existingBacklog) {
              // Update existing record
              await prisma.backlog.update({
                where: { backlogId: existingBacklog.backlogId },
                data: { 
                  attempts: attempts,
                  cleared: cleared
                }
              })
            } else {
              // Create new record
              await prisma.backlog.create({
                data: {
                  studentId: row.studentId,
                  courseId: row.courseId,
                  attempts: attempts,
                  cleared: cleared
                }
              })
            }
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      case 'fees':
        for (const row of rows) {
          const validationError = validateFeeRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Check if student exists
            const student = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })
            if (!student) {
              errors.push(`Row ${processed + 1}: Student ${row.studentId} not found`)
              continue
            }

            // Validate due date
            const dueDate = new Date(row.dueDate)
            if (isNaN(dueDate.getTime())) {
              errors.push(`Row ${processed + 1}: Invalid due date: ${row.dueDate}`)
              continue
            }

            // Validate paid date if provided
            let paidDate = null
            if (row.paidDate) {
              paidDate = new Date(row.paidDate)
              if (isNaN(paidDate.getTime())) {
                errors.push(`Row ${processed + 1}: Invalid paid date: ${row.paidDate}`)
                continue
              }
            }

            // Validate due months
            const dueMonths = parseInt(row.dueMonths)
            if (isNaN(dueMonths) || dueMonths < 1) {
              errors.push(`Row ${processed + 1}: Invalid due months: ${row.dueMonths}`)
              continue
            }

            await prisma.feePayment.create({
              data: {
                studentId: row.studentId,
                dueDate: dueDate,
                paidDate: paidDate,
                status: row.status,
                dueMonths: dueMonths
              }
            })
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      case 'projects':
        for (const row of rows) {
          const validationError = validateProjectRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Check if student exists
            const student = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })
            if (!student) {
              errors.push(`Row ${processed + 1}: Student ${row.studentId} not found`)
              continue
            }

            await prisma.project.create({
              data: {
                title: row.title,
                description: row.description || null,
                studentId: row.studentId,
                supervisorId: teacherId,
                startDate: new Date(row.startDate),
                endDate: row.endDate ? new Date(row.endDate) : null,
                status: row.status || 'Active'
              }
            })
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      case 'phd':
        for (const row of rows) {
          const validationError = validatePhdRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Check if student exists
            const student = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })
            if (!student) {
              errors.push(`Row ${processed + 1}: Student ${row.studentId} not found`)
              continue
            }

            await prisma.phdSupervision.create({
              data: {
                title: row.title,
                researchArea: row.researchArea,
                studentId: row.studentId,
                supervisorId: teacherId,
                startDate: new Date(row.startDate),
                expectedEnd: row.expectedEnd ? new Date(row.expectedEnd) : null,
                status: row.status || 'Ongoing'
              }
            })
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      case 'fellowships':
        for (const row of rows) {
          const validationError = validateFellowshipRow(row)
          if (validationError) {
            errors.push(`Row ${processed + 1}: ${validationError}`)
            continue
          }

          try {
            // Check if student exists
            const student = await prisma.student.findUnique({
              where: { studentId: row.studentId }
            })
            if (!student) {
              errors.push(`Row ${processed + 1}: Student ${row.studentId} not found`)
              continue
            }

            await prisma.fellowship.create({
              data: {
                type: row.type,
                amount: parseFloat(row.amount),
                duration: parseInt(row.duration),
                studentId: row.studentId,
                supervisorId: teacherId,
                startDate: new Date(row.startDate),
                endDate: row.endDate ? new Date(row.endDate) : null,
                status: row.status || 'Active'
              }
            })
            processed++
          } catch (error: any) {
            errors.push(`Row ${processed + 1}: Database error - ${error.message}`)
          }
        }
        break

      default:
        return c.json({ error: 'Invalid upload type' }, 400)
    }

    // Log completion summary
    console.log(`✅ Completed ${type} CSV processing:`)
    console.log(`   └── ${processed}/${rows.length} records processed successfully`)
    if (errors.length > 0) {
      console.log(`   └── ${errors.length} errors encountered`)
    }

    return c.json({
      success: true,
      processed,
      total: rows.length,
      errors: errors.slice(0, 10) // Limit errors to first 10
    })

  } catch (error: any) {
    console.error('CSV upload error:', error)
    return c.json({ error: 'Internal server error: ' + error.message }, 500)
  }
})
