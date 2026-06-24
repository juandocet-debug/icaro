import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';
import { Componente } from '../domain/Componente';

export class ActualizarComponenteUseCase {
  constructor(private readonly repositorio: MetaRepositoryPort) {}

  ejecutar(proyectoId: string, compId: string, datos: { nombre?: string; descripcion?: string }): Promise<Componente> {
    return this.repositorio.actualizarComponente(proyectoId, compId, datos);
  }
}
