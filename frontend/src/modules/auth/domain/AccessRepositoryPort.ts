import { AccessProfile } from './AccessProfile';

export interface AccessRepositoryPort {
  obtenerMiAcceso(): Promise<AccessProfile>;
}
