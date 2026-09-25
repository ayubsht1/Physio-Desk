import { Patient, Therapist, Appointment, Invoice, User, Dashboard, ClinicService } from "./api";

export interface StoredUser extends User {
  password_hash: string;
}

export function computeAge(dobStr?: string | null): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

const getTodayStr = () => new Date().toISOString().slice(0, 10);
const getDeltaDateStr = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export class ClinicStore {
  users: StoredUser[] = [];
  therapists: Therapist[] = [];
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  invoices: Invoice[] = [];
  services: ClinicService[] = [];
  nextUserId = 10;
  nextPatientId = 20;
  nextTherapistId = 10;
  nextAppointmentId = 20;
  nextInvoiceId = 20;
  nextServiceId = 10;

  constructor() {
    this.seed();
  }

  seed() {
    const today = getTodayStr();
    const yesterday = getDeltaDateStr(-1);
    const tomorrow = getDeltaDateStr(1);
    const dayAfterTomorrow = getDeltaDateStr(2);

    this.users = [
      {
        id: 1,
        username: "admin",
        email: "admin@physiodesk.np",
        full_name: "Dr. Ayush Shrestha, PT",
        role: "admin",
        password_hash: "admin123",
        is_active: true,
        phone: "+977 9851023450",
        created_at: getDeltaDateStr(-90),
        last_login: getTodayStr(),
      },
      {
        id: 2,
        username: "staff",
        email: "reception@physiodesk.np",
        full_name: "Sandeep Thapa",
        role: "staff",
        password_hash: "staff123",
        is_active: true,
        phone: "+977 9841238910",
        created_at: getDeltaDateStr(-60),
        last_login: getTodayStr(),
      },
      {
        id: 3,
        username: "mthapa",
        email: "m.thapa@physiodesk.np",
        full_name: "Dr. Maya Thapa, MPT",
        role: "staff",
        password_hash: "doctor123",
        is_active: true,
        phone: "+977 9801234501",
        created_at: getDeltaDateStr(-45),
        last_login: getDeltaDateStr(-1),
      },
      {
        id: 4,
        username: "bshrestha",
        email: "b.shrestha@physiodesk.np",
        full_name: "Dr. Bikash Shrestha, MPT",
        role: "staff",
        password_hash: "doctor123",
        is_active: true,
        phone: "+977 9841234502",
        created_at: getDeltaDateStr(-30),
        last_login: getDeltaDateStr(-2),
      },
    ];

    this.therapists = [
      {
        id: 1,
        name: "Dr. Maya Thapa, MPT",
        specialty: "Sports Rehab & Musculoskeletal",
        working_days: "Mon,Tue,Wed,Thu,Fri",
        start_time: "09:00",
        end_time: "17:00",
        slot_duration: 30,
        is_active: true,
        notes: "Specialist in athletic recovery, ACL reconstruction protocols, and rotator cuff rehabilitation. NHPC Registered.",
        image: "/images/therapist_maya_chen_1790344875896.jpg",
        nhpc_reg: "NHPC-1421-PT",
      },
      {
        id: 2,
        name: "Dr. Bikash Shrestha, MPT",
        specialty: "Neurological Rehabilitation",
        working_days: "Mon,Tue,Wed,Fri",
        start_time: "08:30",
        end_time: "16:30",
        slot_duration: 45,
        is_active: true,
        notes: "Stroke mobility recovery, vestibular vertigo therapy, and neuromuscular gait retraining.",
        image: "/images/therapist_daniel_brooks_1790344888404.jpg",
        nhpc_reg: "NHPC-1109-PT",
      },
      {
        id: 3,
        name: "Dr. Priya Sharma, MPT",
        specialty: "Posture, Spine & Mobility",
        working_days: "Tue,Wed,Thu,Fri,Sat",
        start_time: "10:00",
        end_time: "18:00",
        slot_duration: 30,
        is_active: true,
        notes: "Ergonomics specialist, cervical decompression, scoliosis alignment, and core pelvic stabilization.",
        image: "/images/therapist_priya_shah_1790344899945.jpg",
        nhpc_reg: "NHPC-1530-PT",
      },
      {
        id: 4,
        name: "Dr. Ritesh Adhikari, BPT",
        specialty: "Manual Therapy & Joint Orthopedics",
        working_days: "Mon,Wed,Fri",
        start_time: "12:00",
        end_time: "18:00",
        slot_duration: 60,
        is_active: true,
        notes: "Myofascial release, joint manipulation, post-arthroplasty knee & hip rehabilitation.",
        nhpc_reg: "NHPC-1845-PT",
      },
    ];

    this.services = [
      {
        id: 1,
        service_id: "sports-rehab",
        name: "Sports Injury & ACL Rehabilitation",
        category: "Sports Rehab",
        duration: "45-60 min",
        price: 1800,
        price_display: "Rs. 1,800",
        description: "Targeted rehabilitation protocol for acute joint sprains, torn ligaments, kinetic chain re-education, and return-to-play testing.",
        indications: "ACL sprain, Meniscus tear, Ankle syndesmosis, Hamstring strain",
        is_active: true,
      },
      {
        id: 2,
        service_id: "spine-posture",
        name: "Spine, Posture & Cervical Decompression",
        category: "Spine & Joint",
        duration: "30-45 min",
        price: 1500,
        price_display: "Rs. 1,500",
        description: "Relief for lumbar disc herniations, ergonomic thoracic stiffness, sciatica flossing, and cervical radiculopathy.",
        indications: "L4-L5 protrusion, Cervical radiculopathy, Postural kyphosis",
        is_active: true,
      },
      {
        id: 3,
        service_id: "neuro-rehab",
        name: "Neurological & Stroke Rehabilitation",
        category: "Neurological",
        duration: "45 min",
        price: 2000,
        price_display: "Rs. 2,000",
        description: "Gait retraining, proprioception re-education, vestibular vertigo therapy, and post-stroke functional recovery.",
        indications: "Stroke hemiparesis, Vestibular BPPV, Parkinson gait instability",
        is_active: true,
      },
      {
        id: 4,
        service_id: "joint-manual",
        name: "Manual Therapy & Joint Mobilization",
        category: "Manual Therapy",
        duration: "60 min",
        price: 2200,
        price_display: "Rs. 2,200",
        description: "Hands-on Maitland and Mulligan joint mobilization, deep myofascial trigger point therapy, and kinetic release.",
        indications: "Frozen shoulder, Adhesive capsulitis, Facet joint lock, Hip osteoarthritis",
        is_active: true,
      },
      {
        id: 5,
        service_id: "general-eval",
        name: "Comprehensive Initial Physical Assessment",
        category: "Evaluation",
        duration: "45 min",
        price: 1200,
        price_display: "Rs. 1,200",
        description: "Full functional movement screening, posture photographic review, digital goniometry, and personalized care roadmap.",
        indications: "New patients, Pre-participation sports screen, Second opinion",
        is_active: true,
      },
      {
        id: 6,
        service_id: "post-op",
        name: "Post-Surgical Knee & Hip Rehabilitation",
        category: "Orthopedics",
        duration: "60 min",
        price: 2500,
        price_display: "Rs. 2,500",
        description: "Post-total knee arthroplasty (TKR), hip replacement, and arthroscopy staged recovery protocol with cryotherapy.",
        indications: "TKR, Total Hip Arthroplasty, Rotator Cuff Repair post-op",
        is_active: true,
      },
      {
        id: 7,
        service_id: "ergonomic-reset",
        name: "Ergonomic Alignment & Tech-Neck Therapy",
        category: "Preventive",
        duration: "30 min",
        price: 1400,
        price_display: "Rs. 1,400",
        description: "Targeted muscular reset for software engineers and desk professionals suffering from forward head posture and upper crossed syndrome.",
        indications: "Cervicogenic headaches, Thoracic outlet strain, Repetitive strain injury",
        is_active: true,
      },
    ];

    const rawPatients = [
      {
        id: 1,
        first_name: "Sunita",
        last_name: "Gurung",
        date_of_birth: "1994-04-12",
        gender: "Female",
        phone: "+977 9841234567",
        email: "sunita.gurung@gmail.com",
        address: "Jhamsikhel-3, Lalitpur, Nepal",
        blood_group: "O+",
        allergies: "Penicillin",
        medical_notes: "Grade II ACL sprain with mild medial meniscus strain from badminton. Responding well to quadriceps neuromuscular re-education.",
        assigned_therapist_id: 1,
        condition: "Acute grade II ACL sprain",
        package: "Sports Injury Rehab (10 Sessions)",
        status: "Active" as const,
        created_at: getDeltaDateStr(-14),
        is_active: true,
      },
      {
        id: 2,
        first_name: "Roshan",
        last_name: "Karki",
        date_of_birth: "1981-11-20",
        gender: "Male",
        phone: "+977 9801234568",
        email: "roshan.karki@hotmail.com",
        address: "New Baneshwor, Kathmandu, Nepal",
        blood_group: "A+",
        allergies: "None reported",
        medical_notes: "Chronic L4-L5 disc protrusion with radicular ache. Completed core stabilization and McKenzie extension protocol.",
        assigned_therapist_id: 2,
        condition: "Chronic L4-L5 herniation",
        package: "Spine & Core Recovery",
        status: "Completed" as const,
        created_at: getDeltaDateStr(-40),
        is_active: true,
      },
      {
        id: 3,
        first_name: "Anjali",
        last_name: "Maharjan",
        date_of_birth: "1989-07-03",
        gender: "Female",
        phone: "+977 9851023456",
        email: "anjali.maharjan@yahoo.com",
        address: "Patan Dhoka, Lalitpur, Nepal",
        blood_group: "B+",
        allergies: "Latex",
        medical_notes: "Supraspinatus tendinopathy with subacromial impingement. Working on scapular upward rotation and isometric cuff conditioning.",
        assigned_therapist_id: 3,
        condition: "Right rotator cuff tendinitis",
        package: "Upper Extremity Care",
        status: "Active" as const,
        created_at: getDeltaDateStr(-10),
        is_active: true,
      },
      {
        id: 4,
        first_name: "Dipendra",
        last_name: "Poudel",
        date_of_birth: "1972-03-15",
        gender: "Male",
        phone: "+977 9860123456",
        email: "dipendra.poudel@gmail.com",
        address: "Maharajgunj-4, Kathmandu, Nepal",
        blood_group: "AB-",
        allergies: "NSAIDs (Ibuprofen)",
        medical_notes: "Bilateral acetabular labral tear. On temporary pause awaiting MRI review with orthopedic surgeon at Teaching Hospital.",
        assigned_therapist_id: 1,
        condition: "Bilateral hip labral tear",
        package: "Joint Preservation",
        status: "On hold" as const,
        created_at: getDeltaDateStr(-25),
        is_active: true,
      },
      {
        id: 5,
        first_name: "Laxmi",
        last_name: "Shrestha",
        date_of_birth: "1961-09-28",
        gender: "Female",
        phone: "+977 9849876543",
        email: "laxmi.shrestha@gmail.com",
        address: "Lazimpat, Kathmandu, Nepal",
        blood_group: "O-",
        allergies: "Codeine",
        medical_notes: "Left total knee arthroplasty week 5 post-op. Active knee flexion achieved at 112 degrees. Gait training progressing to single cane.",
        assigned_therapist_id: 4,
        condition: "Post-total knee arthroplasty",
        package: "Post-Op Mobility (12 Sessions)",
        status: "Active" as const,
        created_at: getDeltaDateStr(-20),
        is_active: true,
      },
      {
        id: 6,
        first_name: "Pradeep",
        last_name: "Basnet",
        date_of_birth: "1996-02-14",
        gender: "Male",
        phone: "+977 9813245678",
        email: "pradeep.basnet@outlook.com",
        address: "Koteshwor-32, Kathmandu, Nepal",
        blood_group: "A-",
        allergies: "None",
        medical_notes: "High ankle syndesmosis sprain. Proprioception retraining on balance board, plyometrics scheduled for next stage.",
        assigned_therapist_id: 2,
        condition: "High ankle syndesmosis sprain",
        package: "Return to Sport",
        status: "Active" as const,
        created_at: getDeltaDateStr(-16),
        is_active: true,
      },
      {
        id: 7,
        first_name: "Samikshya",
        last_name: "Tamang",
        date_of_birth: "1990-12-05",
        gender: "Female",
        phone: "+977 9841987654",
        email: "samikshya.tamang@gmail.com",
        address: "Thamel, Kathmandu, Nepal",
        blood_group: "O+",
        allergies: "Sulfa drugs",
        medical_notes: "Tech-related thoracic kyphosis and postural headaches. Completed posture reset module with sustained relief.",
        assigned_therapist_id: 3,
        condition: "Postural kyphosis & thoracic stiffness",
        package: "Ergonomic Alignment",
        status: "Completed" as const,
        created_at: getDeltaDateStr(-45),
        is_active: true,
      },
      {
        id: 8,
        first_name: "Ramesh",
        last_name: "Acharya",
        date_of_birth: "1965-05-18",
        gender: "Male",
        phone: "+977 9851123789",
        email: "ramesh.acharya@gmail.com",
        address: "Sanepa-2, Lalitpur, Nepal",
        blood_group: "B-",
        allergies: "Pollen, dust mites",
        medical_notes: "C6 cervical radiculopathy with radiating paresthesia to thumb. Mechanical cervical traction and neural flossing applied.",
        assigned_therapist_id: 4,
        condition: "Cervical radiculopathy (C6)",
        package: "Cervical Decompression",
        status: "Active" as const,
        created_at: getDeltaDateStr(-6),
        is_active: true,
      },
    ];

    this.patients = rawPatients.map((p) => {
      const therapist = this.therapists.find((t) => t.id === p.assigned_therapist_id);
      return {
        ...p,
        name: `${p.first_name} ${p.last_name}`.trim(),
        age: computeAge(p.date_of_birth),
        therapist_name: therapist ? therapist.name : null,
      };
    });

    this.appointments = [
      {
        id: 1,
        patient_id: 1,
        therapist_id: 1,
        appointment_date: today,
        start_time: "09:00",
        end_time: "09:30",
        status: "Completed",
        payment_method: "Fonepay / QR",
        service: "Sports Injury & ACL Rehabilitation",
        notes: "ACL Rehab Session 4. Quadriceps activation high. Cryotherapy applied.",
        patient_name: "Sunita Gurung",
        therapist_name: "Dr. Maya Thapa, MPT",
        created_at: getDeltaDateStr(-5),
      },
      {
        id: 2,
        patient_id: 3,
        therapist_id: 3,
        appointment_date: today,
        start_time: "10:00",
        end_time: "10:30",
        status: "Booked",
        payment_method: "eSewa",
        service: "Spine, Posture & Cervical Decompression",
        notes: "Rotator cuff ultrasound & mobility mobilization.",
        patient_name: "Anjali Maharjan",
        therapist_name: "Dr. Priya Sharma, MPT",
        created_at: getDeltaDateStr(-3),
      },
      {
        id: 3,
        patient_id: 5,
        therapist_id: 4,
        appointment_date: today,
        start_time: "12:00",
        end_time: "13:00",
        status: "Booked",
        payment_method: "Khalti",
        service: "Post-Surgical Knee & Hip Rehabilitation",
        notes: "Knee post-op mobilization. Target: 115 deg flexion milestone.",
        patient_name: "Laxmi Shrestha",
        therapist_name: "Dr. Ritesh Adhikari, BPT",
        created_at: getDeltaDateStr(-2),
      },
      {
        id: 4,
        patient_id: 6,
        therapist_id: 2,
        appointment_date: today,
        start_time: "14:00",
        end_time: "14:45",
        status: "Booked",
        payment_method: "Cash",
        service: "Neurological & Stroke Rehabilitation",
        notes: "Ankle proprioception & dynamic taping.",
        patient_name: "Pradeep Basnet",
        therapist_name: "Dr. Bikash Shrestha, MPT",
        created_at: getDeltaDateStr(-2),
      },
      {
        id: 5,
        patient_id: 8,
        therapist_id: 4,
        appointment_date: tomorrow,
        start_time: "13:00",
        end_time: "14:00",
        status: "Booked",
        payment_method: "Fonepay / QR",
        service: "Manual Therapy & Joint Mobilization",
        notes: "Cervical traction follow-up session.",
        patient_name: "Ramesh Acharya",
        therapist_name: "Dr. Ritesh Adhikari, BPT",
        created_at: getDeltaDateStr(-1),
      },
      {
        id: 6,
        patient_id: 2,
        therapist_id: 2,
        appointment_date: yesterday,
        start_time: "11:00",
        end_time: "11:45",
        status: "Completed",
        payment_method: "Card",
        service: "Spine, Posture & Cervical Decompression",
        notes: "Final lumbar discharge evaluation with home exercise pack.",
        patient_name: "Roshan Karki",
        therapist_name: "Dr. Bikash Shrestha, MPT",
        created_at: getDeltaDateStr(-7),
      },
      {
        id: 7,
        patient_id: 1,
        therapist_id: 1,
        appointment_date: dayAfterTomorrow,
        start_time: "09:30",
        end_time: "10:00",
        status: "Booked",
        payment_method: "Fonepay / QR",
        service: "Sports Injury & ACL Rehabilitation",
        notes: "ACL Rehab Session 5. Single-leg balance and kinetic chain loading.",
        patient_name: "Sunita Gurung",
        therapist_name: "Dr. Maya Thapa, MPT",
        created_at: getDeltaDateStr(-1),
      },
    ];

    this.invoices = [
      {
        id: 1,
        patient_id: 1,
        service: "Sports Injury & ACL Rehabilitation",
        invoice_date: today,
        amount: 1800,
        discount: 200,
        status: "Paid",
        payment_method: "Fonepay / QR",
        notes: "Sports rehab session with cryotherapy and K-taping.",
        patient_name: "Sunita Gurung",
      },
      {
        id: 2,
        patient_id: 3,
        service: "Spine, Posture & Cervical Decompression",
        invoice_date: today,
        amount: 1500,
        discount: 0,
        status: "Due",
        payment_method: "eSewa",
        notes: "Ultrasound & mobility therapy.",
        patient_name: "Anjali Maharjan",
      },
      {
        id: 3,
        patient_id: 5,
        service: "Post-Surgical Knee & Hip Rehabilitation",
        invoice_date: today,
        amount: 2500,
        discount: 300,
        status: "Paid",
        payment_method: "Khalti",
        notes: "Neuromuscular stimulation and passive CPM mobilization.",
        patient_name: "Laxmi Shrestha",
      },
      {
        id: 4,
        patient_id: 2,
        service: "Final Clinical Assessment & Discharge Protocol",
        invoice_date: yesterday,
        amount: 2000,
        discount: 200,
        status: "Paid",
        payment_method: "Card",
        notes: "Discharged with home McKenzie exercises.",
        patient_name: "Roshan Karki",
      },
      {
        id: 5,
        patient_id: 6,
        service: "Neurological & Gait Rehabilitation",
        invoice_date: yesterday,
        amount: 2000,
        discount: 0,
        status: "Due",
        payment_method: "Cash",
        notes: "Therapeutic balance retraining supply.",
        patient_name: "Pradeep Basnet",
      },
    ];
  }

  getDashboard(): Dashboard {
    const today = getTodayStr();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayDay = dayNames[new Date().getDay()];

    const patientsSeenToday = this.appointments.filter(
      (a) => a.appointment_date === today && a.status === "Completed"
    ).length;

    const activeTherapists = this.therapists.filter((t) => t.is_active);
    const therapistsOnDuty = activeTherapists.filter((t) =>
      t.working_days.split(",").map((s) => s.trim()).includes(todayDay)
    );

    const revenueCollectedToday = this.invoices
      .filter((i) => i.invoice_date === today && i.status === "Paid")
      .reduce((sum, i) => sum + (i.amount - i.discount), 0);

    let totalSlots = 0;
    const capacityList: { therapist_name: string; specialty: string; booked: number; free: number }[] = [];

    const dayAppointments = this.appointments.filter(
      (a) => a.appointment_date === today && a.status !== "Cancelled"
    );

    for (const t of activeTherapists) {
      const worksToday = t.working_days.split(",").map((s) => s.trim()).includes(todayDay);
      if (!worksToday) continue;

      const [startH, startM] = t.start_time.split(":").map(Number);
      const [endH, endM] = t.end_time.split(":").map(Number);
      const minutes = (endH * 60 + endM) - (startH * 60 + startM);
      const slots = Math.max(Math.floor(minutes / (t.slot_duration || 30)), 1);
      totalSlots += slots;

      const booked = dayAppointments.filter((a) => a.therapist_id === t.id).length;
      capacityList.push({
        therapist_name: t.name,
        specialty: t.specialty,
        booked,
        free: Math.max(slots - booked, 0),
      });
    }

    const openSlots = Math.max(totalSlots - dayAppointments.length, 0);

    return {
      patients_seen_today: patientsSeenToday,
      therapists_on_duty_today: therapistsOnDuty.length,
      revenue_collected_today: revenueCollectedToday,
      open_slots_remaining_today: openSlots,
      recent_patients: this.patients.filter((p) => p.is_active).slice(0, 5),
      therapist_capacity:
        capacityList.length > 0
          ? capacityList
          : activeTherapists.map((t) => ({
              therapist_name: t.name,
              specialty: t.specialty,
              booked: 0,
              free: 8,
            })),
    };
  }
}

declare global {
  var __clinicStore: ClinicStore | undefined;
}

export const getStore = (): ClinicStore => {
  if (!globalThis.__clinicStore) {
    globalThis.__clinicStore = new ClinicStore();
  }
  return globalThis.__clinicStore;
};
