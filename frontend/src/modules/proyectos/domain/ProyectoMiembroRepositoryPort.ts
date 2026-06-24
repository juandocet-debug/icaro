import { ProyectoMiembro } from './ProyectoMiembro';

export interface ComponentOption {
  id: string;
  name: string;
  metaId?: string | null;
}

export interface ActionOption {
  id: string;
  name: string;
  description?: string | null;
  unidadMedida?: string | null;
  proyeccion?: number | null;
  ejecucion?: number;
}

export interface ProyectoMiembroRepositoryPort {
  listar(proyectoId: string): Promise<ProyectoMiembro[]>;
  agregar(
    proyectoId: string,
    username: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro>;
  actualizarRol(
    proyectoId: string,
    miembroId: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro>;
  actualizarAsignacionRol(
    proyectoId: string,
    asignacionId: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro>;
  eliminar(proyectoId: string, miembroId: string): Promise<void>;
  retirarRol(proyectoId: string, asignacionId: string): Promise<void>;
  listarComponentes(proyectoId: string): Promise<ComponentOption[]>;
  listarAcciones(componenteId: string): Promise<ActionOption[]>;
  crearComponente(proyectoId: string, metaId: string, nombre: string, descripcion?: string): Promise<ComponentOption>;
  crearAccion(componenteId: string, datos: { nombre: string; descripcion?: string; unidadMedida?: string; proyeccion?: number; ejecucion?: number }): Promise<ActionOption>;
}
