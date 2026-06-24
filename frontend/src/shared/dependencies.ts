import { AxiosRolRepository } from '../modules/seguridad/infrastructure/AxiosRolRepository';
import { AxiosUploadRepository } from '../modules/uploads/infrastructure/AxiosUploadRepository';
import { SubirEvidenciaUseCase } from '../modules/uploads/application/SubirEvidenciaUseCase';
import { AxiosProyectoMiembroRepository } from '../modules/proyectos/infrastructure/AxiosProyectoMiembroRepository';
import { AxiosUsuariosRepository } from '../modules/auth/infrastructure/AxiosUsuariosRepository';
import { AxiosAccessRepository } from '../modules/auth/infrastructure/AxiosAccessRepository';
import { AxiosProyectoRepository } from '../modules/proyectos/infrastructure/AxiosProyectoRepository';
import { AxiosMetaRepository } from '../modules/proyectos/infrastructure/AxiosMetaRepository';
import { AxiosAuthRepository } from '../modules/auth/infrastructure/AxiosAuthRepository';
import { AxiosPerfilRepository } from '../modules/auth/infrastructure/AxiosPerfilRepository';
import { AxiosTipoDocumentoRepository } from '../modules/proyectos/infrastructure/AxiosTipoDocumentoRepository';
import { SecureTokenStorage } from '../modules/auth/infrastructure/SecureTokenStorage';

import { ListarRolesActivosUseCase } from '../modules/seguridad/application/ListarRolesActivosUseCase';
import { ListarComponentesProyectoUseCase } from '../modules/proyectos/application/ListarComponentesProyectoUseCase';
import { ListarAccionesComponenteUseCase } from '../modules/proyectos/application/ListarAccionesComponenteUseCase';
import { AsignarRolMiembroUseCase } from '../modules/proyectos/application/AsignarRolMiembroUseCase';
import { ActualizarAlcanceMiembroUseCase } from '../modules/proyectos/application/ActualizarAlcanceMiembroUseCase';
import { QuitarAsignacionUseCase } from '../modules/proyectos/application/QuitarAsignacionUseCase';
import { ListarMiembrosUseCase } from '../modules/proyectos/application/ListarMiembrosUseCase';
import { ActualizarAsignacionRolUseCase } from '../modules/proyectos/application/ActualizarAsignacionRolUseCase';
import { RetirarRolUseCase } from '../modules/proyectos/application/RetirarRolUseCase';

import { ListarRolesUseCase } from '../modules/seguridad/application/ListarRolesUseCase';
import { CrearRolUseCase } from '../modules/seguridad/application/CrearRolUseCase';
import { ActualizarRolUseCase } from '../modules/seguridad/application/ActualizarRolUseCase';
import { EliminarRolUseCase } from '../modules/seguridad/application/EliminarRolUseCase';

import { ListarUsuariosUseCase } from '../modules/auth/application/ListarUsuariosUseCase';
import { CrearUsuarioUseCase } from '../modules/auth/application/CrearUsuarioUseCase';
import { ActualizarActivoUsuarioUseCase } from '../modules/auth/application/ActualizarActivoUsuarioUseCase';
import { ListarAsignacionesUsuarioUseCase } from '../modules/auth/application/ListarAsignacionesUsuarioUseCase';
import { ObtenerMiAccesoUseCase } from '../modules/auth/application/ObtenerMiAccesoUseCase';
import { ActualizarUsuarioUseCase } from '../modules/auth/application/ActualizarUsuarioUseCase';
import { EliminarUsuarioUseCase } from '../modules/auth/application/EliminarUsuarioUseCase';

import { ListarProyectosUseCase } from '../modules/proyectos/application/ListarProyectosUseCase';
import { CrearProyectoUseCase } from '../modules/proyectos/application/CrearProyectoUseCase';
import { ListarMetasProyectoUseCase } from '../modules/proyectos/application/ListarMetasProyectoUseCase';
import { CrearMetaUseCase } from '../modules/proyectos/application/CrearMetaUseCase';
import { ObtenerMetaUseCase } from '../modules/proyectos/application/ObtenerMetaUseCase';
import { ListarComponentesMetaUseCase } from '../modules/proyectos/application/ListarComponentesMetaUseCase';
import { CrearComponenteUseCase } from '../modules/proyectos/application/CrearComponenteUseCase';
import { CrearAccionUseCase as CrearAccionMetaUseCase } from '../modules/proyectos/application/CrearAccionUseCase';
import { ListarAccionesUseCase } from '../modules/proyectos/application/ListarAccionesUseCase';

import { LoginUseCase } from '../modules/auth/application/LoginUseCase';
import { RestoreSessionUseCase } from '../modules/auth/application/RestoreSessionUseCase';
import { ObtenerPerfilUseCase } from '../modules/auth/application/ObtenerPerfilUseCase';
import { CompletarPrimerIngresoUseCase } from '../modules/auth/application/CompletarPrimerIngresoUseCase';
import { ObtenerProyectoUseCase } from '../modules/proyectos/application/ObtenerProyectoUseCase';
import { EliminarProyectoUseCase } from '../modules/proyectos/application/EliminarProyectoUseCase';
import { EliminarMetaUseCase } from '../modules/proyectos/application/EliminarMetaUseCase';
import { ActualizarMetaUseCase } from '../modules/proyectos/application/ActualizarMetaUseCase';
import { ActualizarComponenteUseCase } from '../modules/proyectos/application/ActualizarComponenteUseCase';
import { EliminarComponenteUseCase } from '../modules/proyectos/application/EliminarComponenteUseCase';
import { ActualizarAccionUseCase } from '../modules/proyectos/application/ActualizarAccionUseCase';
import { EliminarAccionUseCase } from '../modules/proyectos/application/EliminarAccionUseCase';

