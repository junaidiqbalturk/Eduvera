export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: any;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface AcademicYear {
  id: number;
  year: string;
  title: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  status: string;
}

export interface ClassAssignedSubject {
  id: number;
  code: string;
  name: string;
  department: string;
  credits: number;
  type: string;
  teacher_name?: string | null;
  periods_per_week?: number;
  is_compulsory?: boolean;
}

export interface SchoolClass {
  id: number;
  name: string;
  numeric_grade: number;
  sections: string[];
  student_count: number;
  class_teacher: string;
  capacity?: number;
  subjects_count?: number;
  subjects?: ClassAssignedSubject[];
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  department: string;
  classes?: Array<{ id: number; name: string }>;
}

export interface Student {
  id: number;
  admission_no: string;
  first_name: string;
  last_name: string;
  gender: string;
  class: string;
  class_name?: string;
  section: string;
  roll_no: string;
  dob: string;
  guardian_name: string;
  guardian_relation?: string;
  guardian_phone: string;
  guardian_email?: string;
  status: string;
  avatar?: string;
  blood_group?: string;
  address?: string;
  admission_date?: string;
  emergency_contact?: string;
}

export interface Staff {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  qualification: string;
  joining_date: string;
  status: string;
  avatar?: string;
}

export interface AttendanceSummary {
  date: string;
  class_name: string;
  total_students: number;
  total_marked: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  excused_leave: number;
  attendance_rate: string;
  staff_summary: {
    total: number;
    present: number;
    absent: number;
  };
  pending_leaves_count: number;
  chronic_absentees_count: number;
  weekly_trend: Array<{
    day: string;
    date: string;
    present: number;
    absent: number;
    is_weekend: boolean;
  }>;
  summary?: {
    total_students: number;
    present: number;
    absent: number;
    late: number;
    attendance_percentage: string;
  };
  records?: Array<{
    student_id: number;
    name: string;
    roll_no: string;
    status: string;
    time_in: string;
  }>;
}

export interface StudentSheetRecord {
  student_id: number;
  name: string;
  roll_no: string;
  class_name: string;
  section: string;
  guardian_name: string;
  guardian_phone: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Excused Leave' | 'Suspended';
  arrival_time: string | null;
  minutes_late: number;
  half_day_session: 'Morning' | 'Afternoon' | null;
  remarks: string;
  is_leave_locked: boolean;
  leave_reason: string | null;
  is_already_marked: boolean;
}

export interface AttendanceSheetData {
  date: string;
  class_name: string;
  section: string;
  is_future: boolean;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_title: string | null;
  holiday_type: string | null;
  roster: StudentSheetRecord[];
}

export interface AttendanceMatrixDayMeta {
  day: number;
  date: string;
  day_name: string;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_title: string | null;
}

export interface AttendanceMatrixStudent {
  student_id: number;
  name: string;
  roll_no: string;
  daily_statuses: Record<number, {
    code: string; // 'P' | 'A' | 'L' | 'H' | 'E' | 'S' | 'W' | 'HD' | '-'
    is_weekend: boolean;
    is_holiday: boolean;
  }>;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  attendance_pct: string;
  is_chronic: boolean;
}

export interface AttendanceMatrixData {
  month: number;
  month_name: string;
  year: number;
  class_name: string;
  section: string;
  total_school_days: number;
  days_meta: AttendanceMatrixDayMeta[];
  students: AttendanceMatrixStudent[];
}

export interface ChronicAbsentee {
  student_id: number;
  name: string;
  roll_no: string;
  class_name: string;
  section: string;
  guardian_name: string;
  guardian_phone: string;
  attendance_rate: string;
  consecutive_absent_days: number;
  total_days_evaluated: number;
  severity: 'Critical' | 'Warning';
  reasons: string[];
}

export interface StaffAttendanceRecord {
  staff_id: number;
  name: string;
  employee_id: string;
  department: string;
  role: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Excused Leave' | 'On Duty';
  punch_in: string | null;
  punch_out: string | null;
  work_hours: number;
  remarks: string;
  is_leave_locked: boolean;
}

export interface StaffAttendanceSheetData {
  date: string;
  department: string;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_title: string | null;
  roster: StaffAttendanceRecord[];
}

