import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

type TimetableEntry = {
  day: string
  start_time: string
  end_time: string
  course_code: string
  course_name: string
  staff_name: string
}

type AttendanceEntry = {
  rrn: string
  name: string | null
  status: 'present' | 'absent'
}

type AttendanceLog = {
  date: string
  period_start: string | null
  period_end: string | null
  course_code: string | null
  records: AttendanceEntry[]
}

type StudentAnalytics = {
  rrn: string
  name: string | null
  present: number
  absent: number
  anomalies: number
  score: number
  red_flag: boolean
}

type UploadKind = 'timetable' | 'attendance'

function formatTime(value: string) {
  return value.slice(0, 5)
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function normalizeDay(day: string) {
  return day.slice(0, 3).toLowerCase()
}

function todayString() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>()
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics[]>([])
  const [attendanceDraft, setAttendanceDraft] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<UploadKind | null>(null)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [attendanceFiles, setAttendanceFiles] = useState(0)
  const [showStudents, setShowStudents] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!classId) return
    Promise.all([
      fetch(`${API_BASE_URL}/timetable/${encodeURIComponent(classId)}`).then(async (response) => {
        if (!response.ok) throw new Error('Unable to load the timetable.')
        return response.json() as Promise<{ entries: TimetableEntry[] }>
      }),
      fetch(`${API_BASE_URL}/attendance/${encodeURIComponent(classId)}`).then(async (response) => {
        if (!response.ok) throw new Error('Unable to load attendance history.')
        return response.json() as Promise<{ logs: AttendanceLog[] }>
      }),
      fetch(`${API_BASE_URL}/attendance/analytics/${encodeURIComponent(classId)}`).then(async (response) => {
        if (!response.ok) throw new Error('Unable to load attendance analytics.')
        return response.json() as Promise<{ students: StudentAnalytics[] }>
      }),
    ]).then(([timetableData, attendanceData, analyticsData]) => {
      setTimetable(timetableData.entries)
      setAttendanceLogs(attendanceData.logs)
      setStudentAnalytics(analyticsData.students)
    }).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load class data.')
    }).finally(() => setLoading(false))
  }, [classId])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
  const currentPeriod = timetable.find((entry) =>
    normalizeDay(entry.day) === currentDay
    && timeToMinutes(entry.start_time) <= currentMinutes
    && timeToMinutes(entry.end_time) > currentMinutes,
  )

  const uploadFile = async (kind: UploadKind, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length || !classId) return

    setUploading(kind)
    setMessage('')
    setError('')
    const formData = new FormData()
    formData.append('class_id', classId)
    if (kind === 'attendance') files.forEach((file) => formData.append('files', file))
    else formData.append('file', files[0])

    try {
      const response = await fetch(`${API_BASE_URL}/${kind === 'attendance' ? 'attendance/extract' : 'timetable/upload'}`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? `Unable to upload the ${kind}.`)

      if (kind === 'timetable') {
        setTimetable(data.entries)
        setMessage(`Timetable extracted and saved: ${data.saved} entries.`)
      } else {
        const extractedEntries = data.entries as AttendanceEntry[]
        const mergedEntries: AttendanceEntry[] = Array.from(
          extractedEntries.reduce((entries, entry) => {
            const previous = entries.get(entry.rrn)
            entries.set(entry.rrn, {
              ...entry,
              name: entry.name || previous?.name || null,
            })
            return entries
          }, new Map()).values(),
        )
        setAttendanceDraft(mergedEntries)
        setAttendanceFiles(data.files)
        setMessage(`${mergedEntries.length} unique students from ${data.files} image${data.files === 1 ? '' : 's'} ready for review. Save after corrections.`)
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : `Unable to upload the ${kind}.`)
    } finally {
      setUploading(null)
    }
  }

  const updateDraft = (index: number, field: keyof AttendanceEntry, value: string) => {
    setAttendanceDraft((entries) => entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry))
  }

  const saveAttendance = async () => {
    if (!classId || !currentPeriod || !attendanceDraft.length) return
    setSavingAttendance(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId,
          date: todayString(),
          period_start: currentPeriod.start_time,
          period_end: currentPeriod.end_time,
          course_code: currentPeriod.course_code,
          entries: attendanceDraft,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail ?? 'Unable to save attendance.')
      setAttendanceLogs((logs) => [...logs, { date: data.date, period_start: data.period_start, period_end: data.period_end, course_code: currentPeriod.course_code, records: attendanceDraft }])
      setStudentAnalytics((students) => {
        const current = new Map(students.map((student) => [student.rrn, student]))
        attendanceDraft.forEach((saved) => {
          const previous = current.get(saved.rrn) ?? { rrn: saved.rrn, name: saved.name, present: 0, absent: 0, anomalies: 0, score: 100, red_flag: false }
          const present = previous.present + (saved.status === 'present' ? 1 : 0)
          const absent = previous.absent + (saved.status === 'absent' ? 1 : 0)
          const score = Math.round((present / (present + absent)) * 100)
          current.set(saved.rrn, { ...previous, name: saved.name || previous.name, present, absent, score, red_flag: absent >= 3 || score < 75 })
        })
        return Array.from(current.values())
      })
      setAttendanceDraft([])
      setMessage(`Attendance saved for ${currentPeriod.course_code}.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save attendance.')
    } finally {
      setSavingAttendance(false)
    }
  }

  const timeBoundaries = Array.from(new Set(timetable.flatMap((entry) => [entry.start_time, entry.end_time]))).sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
  const timeSlots = timeBoundaries.slice(0, -1).map((startTime, index) => ({ startTime, endTime: timeBoundaries[index + 1] }))
  const students = studentAnalytics

  return (
    <div className="page">
      <h2>{classId}</h2>
      <p className="sub">{now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {currentPeriod ? `Current period: ${currentPeriod.course_code} (${formatTime(currentPeriod.start_time)}–${formatTime(currentPeriod.end_time)})` : 'No active period right now'}</p>

      {currentPeriod && <div className="current-period"><span>NOW</span><strong>{currentPeriod.course_code}</strong><small>{currentPeriod.course_name} · {currentPeriod.staff_name}</small></div>}

      <div className="upload-grid">
        <label className={`upload-card ${uploading === 'timetable' ? 'is-uploading' : ''}`}>
          <span className="upload-icon">TT</span><span className="upload-card-title">Upload timetable</span><span className="upload-card-copy">AI extracts and saves this section's schedule.</span>
          <input type="file" accept="image/*" onChange={(event) => void uploadFile('timetable', event)} disabled={uploading !== null} />
        </label>
        <label className={`upload-card attendance ${uploading === 'attendance' ? 'is-uploading' : ''}`}>
          <span className="upload-icon">LOG</span><span className="upload-card-title">Upload attendance logs</span><span className="upload-card-copy">Select one or many images for this period.</span>
          <input type="file" accept="image/*" multiple onChange={(event) => void uploadFile('attendance', event)} disabled={uploading !== null} />
        </label>
      </div>

      {message && <div className="status success">{message}</div>}
      {error && <div className="status error">{error}</div>}

      {attendanceDraft.length > 0 && <section className="card attendance-review">
        <div className="section-heading"><div><h3>Review attendance</h3><p className="sub">{attendanceFiles} image{attendanceFiles === 1 ? '' : 's'} · correct names or status before saving.</p></div><button className="btn review-save" onClick={() => void saveAttendance()} disabled={savingAttendance || !currentPeriod}>{savingAttendance ? 'Saving...' : 'Save attendance'}</button></div>
        {!currentPeriod && <p className="status info">There is no active timetable period now. Attendance can only be saved during a scheduled period.</p>}
        <div className="attendance-table-wrap"><table className="attendance-table"><thead><tr><th>RRN</th><th>Name</th><th>Status</th></tr></thead><tbody>{attendanceDraft.map((entry, index) => <tr key={`${entry.rrn}-${index}`}><td><input value={entry.rrn} onChange={(event) => updateDraft(index, 'rrn', event.target.value)} /></td><td><input value={entry.name ?? ''} onChange={(event) => updateDraft(index, 'name', event.target.value)} /></td><td><select value={entry.status} onChange={(event) => updateDraft(index, 'status', event.target.value)}><option value="present">Present</option><option value="absent">Absent</option></select></td></tr>)}</tbody></table></div>
      </section>}

      <section className="card timetable-card">
        <div className="section-heading"><div><h3>Timetable</h3><p className="sub">Saved schedule for this section.</p></div>{timetable.length > 0 && <span className="count-pill">{timetable.length} entries</span>}</div>
        {loading ? <p className="empty-state">Loading class data...</p> : timetable.length === 0 ? <p className="empty-state">No timetable saved yet.</p> : <div className="table-wrap"><table className="timetable-table classroom-table"><thead><tr><th>Day</th>{timeSlots.map((slot) => <th key={`${slot.startTime}-${slot.endTime}`}>{formatTime(slot.startTime)}<span>{formatTime(slot.endTime)}</span></th>)}</tr></thead><tbody>{WEEKDAYS.map((day) => { const dayEntries = timetable.filter((entry) => normalizeDay(entry.day) === normalizeDay(day)); const cells = []; let slotIndex = 0; while (slotIndex < timeSlots.length) { const slot = timeSlots[slotIndex]; const entry = dayEntries.find((candidate) => timeToMinutes(candidate.start_time) <= timeToMinutes(slot.startTime) && timeToMinutes(candidate.end_time) > timeToMinutes(slot.startTime)); if (!entry) { cells.push(<td key={`${day}-${slotIndex}`} className="empty-cell" />); slotIndex += 1; continue } const endSlotIndex = timeSlots.findIndex((candidate) => timeToMinutes(candidate.endTime) >= timeToMinutes(entry.end_time)); const span = Math.max(1, endSlotIndex - slotIndex + 1); cells.push(<td key={`${day}-${entry.start_time}-${entry.course_code}`} className="lesson-cell" colSpan={span}><strong>{entry.course_code}</strong><span>{entry.course_name}</span><small>{entry.staff_name}</small></td>); slotIndex += span } return <tr key={day}><th className="day-label">{day.slice(0, 3)}</th>{cells}</tr> })}</tbody></table></div>}
      </section>

      <section className="analytics-section">
        <div className="section-heading"><div><h3>Attendance watch</h3><p className="sub">Scores fall with absences. Red means 3+ absences or below 75%.</p></div></div>
        {students.length === 0 ? <p className="empty-state">No attendance data to score yet.</p> : <div className="analytics-grid">{students.map((student) => <div className={`student-score-card ${student.red_flag ? 'red-flag' : ''}`} key={student.rrn}><div className="student-score-head"><div><strong>{student.name || 'Unnamed student'}</strong><small>{student.rrn}</small></div><b>{student.score}%</b></div><div className="score-track"><span style={{ width: `${student.score}%` }} /></div><p>{student.present} present · {student.absent} absent{student.anomalies > 0 ? ` · ${student.anomalies} bunking alert${student.anomalies === 1 ? '' : 's'}` : ''}</p></div>)}</div>}
      </section>

      <button className="student-history-card" onClick={() => setShowStudents((visible) => !visible)}><span className="upload-icon">ID</span><span><strong>Students and attendance history</strong><small>{students.length} students tracked from the beginning</small></span><b>{showStudents ? '−' : '+'}</b></button>
      {showStudents && <section className="card student-history"><h3>Student history</h3>{students.length === 0 ? <p className="empty-state">No saved attendance records yet.</p> : <div className="attendance-table-wrap"><table className="attendance-table"><thead><tr><th>RRN</th><th>Name</th><th>Attendance history</th></tr></thead><tbody>{students.map((student) => <tr key={student.rrn}><td>{student.rrn}</td><td>{student.name ?? '—'}</td><td>{attendanceLogs.map((log) => { const record = log.records.find((item) => item.rrn === student.rrn); return record ? <span className={`history-mark ${record.status}`} key={`${log.date}-${log.period_start}`}>{log.date} {log.period_start?.slice(0, 5)} {record.status === 'present' ? 'P' : 'A'}</span> : null })}</td></tr>)}</tbody></table></div>}</section>}
    </div>
  )
}