// Repositories
const rolRepo = new AxiosRolRepository();
const miembroRepo = new AxiosProyectoMiembroRepository();
const usuariosRepo = new AxiosUsuariosRepository();
const accessRepo = new AxiosAccessRepository();
export const proyectoRepo = new AxiosProyectoRepository();
const metaRepo = new AxiosMetaRepository();
const authRepo = new AxiosAuthRepository();
const perfilRepo = new AxiosPerfilRepository();
export const tipoDocumentoRepo = new AxiosTipoDocumentoRepository();

// Use Cases
export const listarRolesActivosUseCase = new ListarRolesActivosUseCase(rolRepo);
export const listarComponentesProyectoUseCase = new ListarComponentesProyectoUseCase(miembroRepo);
export const listarAccionesComponenteUseCase = new ListarAccionesComponenteUseCase(miembroRepo);
export const crearComponenteUseCase = { ejecutar: (proyectoId: string, metaId: string, nombre: string, descripcion?: string) => miembroRepo.crearComponente(proyectoId, metaId, nombre, descripcion) };
export const crearAccionUseCase = { ejecutar: (componenteId: string, datos: { nombre: string; descripcion?: string; unidadMedida?: string; proyeccion?: number; ejecucion?: number }) => miembroRepo.crearAccion(componenteId, datos) };
export const asignarRolMiembroUseCase = new AsignarRolMiembroUseCase(miembroRepo);
export const actualizarAlcanceMiembroUseCase = new ActualizarAlcanceMiembroUseCase(miembroRepo);
export const quitarAsignacionUseCase = new QuitarAsignacionUseCase(miembroRepo);
export const listarMiembrosUseCase = new ListarMiembrosUseCase(miembroRepo);
export const actualizarAsignacionRolUseCase = new ActualizarAsignacionRolUseCase(miembroRepo);
export const retirarRolUseCase = new RetirarRolUseCase(miembroRepo);

export const listarRolesUseCase = new ListarRolesUseCase(rolRepo);
export const crearRolUseCase = new CrearRolUseCase(rolRepo);
export const actualizarRolUseCase = new ActualizarRolUseCase(rolRepo);
export const eliminarRolUseCase = new EliminarRolUseCase(rolRepo);

export const obtenerPermisosUseCase = {
  ejecutar: () => rolRepo.listarPermisos(),
};

export const listarUsuariosUseCase = new ListarUsuariosUseCase(usuariosRepo);
export const crearUsuarioUseCase = new CrearUsuarioUseCase(usuariosRepo);
export const actualizarActivoUsuarioUseCase = new ActualizarActivoUsuarioUseCase(usuariosRepo);
export const listarAsignacionesUsuarioUseCase = new ListarAsignacionesUsuarioUseCase(usuariosRepo);
export const obtenerMiAccesoUseCase = new ObtenerMiAccesoUseCase(accessRepo);
export const actualizarUsuarioUseCase = new ActualizarUsuarioUseCase(usuariosRepo);
export const eliminarUsuarioUseCase = new EliminarUsuarioUseCase(usuariosRepo);

export const listarProyectosUseCase = new ListarProyectosUseCase(proyectoRepo);
export const crearProyectoUseCase = new CrearProyectoUseCase(proyectoRepo);
export const listarMetasProyectoUseCase = new ListarMetasProyectoUseCase(metaRepo);
export const crearMetaUseCase = new CrearMetaUseCase(metaRepo);
export const eliminarMetaUseCase = new EliminarMetaUseCase(metaRepo);
export const obtenerMetaUseCase = new ObtenerMetaUseCase(metaRepo);
export const listarComponentesMetaUseCase = new ListarComponentesMetaUseCase(metaRepo);
export const crearComponenteMetaUseCase = new CrearComponenteUseCase(metaRepo);
export const crearAccionMetaUseCase = new CrearAccionMetaUseCase(metaRepo);
export const listarAccionesMetaUseCase = new ListarAccionesUseCase(metaRepo);
export const actualizarMetaUseCase = new ActualizarMetaUseCase(metaRepo);
export const actualizarComponenteUseCase = new ActualizarComponenteUseCase(metaRepo);
export const eliminarComponenteUseCase = new EliminarComponenteUseCase(metaRepo);
export const actualizarAccionUseCase = new ActualizarAccionUseCase(metaRepo);
export const eliminarAccionUseCase = new EliminarAccionUseCase(metaRepo);

export const loginUseCase = new LoginUseCase(authRepo, SecureTokenStorage);
export const restoreSessionUseCase = new RestoreSessionUseCase(authRepo, SecureTokenStorage);
export const obtenerPerfilUseCase = new ObtenerPerfilUseCase(perfilRepo);
export const completarPrimerIngresoUseCase = new CompletarPrimerIngresoUseCase(perfilRepo);
export const obtenerProyectoUseCase = new ObtenerProyectoUseCase(proyectoRepo);
export const eliminarProyectoUseCase = new EliminarProyectoUseCase(proyectoRepo);
export const perfilRepository = perfilRepo;

const uploadRepo = new AxiosUploadRepository();
export const subirEvidenciaUseCase = new SubirEvidenciaUseCase(uploadRepo);

import { AxiosAsignacionResponsableRepository } from '../modules/proyectos/infrastructure/AxiosAsignacionResponsableRepository';
export const asignacionResponsableRepo = new AxiosAsignacionResponsableRepository();
