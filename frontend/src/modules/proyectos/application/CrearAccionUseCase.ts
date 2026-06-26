import { Accion, RequisitoVerificacion } from '../domain/Accion';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class CrearAccionUseCase {
  constructor(private repo: MetaRepositoryPort) {}
  async ejecutar(componenteId: string, datos: {
    nombre: string;
    descripcion?: string;
    unidadMedida?: string;
    proyeccion?: number;
    requisitosVerificacion?: RequisitoVerificacion[];
    tiposEvidencia?: string[];
    startDate?: string | null;
    endDate?: string | null;
    requiereGrupos?: boolean;
  }): Promise<Accion> {
    return this.repo.crearAccion(componenteId, datos);
  }
}
