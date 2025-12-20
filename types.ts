
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
  id: string;
  name: string;
  matricula: string;
  email: string;
}

export interface ManualRegistration {
  id: string;
  matricula: string;
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
  Tutorial, 
}