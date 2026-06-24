import { UserProfileRepositoryPort } from '../domain/UserProfileRepositoryPort';
import { UserProfile } from '../domain/UserProfile';
import { ProfilePhoto } from '../domain/ProfilePhoto';
import { api } from '../../../services/api';
import { SecureTokenStorage } from './SecureTokenStorage';
import { Platform } from 'react-native';

export class AxiosPerfilRepository implements UserProfileRepositoryPort {
  async obtenerPerfil(): Promise<UserProfile> {
    const res = await api.get<{
      ok: boolean;
      datos: {
        id: string; user_id: number; username: string; email: string;
        cedula: string | null; telefono: string | null; cargo: string | null;
        organizacion_id: string | null; is_staff: boolean;
        must_change_password: boolean; photo_url: string | null;
      };
    }>('/api/auth/perfil/');
    const d = res.data.datos;
    return {
      id: d.id, userId: d.user_id, username: d.username, email: d.email,
      cedula: d.cedula, telefono: d.telefono, cargo: d.cargo,
      organizacionId: d.organizacion_id, isStaff: d.is_staff,
      mustChangePassword: d.must_change_password, photoUrl: d.photo_url,
    };
  }

  async cambiarClave(nuevaClave: string, claveActual?: string): Promise<void> {
    const res = await api.post<{
      ok: boolean;
      mensaje: string;
      access?: string;
      refresh?: string;
    }>('/api/auth/cambiar-clave/', {
      nueva_clave: nuevaClave,
      clave_actual: claveActual,
    });
    // set_password() invalida el JWT anterior. El backend devuelve tokens nuevos;
    // los guardamos antes de llamar a obtenerPerfil() para no recibir 401.
    if (res.data.access && res.data.refresh) {
      await SecureTokenStorage.saveTokens(res.data.access, res.data.refresh);
    }
  }

  async subirFoto(foto: ProfilePhoto): Promise<string> {
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      // Descargar el blob local y adjuntarlo como binario
      const resBlob = await fetch(foto.uri);
      const blob = await resBlob.blob();
      formData.append('foto', blob, foto.name);
    } else {
      formData.append('foto', {
        uri: foto.uri,
        name: foto.name,
        type: foto.mimeType,
      } as any);
    }

    const res = await api.patch<{ ok: boolean; photo_url: string }>(
      '/api/auth/perfil/foto/',
      formData,
      {
        // En web, dejamos que Axios y el navegador pongan el boundary correcto
        headers: Platform.OS === 'web' ? {} : {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.photo_url;
  }
}
