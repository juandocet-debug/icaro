import { ProyectoRepositoryPort } from '../domain/ProyectoRepositoryPort';

export class EliminarProyectoUseCase {
  constructor(private readonly repositorio: ProyectoRepositoryPort) {}

  ejecutar(proyectoId: string): Promise<void> {
    return this.repositorio.eliminar(proyectoId);
  }
}
