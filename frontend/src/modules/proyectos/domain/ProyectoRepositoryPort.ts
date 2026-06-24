import { Proyecto } from './Proyecto';
import { CreateProyectoDto } from './CreateProyectoDto';

export interface PaginatedProyectos {
  count: number;
  next: string | null;
  previous: string | null;
  results: Proyecto[];
}

export interface ProyectoRepositoryPort {
  listar(page?: number): Promise<PaginatedProyectos>;
  obtener(id: string): Promise<Proyecto>;
  crear(dto: CreateProyectoDto): Promise<Proyecto>;
  eliminar(id: string): Promise<void>;
  actualizar(id: string, campos: Partial<Proyecto>): Promise<Proyecto>;
}
