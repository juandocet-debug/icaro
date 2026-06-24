import { Meta } from './Meta';
import { Componente } from './Componente';
import { Accion } from './Accion';

export interface MetaRepositoryPort {
  listar(proyectoId: string): Promise<Meta[]>;
  obtener(proyectoId: string, metaId: string): Promise<Meta>;
  crear(proyectoId: string, datos: { nombre: string; descripcion?: string }): Promise<Meta>;
  actualizar(proyectoId: string, metaId: string, datos: { nombre?: string; descripcion?: string }): Promise<Meta>;
  archivar(proyectoId: string, metaId: string): Promise<void>;
  eliminar(proyectoId: string, metaId: string): Promise<void>;
  listarComponentes(proyectoId: string, metaId: string): Promise<Componente[]>;
  crearComponente(proyectoId: string, metaId: string, datos: { nombre: string; descripcion?: string }): Promise<Componente>;
  listarAcciones(componenteId: string): Promise<Accion[]>;
  crearAccion(componenteId: string, datos: {
    nombre: string;
    descripcion?: string;
    unidadMedida?: string;
    proyeccion?: number;
    requisitosVerificacion?: import('./Accion').RequisitoVerificacion[];
    tiposEvidencia?: string[];
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<Accion>;
  actualizarComponente(proyectoId: string, compId: string, datos: { nombre?: string; descripcion?: string }): Promise<Componente>;
  eliminarComponente(proyectoId: string, compId: string): Promise<void>;
  actualizarAccion(compId: string, accionId: string, datos: {
    nombre?: string;
    descripcion?: string;
    unidadMedida?: string;
    proyeccion?: number;
    tiposEvidencia?: string[];
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<Accion>;
  eliminarAccion(compId: string, accionId: string): Promise<void>;
}
