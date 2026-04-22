
export interface Question {
  question: string;
  options: [string, string, string, string];
  correct: 'A' | 'B' | 'C' | 'D';
}

export interface Exam {
  id: string;
  title: string;
  class: string;
  timerMinutes: number;
  questions: Question[];
  createdAt: string;
}

export interface Result {
  id: string;
  studentName: string;
  studentPhone: string;
  studentClass: string;
  examTitle: string;
  examId: string;
  score: number;
  total: number;
  percentage: number;
  answers: (string | null)[];
  timestamp: string;
}

export interface Notification {
  id: string;
  studentName: string;
  studentClass: string;
  examTitle: string;
  score: number;
  total: number;
  percentage: number;
  timestamp: string;
  read: boolean;
}

export interface Student {
  name: string;
  phone: string;
  class: string;
}

export const storage = {
  getExams(): Exam[] {
    try {
      return JSON.parse(localStorage.getItem('exams') || '[]');
    } catch { return []; }
  },
  saveExams(exams: Exam[]) {
    localStorage.setItem('exams', JSON.stringify(exams));
  },
  addExam(exam: Exam) {
    const exams = this.getExams();
    exams.push(exam);
    this.saveExams(exams);
  },
  getExamById(id: string): Exam | null {
    return this.getExams().find(e => e.id === id) || null;
  },

  getResults(): Result[] {
    try {
      return JSON.parse(localStorage.getItem('results') || '[]');
    } catch { return []; }
  },
  addResult(result: Result) {
    const results = this.getResults();
    results.push(result);
    localStorage.setItem('results', JSON.stringify(results));
  },
  getResultsForStudent(studentName: string, studentPhone: string): Result[] {
    return this.getResults().filter(
      r => r.studentName === studentName && r.studentPhone === studentPhone
    );
  },

  getNotifications(): Notification[] {
    try {
      return JSON.parse(localStorage.getItem('notifications') || '[]');
    } catch { return []; }
  },
  addNotification(notification: Notification) {
    const notifs = this.getNotifications();
    notifs.unshift(notification);
    localStorage.setItem('notifications', JSON.stringify(notifs));
  },
  markAllNotificationsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(notifs));
  },
  getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  },

  getCurrentStudent(): Student | null {
    try {
      const s = localStorage.getItem('currentStudent');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },
  setCurrentStudent(student: Student) {
    localStorage.setItem('currentStudent', JSON.stringify(student));
    localStorage.setItem('studentLoggedIn', 'true');
  },
  logoutStudent() {
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('studentLoggedIn');
  },

  isTeacherLoggedIn(): boolean {
    return localStorage.getItem('teacherLoggedIn') === 'true';
  },
  loginTeacher() {
    localStorage.setItem('teacherLoggedIn', 'true');
  },
  logoutTeacher() {
    localStorage.removeItem('teacherLoggedIn');
  },

  isStudentLoggedIn(): boolean {
    return localStorage.getItem('studentLoggedIn') === 'true';
  },

  getLastResult(): Result | null {
    try {
      const r = localStorage.getItem('lastResult');
      return r ? JSON.parse(r) : null;
    } catch { return null; }
  },
  setLastResult(result: Result) {
    localStorage.setItem('lastResult', JSON.stringify(result));
  },

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};
