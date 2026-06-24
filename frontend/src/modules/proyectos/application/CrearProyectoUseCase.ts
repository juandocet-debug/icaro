import { ProyectoRepositoryPort } from '../domain/ProyectoRepositoryPort';
import { CreateProyectoDto } from '../domain/CreateProyectoDto';
import { Proyecto } from '../domain/Proyecto';

export class CrearProyectoUseCase {
  constructor(private repository: ProyectoRepositoryPort) {}

  async ejecutar(dto: CreateProyectoDto): Promise<Proyecto> {
    if (!dto.name.trim()) throw new Error('El nombre del proyecto es obligatorio.');
    return this.repository.crear(dto);
  }
}
