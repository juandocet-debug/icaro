import { useState, useEffect, useMemo } from 'react';
import { ProyectoMiembro, MemberRole } from '../../domain/ProyectoMiembro';
import { Meta } from '../../domain/Meta';
import { Rol } from '../../../seguridad/domain/Rol';
import { ComponentOption, ActionOption } from '../../domain/ProyectoMiembroRepositoryPort';
import { SelectOption } from '../../../../shared/components/SearchableSelect';
import {
  listarRolesActivosUseCase,
  listarComponentesProyectoUseCase,
  listarAccionesComponenteUseCase,
  asignarRolMiembroUseCase,
  actualizarAsignacionRolUseCase,
  retirarRolUseCase,
  quitarAsignacionUseCase,
  listarMiembrosUseCase,
  listarUsuariosUseCase,
  listarMetasProyectoUseCase,
} from '../../../../shared/dependencies';

// Caché de sesión para datos globales (roles/usuarios) — un solo fetch por sesión
const SESSION_CACHE: { roles: Rol[] | null; usuarios: any[] | null } = { roles: null, usuarios: null };

export interface ConfirmDialog { titulo: string; mensaje: string; onOk: () => void; }

interface Options {
  proyectoId: string;
  isAdmin: boolean;
  initialMiembros?: any[] | null;
}

