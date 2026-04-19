

export interface Employee {
  id: string;
  name: string;
  matricula: string;
  assDss: boolean;
  bem: boolean;
  mal: boolean;
  absent: boolean;
  time: string | null;
  turno: string;
}

export interface Administrator {
  id:string;
  name: string;
  matricula: string;
  email: string;
}

export interface ManualRegistration {
  id: string;
  matricula: string;
  name?: string; // Added to persist the responsible person's name
  assunto: string;
  TURNO: string;
}

export type StatusType = 'assDss' | 'bem' | 'mal' | 'absent';

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

export enum ModalType {
  None,
  AdminLogin,
  AdminOptions,
  AddUser,
  Report,
  ConfirmMal, // Existing safety confirmation
  ConfirmTurno, // Added for Turno confirmation
  ConfirmAbsent, // Added for Absent confirmation
  ConfirmDelete, // Added for Delete confirmation
  InvalidMatricula, // Added for 8-digit validation warning
  Tutorial,
  TutorialChoice,      // Novo: Escolha entre tour ou vídeo
  TutorialVideo,       // Novo: Visualização do vídeo aula
  DemoPassword,
  ImportEmployee,
  UserExistsWarning,
  ConfirmDeactivate6H,
  HistoryView,
  AutomationPassword,
}