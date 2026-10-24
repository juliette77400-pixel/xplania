// School offer: same price as one student, multiplied by the number of students.
export const SCHOOL_MIN_STUDENTS = 1;
export const SCHOOL_MAX_STUDENTS = 5000;

/** Keeps the student count a whole number between the allowed bounds. */
export function clampStudents(raw: number): number {
  if (!Number.isFinite(raw)) return SCHOOL_MIN_STUDENTS;
  return Math.min(SCHOOL_MAX_STUDENTS, Math.max(SCHOOL_MIN_STUDENTS, Math.floor(raw)));
}

/** Total paid by the school = student price × students, rounded to the cent. */
export function schoolTotal(studentPrice: number, students: number): number {
  return Math.round(studentPrice * clampStudents(students) * 100) / 100;
}
