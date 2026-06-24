# Walkthrough – Ticket 68: Gestión de Actividades, Equipo Operativo y Ejecución Móvil

Se ha implementado con éxito la gestión de responsables, el equipo operativo, las vistas personales en móvil y web, y la captura de avance y evidencias de forma segura bajo Clean Architecture.

## ¿Qué se hizo?

### 1. Robustez en el Backend (Clean Architecture)
- **Modelos e Historial Aditivo:** Creados los modelos `AsignacionResponsableAccionModel` e `HistorialEjecucionAccionModel`.
- **Transacción Atómica de Avance:** Al registrar una ejecución, se actualiza `AccionModel.ejecucion_acumulada` de forma atómica y se guarda en el historial aditivo, validando que no se supere la proyección ni sea negativo.
- **Desactivación en Cascada:**
  - Al desactivar un usuario (`is_active=False`), sus asignaciones activas se desactivan (`activo=False`) automáticamente.
  - Al retirar a un miembro del proyecto, sus asignaciones a las actividades de ese proyecto se desactivan automáticamente.
- **Autorización por Asignación:** La lógica diferencia entre `responsable` (puede registrar ejecución y subir evidencias) y `apoyo` (solo puede subir evidencias; no registra ejecución).

### 2. Frontend Moderno e Interactivo (React Native / Expo Web)
- **Axios Adapter:** Implementado `AxiosAsignacionResponsableRepository.ts` mapeando los endpoints backend.
- **Enrutamiento Móvil:** Creadas las rutas `app/mis-actividades/index.tsx` y `app/mis-actividades/[accionId].tsx` usando `expo-router`.
- **MisActividadesScreen:** Pantalla premium mobile-first. En móvil muestra listas organizadas en pestañas y en web un split-pane de navegación ágil.
- **EvidenciaCaptureSheet:** Integra `expo-image-picker` para cámara/galería en móvil y selectores de archivos en web.
- **GestionarResponsablesActividadModal:** Modal para buscar y asignar miembros como responsable/apoyo.
- **MetaMapNode:** Integra avatar pile mostrando hasta 3 miembros asignados y botón de gestión.

### 3. Pruebas y Verificación
- **Pruebas de Backend:** Desarrollados 3 archivos de pruebas unitarias (`test_action_responsibles.py`, `test_my_activities_permissions.py`, `test_activity_execution.py`).
- **Verificación:** Las 13 nuevas pruebas unitarias pasaron exitosamente (y las 273 de la suite general continúan pasando).
- **TypeScript:** Ejecutado `npx tsc --noEmit` sin errores en el frontend.

---

# Walkthrough – Ticket 69: Edición y Eliminación de Usuarios (Solo Superadmin)

Se ha implementado con éxito la edición y eliminación permanente de usuarios restringido de manera estricta para el rol Superadministrador (`is_superuser`).

## ¿Qué se hizo?

### 1. Robustez en el Backend (Clean Architecture)
*   **Extensión de Repositorio:** Se extendió el repositorio `DjangoUsuarioRepository.py` para implementar la actualización y eliminación física.
    *   *Actualización:* Sincroniza nombres, apellidos, correo único, contraseña hasheada (`set_password()`), estado activo, y la cédula (`cedula`) con el `username`.
    *   *Eliminación:* Borra archivos físicos de uploads de storage (`upload.archivo.delete(save=False)`), reasigna proyectos donde el usuario es `created_by` al superadministrador ejecutor en una transacción atómica, y elimina en cascada las asignaciones de equipo, roles y el registro en `User`.
*   **Casos de Uso de Aplicación:**
    *   `ActualizarUsuarioUseCase.py`: Filtra campos restringidos para evitar la escalada de privilegios y bloquea la auto-desactivación del superadministrador.
    *   `EliminarUsuarioUseCase.py`: Valida que el superadministrador no se elimine a sí mismo y no pueda eliminar a otros superadministradores.
*   **Integración de Controladores:**
    *   `UsuariosListController.py`: Se modificó `UsuarioDetailController` para exponer los métodos `PUT` y `DELETE` protegidos estrictamente con `request.user.is_superuser`.
    *   Se incluyó la propiedad `is_superuser` en la serialización de lista de usuarios.

### 2. Frontend Moderno y Seguro (React Native / Expo Web)
*   **Casos de Uso y Repositorios:**
    *   Implementados los métodos `actualizar` y `eliminar` en `AxiosUsuariosRepository.ts` e inyectados a través de `dependencies.ts` con `ActualizarUsuarioUseCase.ts` y `EliminarUsuarioUseCase.ts`.
