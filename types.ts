

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
  DemoPassword,
  ImportEmployee,
}