export function useProyectoEquipo({ proyectoId, isAdmin, initialMiembros }: Options) {
  const [miembros,      setMiembros]      = useState<ProyectoMiembro[]>((initialMiembros as any) ?? []);
  const [roles,         setRoles]         = useState<Rol[]>([]);
  const [metas,         setMetas]         = useState<Meta[]>([]);
  const [componentes,   setComponentes]   = useState<ComponentOption[]>([]);
  const [acciones,      setAcciones]      = useState<ActionOption[]>([]);
  const [usuariosOpts,  setUsuariosOpts]  = useState<SelectOption[]>([]);

  const [loading,        setLoading]        = useState(initialMiembros == null);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const [showForm,            setShowForm]            = useState(false);
  const [username,            setUsername]            = useState('');
  const [rolId,               setRolId]               = useState('');
  const [selectedMetaId,      setSelectedMetaId]      = useState('');
  const [selectedCompId,      setSelectedCompId]      = useState('');
  const [selectedAccId,       setSelectedAccId]       = useState('');
  const [saving,              setSaving]              = useState(false);
  const [formErr,             setFormErr]             = useState<string | null>(null);
  const [editingAsignacionId, setEditingAsignacionId] = useState<string | null>(null);
  const [confirm,             setConfirm]             = useState<ConfirmDialog | null>(null);
  const [miembroDetalle,      setMiembroDetalle]      = useState<ProyectoMiembro | null>(null);

  // ── Refrescar lista de miembros sin spinner completo ────────────────────────
  const refrescarMiembros = async () => {
    setRefreshing(true);
    try {
      const lista = await listarMiembrosUseCase.ejecutar(proyectoId);
      setMiembros(lista);
    } catch {
      /* silencioso */
    } finally {
      setRefreshing(false);
    }
  };

  // ── Carga inicial ────────────────────────────────────────────────────────────
  const cargar = async () => {
    setLoading(true); setError(null);
    try {
      setMiembros(await listarMiembrosUseCase.ejecutar(proyectoId));
    } catch {
      setError('No se pudo cargar el equipo del proyecto.');
    } finally {
      setLoading(false);
    }
  };

  // ── Carga lazy del formulario (solo cuando el admin abre el form) ───────────
  const cargarDatosFormulario = async () => {
    if (formDataLoaded) return;
    try {
      const [rolesList, todosUsuarios, compList, metasList] = await Promise.all([
        SESSION_CACHE.roles ? Promise.resolve(SESSION_CACHE.roles) : listarRolesActivosUseCase.ejecutar().catch(() => [] as Rol[]),
        SESSION_CACHE.usuarios ? Promise.resolve(SESSION_CACHE.usuarios) : listarUsuariosUseCase.ejecutar().catch(() => []),
        listarComponentesProyectoUseCase.ejecutar(proyectoId).catch(() => [] as ComponentOption[]),
        listarMetasProyectoUseCase.ejecutar(proyectoId).catch(() => [] as Meta[]),
      ]);
      if (!SESSION_CACHE.roles && rolesList.length > 0)    SESSION_CACHE.roles = rolesList;
      if (!SESSION_CACHE.usuarios && todosUsuarios.length > 0) SESSION_CACHE.usuarios = todosUsuarios;
      if (rolesList.length > 0) { setRoles(rolesList); setRolId(rolesList[0].id); }
      setUsuariosOpts(
        todosUsuarios.filter((u: any) => u.isActive)
          .map((u: any) => ({ id: u.username, name: u.nombreCompleto || u.username, description: u.username, photoUrl: u.photoUrl }))
      );
      setComponentes(compList);
      setMetas(metasList.filter((m: Meta) => m.activo));
      setFormDataLoaded(true);
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    if (initialMiembros != null) { setMiembros(initialMiembros as any); setLoading(false); }
    else cargar();
  }, [proyectoId]);

  // Cargar acciones al seleccionar componente
  useEffect(() => {
    if (!selectedCompId) { setAcciones([]); setSelectedAccId(''); return; }
    listarAccionesComponenteUseCase.ejecutar(selectedCompId)
      .then(setAcciones)
      .catch(() => {});
  }, [selectedCompId]);

  const selectedRol = useMemo(() => roles.find((r) => r.id === rolId), [roles, rolId]);

  // Resetear alcance al cambiar rol
  useEffect(() => {
    if (!selectedRol) return;
    if (selectedRol.tipo_alcance !== 'componente' && selectedRol.tipo_alcance !== 'accion') {
      setSelectedMetaId(''); setSelectedCompId('');
    }
    if (selectedRol.tipo_alcance !== 'accion') setSelectedAccId('');
  }, [rolId, selectedRol]);

  // Resetear componente al cambiar meta
  useEffect(() => { setSelectedCompId(''); }, [selectedMetaId]);

  const requiereComponente = selectedRol?.tipo_alcance === 'componente' || selectedRol?.tipo_alcance === 'accion';
  const requiereAccion     = selectedRol?.tipo_alcance === 'accion';

  // ── Opciones derivadas ───────────────────────────────────────────────────────
  const rolesOptions = useMemo(() =>
    roles.map((r) => ({
      id: r.id, name: r.nombre, description: r.descripcion,
      category: r.es_sistema ? 'ROLES DEL SISTEMA' : 'ROLES PERSONALIZADOS',
      badgeText: r.es_sistema ? 'Sistema' : 'Personalizado',
    })), [roles]);

  const metasOptions       = useMemo(() => metas.map((m) => ({ id: m.id, name: m.nombre })), [metas]);
  const componentesOptions = useMemo(() => {
    const lista = selectedMetaId ? componentes.filter((c) => c.metaId === selectedMetaId) : componentes;
    return lista.map((c) => ({ id: c.id, name: c.name }));
  }, [componentes, selectedMetaId]);
  const accionesOptions    = useMemo(() => acciones.map((a) => ({ id: a.id, name: a.name })), [acciones]);

  const canSubmit = (editingAsignacionId || username.trim().length > 0) && rolId.length > 0;

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const ejecutarGuardar = async () => {
    setSaving(true); setFormErr(null);
    try {
      if (editingAsignacionId) {
        await actualizarAsignacionRolUseCase.ejecutar(proyectoId, editingAsignacionId, rolId,
          requiereComponente ? selectedCompId : null, requiereAccion ? selectedAccId : null);
      } else {
        await asignarRolMiembroUseCase.ejecutar(proyectoId, username.trim(), rolId,
          requiereComponente ? selectedCompId : null, requiereAccion ? selectedAccId : null);
      }
      resetForm();
      await refrescarMiembros();
    } catch (e: any) {
      setFormErr(e?.response?.data?.error ?? 'Error al guardar la asignación.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setUsername(''); setRolId(''); setSelectedMetaId('');
    setSelectedCompId(''); setSelectedAccId('');
    setEditingAsignacionId(null); setShowForm(false); setFormErr(null);
  };

  const handleAgregarOrEditar = () => {
    if (!editingAsignacionId && !username.trim()) { setFormErr('El username es obligatorio.'); return; }
    if (!rolId) { setFormErr('Debe seleccionar un rol.'); return; }
    if (requiereComponente && !selectedCompId) { setFormErr('Este rol requiere seleccionar un componente.'); return; }
    if (requiereAccion && !selectedAccId) { setFormErr('Este rol requiere seleccionar una acción específica.'); return; }

    if (editingAsignacionId) {
      const rolNombre = roles.find((r) => r.id === rolId)?.nombre ?? 'rol seleccionado';
      setConfirm({ titulo: 'Confirmar cambio de rol', mensaje: `¿Confirmas cambiar el rol de ${username} a "${rolNombre}"?`, onOk: ejecutarGuardar });
    } else {
      ejecutarGuardar();
    }
  };

  const handleEditClick = (m: ProyectoMiembro, r: MemberRole) => {
    setEditingAsignacionId(r.id);
    setUsername(m.username);
    setRolId(r.rolId);
    if (r.componenteId) {
      const comp = componentes.find((c) => c.id === r.componenteId);
      setSelectedMetaId(comp?.metaId || '');
    }
    setSelectedCompId(r.componenteId || '');
    setSelectedAccId(r.accionId || '');
    setShowForm(true); setFormErr(null);
  };

  const handleEliminar = (miembroId: string, nombreMiembro: string) => {
    setConfirm({
      titulo: 'Retirar del proyecto',
      mensaje: `¿Confirmas retirar a ${nombreMiembro} del proyecto? Se eliminarán todas sus asignaciones de rol.`,
      onOk: async () => {
        setMiembros((prev) => prev.filter((m) => m.id !== miembroId));
        try {
          await quitarAsignacionUseCase.ejecutar(proyectoId, miembroId);
          await refrescarMiembros();
        } catch {
          setError('No se pudo eliminar el miembro.');
          await refrescarMiembros();
        }
      },
    });
  };

  const handleRetirarRol = (asignacionId: string, rolNombre: string, nombreMiembro: string) => {
    setConfirm({
      titulo: 'Retirar rol',
      mensaje: `¿Confirmas retirar el rol "${rolNombre}" a ${nombreMiembro}?`,
      onOk: async () => {
        try {
          await retirarRolUseCase.ejecutar(proyectoId, asignacionId);
          await refrescarMiembros();
        } catch {
          setError('No se pudo retirar el rol.');
        }
      },
    });
  };

  const getRolResumen = (m: ProyectoMiembro) => {
    const rs = m.roles ?? [];
    if (rs.length === 0) return { principal: 'Sin rol', extra: '' };
    return { principal: rs[0].rolNombre, extra: rs.length > 1 ? `+${rs.length - 1} más` : '' };
  };

  return {
    // Estado
    miembros, loading, refreshing, error,
    showForm, setShowForm, formErr, saving, editingAsignacionId,
    username, setUsername, rolId, setRolId,
    selectedMetaId, setSelectedMetaId, selectedCompId, setSelectedCompId,
    selectedAccId, setSelectedAccId,
    confirm, setConfirm, miembroDetalle, setMiembroDetalle,
    // Opciones
    rolesOptions, metasOptions, componentesOptions, accionesOptions, usuariosOpts,
    requiereComponente, requiereAccion, canSubmit, componentes,
    // Handlers
    cargarDatosFormulario, resetForm, getRolResumen,
    handleAgregarOrEditar, handleEditClick, handleEliminar, handleRetirarRol,
  };
}
