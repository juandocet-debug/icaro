import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';
import { Accion } from '../domain/Accion';

export class ActualizarAccionUseCase {
  constructor(private readonly repositorio: MetaRepositoryPort) {}

  ejecutar(compId: string, accionId: string, datos: {
    nombre?: string;
    descripcion?: string;
    unidadMedida?: string;
    proyeccion?: number;
    tiposEvidencia?: string[];
    startDate?: string | null;
    endDate?: string | null;
    requiereGrupos?: boolean;
  }): Promise<Accion> {
    return this.repositorio.actualizarAccion(compId, accionId, datos);
  }
}
