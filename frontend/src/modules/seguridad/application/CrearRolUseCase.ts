import { RolRepositoryPort } from '../domain/RolRepositoryPort';
import { CreateRolDto, Rol } from '../domain/Rol';

export class CrearRolUseCase {
  constructor(private repo: RolRepositoryPort) {}
  async ejecutar(dto: CreateRolDto): Promise<Rol> {
    if (!dto.nombre.trim()) throw new Error('El nombre es obligatorio.');
    if (!dto.descripcion.trim()) throw new Error('La descripción es obligatoria.');
    return this.repo.crear(dto);
  }
}