export interface LeaveRequestItem {
  id: number;
  applicant_type: 'Student' | 'Staff';
  applicant_id: number;
  applicant_name: string;
  identifier: string;
  class_or_department: string;
  start_date: string;
  end_date: string;
  raw_start: string;
  raw_end: string;
  days_count: number;
  leave_type: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by_name: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface HolidayItem {
  id: number;
  title: string;
  date: string;
  type: string;
  description: string | null;
  academic_year: string;
}

export interface Exam {
  id: number;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface MarksEntryRow {
  student_id: number;
  student_name: string;
  student_roll: string;
  marks_obtained: number;
  max_marks: number;
  grade: string;
  gpa_point: number;
  remarks?: string;
  is_graded?: boolean;
}

export interface MarksEntrySheetData {
  exam: {
    id: number;
    name: string;
    academic_year: string;
    status: string;
  };
  class_name: string;
  section: string;
  subject_code: string;
  subject_name: string;
  max_marks_default: number;
  roster: MarksEntryRow[];
}

export interface GradingScaleRule {
  grade: string;
  min_percentage: number;
  max_percentage: number;
  gpa_point?: number;
  label?: string;
  is_pass?: boolean;
}

export interface GradingSystemConfig {
  system: 'percentage' | 'gpa';
  scales: GradingScaleRule[];
}

export interface Marksheet {
  student_id: number;
  student_name: string;
  roll_no: string;
  class: string;
  exam_name: string;
  gpa: number;
  percentage?: number;
  overall_grade: string;
  grade_label?: string;
  is_pass?: boolean;
  system_type?: 'percentage' | 'gpa';
  total_marks: number;
  max_marks: number;
  subjects: Array<{
    subject_code: string;
    subject: string;
    marks_obtained: number;
    max_marks: number;
    percentage?: number;
    grade: string;
    gpa_point: number;
  }>;
}

export interface FeeInvoice {
  id: number | string;
  invoice_number?: string;
  student_name: string;
  student_roll?: string;
  student_email?: string;
  student_phone?: string;
  class: string;
  academic_year?: string;
  fee_group: string;
  subtotal?: number;
  discount_amount?: number;
  amount: number;
  paid_amount: number;
  balance_amount?: number;
  due_date: string;
  due_date_formatted?: string;
  is_overdue?: boolean;
  days_overdue?: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' | 'Cancelled' | string;
  payment_method?: string;
  items_count?: number;
  payments_count?: number;
}

export interface FeeSummary {
  total_invoiced: number;
  total_collected: number;
  total_pending: number;
  overdue_count: number;
  collection_rate: string;
  recent_transactions: Array<{
    tx_id: string;
    receipt_number: string;
    student: string;
    class: string;
    amount: string;
    method: string;
    date: string;
    status: string;
  }>;
}

export interface FeeCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface FeeStructure {
  id: number;
  fee_category_id: number;
  name: string;
  class_name: string;
  amount: number;
  frequency: string;
  academic_year: string;
  category?: FeeCategory;
}

export interface FeePaymentTransaction {
  id: number;
  payment_number: string;
  receipt_number: string;
  invoice_number: string;
  student_name: string;
  student_roll: string;
  class_name: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  transaction_reference: string;
  collected_by: string;
  notes?: string;
  created_at: string;
}

export interface FeeDefaulter {
  invoice_id: number;
  invoice_number: string;
  student_name: string;
  student_roll: string;
  class_name: string;
  student_phone: string;
  student_email: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  due_date: string;
  days_overdue: number;
  status: string;
}

export interface FeeReceiptData {
  institution: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    tax_id: string;
    logo?: string | null;
  };
  receipt: {
    receipt_number: string;
    payment_number: string;
    date: string;
    payment_method: string;
    transaction_reference: string;
    collected_by: string;
    notes: string;
  };
  student: {
    name: string;
    roll_number: string;
    class: string;
    academic_year: string;
    email?: string;
    phone?: string;
  };
  invoice: {
    invoice_number: string;
    due_date: string;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    amount_paid_this_txn: number;
    cumulative_paid: number;
    remaining_balance: number;
    status: string;
    items: Array<{
      category: string;
      description?: string;
      amount: number;
    }>;
  };
}

export interface FeeVoucherData {
  institution: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    tax_id: string;
    logo?: string | null;
  };
  bank_details: {
    bank_name: string;
    account_name: string;
    account_number: string;
    routing_swift: string;
    branch: string;
  };
  voucher: {
    voucher_number: string;
    issue_date: string;
    due_date: string;
    is_overdue: boolean;
    status: string;
    academic_year: string;
    notes: string;
  };
  student: {
    name: string;
    roll_number: string;
    class: string;
    email: string;
    phone: string;
  };
  financials: {
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    items: Array<{
      category: string;
      description?: string;
      amount: number;
    }>;
    payments: Array<{
      payment_number: string;
      receipt_number: string;
      amount_paid: number;
      payment_method: string;
      payment_date: string;
      transaction_reference?: string;
    }>;
  };
}

export interface Notice {
  id: number;
  title: string;
  category: string;
  posted_by: string;
  date: string;
  target_audience: string;
  content: string;
  is_urgent: boolean;
  expiry_date?: string | null;
}

export interface DashboardOverview {
  metrics: {
    total_students: number;
    total_teachers: number;
    total_classes: number;
    attendance_today_rate: string;
    monthly_fee_collected: string;
    pending_invoices: number;
  };
  recent_activities: Array<{
    id: number;
    text: string;
    time: string;
    type: string;
  }>;
  attendance_chart: {
    labels: string[];
    present: number[];
    absent: number[];
  };
}
