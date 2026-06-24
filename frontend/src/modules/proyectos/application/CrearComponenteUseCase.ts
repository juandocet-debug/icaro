import { Componente } from '../domain/Componente';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class CrearComponenteUseCase {
  constructor(private repo: MetaRepositoryPort) {}
  async ejecutar(proyectoId: string, metaId: string, datos: { nombre: string; descripcion?: string }): Promise<Componente> {
    return this.repo.crearComponente(proyectoId, metaId, datos);
  }
}