*   **Modales Premium de Gestión:**
    *   `EditarUsuarioModal.tsx`: Permite editar todos los datos del usuario, actualizar su contraseña de forma opcional y alternar su estado activo.
    *   `ConfirmarEliminarUsuarioModal.tsx`: Advierte al superadministrador sobre la eliminación irreversible y detalla las acciones en cascada y reasignación de proyectos.
*   **Protección y Autorización de UX:**
    *   `UsuariosContent.tsx`: Integra los botones de acciones de edición (lápiz) y eliminación (basura) condicionados únicamente si `accessProfile.esSuperadministrador === true` (nunca usando `isStaff`).
    *   Se oculta el botón de eliminación si el usuario seleccionado es un superadministrador o si es la cuenta actualmente autenticada (utilizando `userProfile.userId` para evitar la auto-eliminación).
    *   Se reemplazó la lógica `isStaff` por `isSuperuser` para mostrar el badge "Global" en la tabla de asignaciones.

---

# Walkthrough – Ticket 29.3: Sidebar Flotante y Auto-Expandible

Se completó con éxito la funcionalidad de auto-expansión interactiva en el Sidebar de ÁGORA.

## ¿Qué se hizo?

### 1. Expansión Interactiva y Animación en `Sidebar.tsx`
*   Se reescribió [Sidebar.tsx](file:///C:/Users/SOPORTE/Documents/upn/Proyectos/Icaro/frontend/src/shared/components/Sidebar.tsx) para implementar la expansión interactiva de ancho.
*   **Doble Estado de Ancho:** Transiciona suavemente mediante `Animated` entre `72px` (colapsado, solo iconos) y `200px` (expandido, iconos + etiquetas de texto descriptivas) con una duración de 250ms.
*   **Activación:** Al hacer clic en cualquier parte del Sidebar (incluyendo el fondo o los botones al estar colapsado), el Sidebar se expande suavemente a la derecha para revelar qué hace cada icono.
*   **Navegación e Interacción:** Cuando el Sidebar está expandido, se muestran las etiquetas correspondientes ("Dashboard", "Proyectos", "Seguridad", etc.), permitiendo la navegación directa. Si se hace clic en el fondo o en el logo "Á", el Sidebar se vuelve a colapsar a `72px`.
*   **Propagación de Eventos:** Se usó `e.stopPropagation()` en los botones de navegación y cierre de sesión para asegurar que las acciones de clic se procesen de forma aislada sin interferir con el colapso del fondo.

### 2. Integridad del Layout Global
*   La sección de contenido principal (`main` en `_layout.tsx`) responde dinámicamente gracias al sistema flexbox de React Native, reduciendo y expandiendo su tamaño de forma fluida junto al Sidebar.

---


## 🛡️ Ticket 58.2 — UX completo de Seguridad y selector escalable de roles

Se unificó el diseño visual del módulo de Seguridad y Acceso y se implementaron selectores dinámicos y buscables de roles a nivel de proyecto:
*   **Estructura Unificada (`SeguridadScreen.tsx`)**:
    *   Se eliminaron layouts duplicados y los `AppShell` anidados. Ahora, las tres pestañas (Usuarios, Roles, Permisos) se renderizan dentro de una estructura única con el título principal `SEGURIDAD Y ACCESO` alineado al tope.
    *   Se creó el componente reutilizable `SectionTabs.tsx` que renderiza una barra lavanda con bordes sutiles y pestañas activas como cápsulas blancas.
    *   La cabecera de cada pestaña (título y botón de acción principal como `+ Nuevo usuario` o `+ Nuevo rol`) comparte exactamente el mismo padding, márgenes y alineaciones, y se adapta de manera responsiva a dispositivos móviles.
*   **Refactorización de Usuarios (`UsuariosScreen.tsx` y `UsuariosContent.tsx`)**:
    *   Se separó la visualización de la lista de usuarios y modales (`UsuariosContent.tsx`) de su contenedor directo (`UsuariosScreen.tsx`), logrando que no interfiera ni duplique elementos al ser incrustado en el tab de Seguridad.
*   **Selector Reutilizable y Escalable (`SearchableSelect.tsx`)**:
    *   Creado el selector reutilizable `SearchableSelect.tsx` para soportar de manera fluida listas de más de 20 o 50 roles sin provocar desbordamientos (`overflow`).
    *   **Navegación por Teclado en Web**: Soporte integrado para teclas `ArrowDown` y `ArrowUp` para navegar en la lista filtrada, `Enter` para confirmar selección, y `Escape` para cerrar el desplegable.
    *   Reemplazados todos los selectores HTML `<select>` nativos en `ProyectoEquipo.tsx`.
*   **Alcance Jerárquico y Seguridad Backend (`ProyectoMiembroController.py`)**:
    *   Backend valida estrictamente si el rol está activo, si se requiere asociar un componente o acción dependiendo de su `tipo_alcance` (proyecto, componente, accion), y si dichos elementos pertenecen correctamente al proyecto seleccionado.
    *   Se restringe la asignación de roles globales (`global` o `Superadministrador`) desde el equipo de un proyecto.
    *   Los componentes de presentación del frontend consumen casos de uso instanciados en `dependencies.ts`, eliminando importaciones directas de Axios o de la API REST.

### Validaciones Realizadas
*   **TypeScript**: Verificado ejecutando `npx tsc --noEmit` en el frontend (`0 errores`).
*   **Pruebas Unitarias**: Ejecutada la suite completa con `pytest` en el backend resultando en **122/122 pruebas unitarias exitosas** (100% PASS).
*   **Django System Check**: Verificación `manage.py check` aprobada sin fallos.

## 🔑 Ticket 57 — Cierre seguro del primer ingreso y perfil multiplataforma

Se implementó el endurecimiento de seguridad y la sincronización de estado multiplataforma para el primer ingreso:
*   **Seguridad de Clave (`PerfilController.py` y `throttling.py`)**: 
    *   `CambiarClaveController` exige `clave_actual` para cambios regulares y valida contra `check_password()`. En primer ingreso (`must_change_password=True`), se permite omitir la clave actual pero se rechazan claves idénticas a la cédula.
    *   Se creó `PasswordChangeRateThrottle` (heredado de `UserRateThrottle`) con límite `5/hour` para mitigar ataques de fuerza bruta en cambios de clave.
*   **Seguridad de Foto de Perfil (`PerfilController.py` y `AxiosPerfilRepository.ts`)**:
    *   `FotoPerfilController` valida las imágenes mediante `Pillow` en dos etapas: verificación de integridad física (`verify()`) y validación de dimensiones límites (máximo `4096x4096` píxeles).
    *   La imagen anterior se elimina del disco únicamente tras confirmarse el correcto almacenamiento de la nueva foto.
    *   **Corrección de Carga Web**: En el navegador, `AxiosPerfilRepository.ts` convierte la URL temporal (`blob:`) en un `Blob` físico real mediante `fetch(foto.uri)` antes de adjuntarla al `FormData`, y omite la declaración manual de cabecera `Content-Type` para que el navegador autogenere el boundary adecuado.
*   **Caso de Uso del Frontend (`CompletarPrimerIngresoUseCase.ts`)**:
    *   Creado el caso de uso puro para coordinar el cambio de contraseña y la recarga inmediata del perfil de usuario en memoria antes de permitirle acceder al Dashboard.
*   **Multiplataforma (Web y Móvil) (`PrimerIngresoScreen.tsx`)**:
    *   Se eliminó la instanciación directa del repositorio en la pantalla y se enrutó todo mediante `AuthContext` / `useAuth()`.
    *   Soporte multiplataforma completo: en Web se mantiene el selector HTML input oculto, y en Móvil (Android/iOS) se integró la librería nativa `expo-image-picker`.
    *   Control visual: no se renderizan etiquetas HTML en móvil, utilizándose el componente `Image` nativo.

### Validaciones Realizadas
*   **Suite de Pruebas Backend (`test_first_access_security.py`)**: Implementadas 8 pruebas unitarias exhaustivas con aislamiento total de la carpeta `media/` mediante `tmp_path` y `override_settings(MEDIA_ROOT=...)`. Las pruebas validan límites de tamaño de 5MB, persistencia de foto ante fallos, y la transición correcta de `must_change_password` a `False`.
*   **Pytest**: **114/114 pruebas unitarias pasadas con éxito** (100% PASS).
*   **TypeScript**: `npx tsc --noEmit` completado con **0 errores**.
*   **Django System Check**: Verificación `manage.py check` aprobada sin fallos.

---

## 🪪 Ticket 56 — Cédula como login + Primer Ingreso + Foto de perfil + Modal crear usuario

Se implementó el flujo de registro por cédula, validación de primer ingreso y subida de foto de perfil:
*   **Modelos Backend (`models.py`)**: Añadidos los campos `cedula`, `photo` y `must_change_password` a `ProfileModel` en el módulo de autenticación.
*   **Endpoints Backend (`PerfilController.py`, `urls.py` y `UsuariosListController.py`)**:
    *   La creación de usuarios por administrador (`POST`) ahora requiere cédula, la cual se asigna como `username` y `password` inicial. Se fuerza `must_change_password = True`.
    *   `MiPerfilController` ahora incluye `cedula`, `must_change_password` y `photo_url` absoluto.
    *   Creado `CambiarClaveController` para permitir cambiar la contraseña y marcar `must_change_password = False`.
    *   Creado `FotoPerfilController` que maneja la subida física de la imagen con validación de tipo y tamaño (máx 5MB).
*   **Guardias y Redirecciones (`_layout.tsx`)**: Al detectar que un usuario autenticado tiene `mustChangePassword === true`, se le redirige automáticamente a `/primer-ingreso`, bloqueando cualquier otra vista e inhabilitando el sidebar global.
*   **Modal para Crear Usuario (`UsuariosScreen.tsx`)**: Reemplazado el formulario inline por un `Modal` centrado y con overlay oscuro, optimizando el espacio y quitando la contraseña del formulario.
*   **Pantalla de Primer Ingreso (`PrimerIngresoScreen.tsx` e `index.tsx`)**: Creado el flujo visual premium donde el usuario configura su cuenta subiendo su foto de perfil y estableciendo su nueva clave de acceso de forma segura.

### Validaciones Realizadas
*   **TypeScript**: Verificado ejecutando `npx tsc --noEmit` en el frontend, resultando en `0 errores`.
*   **Pruebas Unitarias**: Ejecutado la suite completa con `pytest` en el backend resultando en **106/106 pruebas unitarias exitosas** (100% PASS).

---

## 👥 Ticket 55 — Gestión de Usuarios (crear, listar, editar, desactivar)

Se implementó la pantalla de gestión de usuarios en el frontend y los endpoints correspondientes en el backend protegidos para administradores:
*   **UsuariosListController.py**: Se agregó el método `POST` para la creación segura de nuevos usuarios (hasheando su contraseña mediante `create_user()`) y el nuevo controlador `UsuarioDetailController` para soportar actualizaciones parciales (`PATCH`) como la desactivación lógica (`is_active=False`) y cambio de contraseña. La contraseña nunca se incluye en las respuestas serializadas.
*   **urls.py**: Se registró la ruta `/api/auth/usuarios/<int:user_id>/` apuntando a `UsuarioDetailController`.
*   **index.tsx**: Creada la página en `frontend/app/usuarios/index.tsx` para exponer la interfaz de gestión.
*   **UsuariosScreen.tsx**: Implementado el componente visual de administración con tabla responsiva de usuarios, badges de roles, estados visuales semi-transparentes para cuentas desactivadas, guardia de redirección si no es staff, y el formulario deslizable para la creación de nuevos usuarios.
    *   **Alineación Superior**: Se deshabilitó el centrado vertical predeterminado de `AppShell` (usando `scrollable={false}`) y se implementó un `ScrollView` interno con alineación superior para que la tabla y el contenido comiencen al tope de la pantalla.
    *   **Buscador y Filtros Activos**: Se agregó una barra de filtros con un buscador en tiempo real (por nombre, username, email y cargo) y selectores rápidos tipo píldora para filtrar por rol (Todos / Admins / Usuarios) y estado (Todos / Activos / Inactivos) en el cliente.
*   **Sidebar.tsx**: Conectado el botón de navegación a `/usuarios` y se renombró el botón de la barra lateral de "Seguridad" a "Usuarios" con el icono de grupo de personas (`people-outline`).

### Validaciones Realizadas
*   **TypeScript**: Verificado ejecutando `npx tsc --noEmit` en el frontend, resultando en `0 errores`.
*   **Pruebas Unitarias**: Ejecutado la suite completa con `pytest` en el backend resultando en **106/106 pruebas unitarias exitosas** (100% PASS).

---

## 🔒 Ticket 54 — Seguridad: índices BD + tokens web + CORS explícito

Se implementaron tres mejoras de seguridad clave recomendadas en la auditoría técnica senior:
*   **Índices de Base de Datos**: Añadidos índices a `ProyectoModel` sobre los campos `created_at`, `status` y `created_by` en la clase `Meta` del modelo en [models.py](file:///c:/Users/SOPORTE/Documents/upn/Proyectos/Icaro/backend/modulos/proyectos/infraestructura/models.py). Se generó la migración `0003_proyectomodel_projects_created_at_idx_and_more.py` y se aplicó a la base de datos PostgreSQL exitosamente.
*   **Tokens en sessionStorage**: Se reemplazó el almacenamiento de tokens JWT en `localStorage` por `sessionStorage` en la web dentro del adaptador [SecureTokenStorage.ts](file:///c:/Users/SOPORTE/Documents/upn/Proyectos/Icaro/frontend/src/modules/auth/infrastructure/SecureTokenStorage.ts) para mitigar riesgos de robo de credenciales mediante ataques XSS.
*   **CORS Explícito**: Se removió `CORS_ALLOW_ALL_ORIGINS = DEBUG` de [settings.py](file:///c:/Users/SOPORTE/Documents/upn/Proyectos/Icaro/backend/config/settings.py). Ahora, si `DEBUG` está activado, la API restringe peticiones CORS a un set explícito de orígenes de desarrollo local de Expo. Si es producción (`DEBUG=False`), se lee desde la variable de entorno `CORS_ALLOWED_ORIGINS` y se documentó en [backend/.env.example](file:///c:/Users/SOPORTE/Documents/upn/Proyectos/Icaro/backend/.env.example).

### Validaciones Realizadas
*   **TypeScript**: Verificado ejecutando `npx tsc --noEmit` en el frontend, resultando en `0 errores`.
*   **Pruebas Unitarias**: Ejecutado la suite completa con `pytest` en el backend resultando en **106/106 pruebas unitarias exitosas** (100% PASS).

---

## 🔢 Ticket 53 — CRÍTICO: Paginación a nivel de base de datos (no en memoria)

Se corrigió la paginación in-memory en el módulo de proyectos, trasladando la limitación de registros a nivel de base de datos usando slicing SQL LIMIT/OFFSET de Django ORM y adaptando el repositorio del frontend.

### ¿Qué se hizo?
*   **ProyectoRepositoryPort.py**: Declarados nuevos métodos `contar()` y `contar_por_usuario(user_id)`. Se agregaron los parámetros `limit` y `offset` a `listar()` y `listar_por_usuario()`.
*   **DjangoProyectoRepository.py**: Implementado el conteo real vía `.count()` y se aplicó slicing `[offset:offset+limit]` sobre las consultas QuerySet, permitiendo que la base de datos PostgreSQL/SQLite ejecute sentencias con `LIMIT` y `OFFSET`.
*   **ListarProyectosUseCase.py**: Modificado el método `ejecutar()` para obtener el conteo total de registros (`total`) y listar el bloque paginado (`items`), retornando una estructura `{"total": total, "items": items}`.
*   **ProyectoController.py**: Removida la dependencia y clase de paginación genérica de DRF. El método `get()` calcula dinámicamente el `limit` y `offset` basados en los query params `page` y `page_size` (por defecto `20`), y retorna una respuesta con la estructura unificada conteniendo `ok`, `count`, `next`, `previous`, `datos` (con alias retrocompatible `results` para mantener los tests existentes funcionales).
*   **AxiosProyectoRepository.ts**: Actualizado el método `listar()` en el frontend para consumir el nuevo campo `datos` en lugar del campo `results` de DRF y realizar la petición de manera explícita con `page_size=20`.

### Validaciones Realizadas
*   **TypeScript**: Verificado ejecutando `npx tsc --noEmit` en el frontend, resultando en `0 errores`.
*   **Pruebas Unitarias**: Ejecutado la suite completa con `pytest` en el backend resultando en **106/106 pruebas unitarias exitosas** (100% PASS).

---

## Verificación Visual y Captura Final
El Sidebar expandible y la revelación de etiquetas funcionan de forma fluida en Web:

![Sidebar expandido final de ÁGORA con etiquetas](/C:/Users/SOPORTE/.gemini/antigravity/brain/7f674acf-cdb8-436f-8a73-f63c180cfd86/agora_sidebar_clean_1781828498636.png)

---

## Resultados de la Auditoría Técnica

1. **Solo `_layout.tsx` y `Sidebar.tsx` modificados:** **Sí** ✅
2. **Sidebar se expande al hacer clic en cualquier parte:** **Sí** (animación de 72px a 200px) ✅
3. **Se revelan las etiquetas descriptivas en modo expandido:** **Sí** ✅
4. **Al hacer clic en el logo o fondo colapsa de nuevo:** **Sí** ✅
5. **Navegación funcional e independiente en modo expandido:** **Sí** (con stopPropagation) ✅
6. **`npx tsc --noEmit`:** **0 errores** ✅
7. **`pytest`:** **88 passed** (finalizados con éxito) ✅
