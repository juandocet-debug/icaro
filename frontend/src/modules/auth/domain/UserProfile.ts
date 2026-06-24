export interface UserProfile {
  id: string;
  userId: number;
  username: string;
  email: string;
  cedula: string | null;
  telefono: string | null;
  cargo: string | null;
  organizacionId: string | null;
  isStaff: boolean;
  mustChangePassword: boolean;
  photoUrl: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
}
