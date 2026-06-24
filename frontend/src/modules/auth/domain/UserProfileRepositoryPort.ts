import { UserProfile } from './UserProfile';
import { ProfilePhoto } from './ProfilePhoto';

export interface UserProfileRepositoryPort {
  obtenerPerfil(): Promise<UserProfile>;
  cambiarClave(nuevaClave: string, claveActual?: string): Promise<void>;
  subirFoto(foto: ProfilePhoto): Promise<string>;
}
