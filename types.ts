

export interface Employee {
  id: string;
  name: string;
  matricula: string;
  assDss: boolean;
  bem: boolean;
  mal: boolean;
  ausente: boolean;
  time: string | null;
  turno: string;
  senha?: string;
}

export interface Administrator {
  id:string;
  name: string;
  matricula: string;
  email: string;
  senha?: string;
  nivel?: string;
}

export interface ManualRegistration {
  id: string;
  matricula: string;
  name?: string; // Added to persist the responsible person's name
  assunto: string;
  TURNO: string;
}

export type StatusType = 'assDss' | 'bem' | 'mal' | 'ausente';

export type HistoryStatus = 'BEM' | 'MAL' | 'AUS' | 'PEN';

export interface HistoryEmployee {
  m: string;      // matrícula
  n: string;      // nome
  s: HistoryStatus; // status compacto
  t: string | null; // horário
  turno: string;    // 7H ou 6H
}

export interface HistoryRegistro {
  assunto: string;
  matricula: string;
  name: string;
}

export interface HistoryRecord {
  data: string;           // data formatada (DD/MM/YYYY)
  dataISO: string;        // data ISO (YYYY-MM-DD)
  turma: string;
  registros7H: HistoryRegistro[];
  registros6H: HistoryRegistro[];
  r: HistoryEmployee[];   // array de funcionários compactados
  totalFuncionarios: number;
  totalPresentes: number;
  totalAusentes: number;
  totalMal: number;
  totalPendentes: number;
}

export interface AuditAction {
    action: string;
    details: string;
    timestamp: string;
    turma: string;
}

export interface AuditRecord {
    id: string; // The email of the admin
    ultimo_acesso: string;
    acoes: AuditAction[];
}

export enum ModalType {
  None,
  AdminLogin,
  AdminOptions,
  AddUser,
  Report,
  ConfirmMal, // Existing safety confirmation
  ConfirmTurno, // Added for Turno confirmation
  ConfirmAusente, // Added for Ausente confirmation
  ConfirmDelete, // Added for Delete confirmation
  InvalidMatricula, // Added for 8-digit validation warning
  Tutorial,
  TutorialChoice,      // Novo: Escolha entre tour ou vídeo
  TutorialVideo,       // Novo: Visualização do vídeo aula
  ImportEmployee,
  UserExistsWarning,
  ConfirmDeactivate6H,
  HistoryView,
  ConfirmBiometric,
  SignaturePassword,
  AdminPassword,
  ManageAdmins,
  AddAdmin,
  EditAdmin,
  AuditLog,
}

export interface PdfReportData {
  turma: string;
  dataFormatada: string;
  totalFuncionarios: number;
  totalPresentes: number;
  totalPendentes: number;
  totalAusentes: number;
  totalMal: number;
  employees: {
      n: string;
      m: string;
      s: string;
      turno: string;
  }[];
  registros7H: {
      assunto: string;
      name: string;
      matricula: string;
  }[];
  registros6H: {
      assunto: string;
      name: string;
      matricula: string;
  }[];
  mainShiftLabel: string;
  shiftLabel: string;
  is6HActive?: boolean;
}