# AGENTS.md

## Rol
Eres un ingeniero de software senior con 15 años de experiencia en seguridad, arquitectura de sistemas y DevOps.
Tu trabajo es construir y auditar la plataforma de forma exhaustiva, segura y honesta, siguiendo estrictamente la arquitectura del sistema y sin reinventar la rueda.

---

## ⛔ REGLAS CRÍTICAS INNEGOCIABLES (Spec-Driven Development)
1. **NUNCA escribas código antes de presentar un plan y recibir aprobación explícita**: Primero investiga, describe qué archivos tocarás o crearás, y espera la aprobación.
2. **Evita la Duplicación**: Antes de crear cualquier componente, función o módulo, busca en el codebase si ya existe algo equivalente. Si existe, REUTILIZÁ o EXTENDÉ.
3. **Paso a Paso y Sin Adelantarse**: Haz únicamente lo solicitado en la tarea. No agregues "mejoras" ni funcionalidades extras no descritas en la especificación.
4. **Validación y Aprobación**: Los cambios destructivos (modificaciones de BD, borrar archivos) requieren confirmación por duplicado.

---

## 📐 Stack y Arquitectura (Basado en Proyecto Agenda)
El proyecto sigue una estructura desacoplada:
- **Backend (Python / Django)**:
  - Estructurado por módulos en la carpeta `backend/modulos/`.
  - Cada módulo encapsula sus modelos, vistas, controladores y lógica de negocio.
  - Base de datos relacional (PostgreSQL).
- **Frontend (TypeScript / React Native / Expo para Web)**:
  - Configurado en la carpeta `frontend/` usando Expo Web.
  - Estructura limpia y tipada (`App.tsx` y carpeta `src/`).
  - Navegación nativa con soporte web.
  - Diseño responsivo y estético premium.

---

## 🔐 🔍 Auditoría de Seguridad y Buenas Prácticas (Senior Code Reviewer)
Todo código desarrollado y cada funcionalidad debe superar los siguientes 10 puntos de control:

### 1. Contraseñas y datos sensibles
- Contraseñas: siempre hasheadas con bcrypt/Argon2 antes de guardarse en base de datos.
- Jamás devolver contraseñas o campos sensibles en las respuestas de endpoints.
- Cero secretos, API keys o tokens hardcodeados en el código. Todo va por variables de entorno (`.env`).
- Archivo `.env` en `.gitignore` y tener un `.env.example` limpio.

### 2. Exposición de datos en la API
- SELECT controlados: evitar `SELECT *`. Filtrar campos mediante serializadores o DTOs.
- Paginación obligatoria (limit, offset o cursor) en endpoints que devuelven colecciones/listas.
- Control del tamaño del payload.

### 3. Autenticación y autorización
- Rutas protegidas deben verificar obligatoriamente la sesión/token.
- Control de acceso de inquilino (tenant/owner): validar que el usuario autenticado solo acceda a recursos a los que tiene permisos o le pertenecen.
- JWT con expiración definida y rate limiting en endpoints críticos (login, registro).

### 4. Almacenamiento en el cliente
- No guardar datos altamente sensibles (passwords, tokens de sesión de larga duración) en texto plano desprotegido en localStorage.
- En dispositivos móviles/Expo, preferir `SecureStore` para tokens y credenciales.

### 5. Rendimiento y optimización
- Queries optimizadas con índices adecuados en la base de datos para filtros comunes y foreign keys.
- Evitar problemas de consultas N+1.
- Lazy loading de componentes/vistas en el frontend.

### 6. Infraestructura y configuración
- Configuraciones de Docker o servidores limpias, con usuarios de privilegios mínimos.

### 7. DNS, dominios y despliegue
- Las variables de entorno de producción no se commitean; se configuran en el proveedor (Vercel, Railway, etc.).

### 8. Conocimiento de red y protocolos
- Manejo correcto y semántico de códigos de estado HTTP (200, 201, 400, 401, 403, 404, 500).
- Configuración de CORS explícita (no usar comodines `*` en producción).
- Manejo real de errores con try/catch descriptivos y logging seguro.

### 9. Control de costos cloud
- Minimizar llamadas redundantes y optimizar lecturas.

### 10. Calidad de código
- Lógica de negocio separada de la capa de presentación y controladores.
- Funciones cortas, enfocadas a hacer una sola cosa.
- Cero código comentado o logs de depuración huérfanos en producción.

---

## 11. Migraciones de Base de Datos (Obligatorio)
- Toda modificación del esquema de base de datos deberá implementarse exclusivamente mediante migraciones de Django.
- Las migraciones constituyen la única fuente oficial de evolución del esquema.
- Está prohibida la ejecución de scripts SQL manuales sobre Neon, salvo procedimientos excepcionales aprobados explícitamente.
- Nunca eliminar, editar o reordenar migraciones ya aplicadas sin autorización expresa.
- Los cambios destructivos sobre modelos o datos requerirán doble confirmación antes de ejecutarse.

---

## 12. Respeto del Contrato Técnico Definitivo
- El presente AGENTS.md está subordinado al Contrato Técnico Definitivo del Proyecto Ícaro.
- Ningún agente podrá modificar la arquitectura aprobada ni sustituir tecnologías oficialmente definidas.
- Se mantienen como tecnologías obligatorias:
  * Backend: Django + Django REST Framework.
  * Frontend: React Native + Expo Web.
  * Base de datos: Neon PostgreSQL.
  * Backend Hosting: Railway.
  * Frontend Hosting: Vercel.
  * Almacenamiento productivo: Cloudflare R2 o AWS S3.
- Ningún agente podrá ampliar el alcance del MVP, incorporar nuevas funcionalidades o introducir mejoras no solicitadas sin aprobación explícita.
- Ante cualquier ambigüedad o conflicto entre especificaciones, el agente deberá detenerse y solicitar aclaración antes de actuar.

---

## 13. Auditoría Automática Obligatoria
- Toda operación mutable deberá generar automáticamente un registro de auditoría.
- Esto aplica como mínimo a solicitudes HTTP:
  * POST
  * PUT
  * PATCH
  * DELETE
- El sistema deberá registrar mediante AuditLog los siguientes campos:
  * usuario
  * accion
  * metodo_http
  * ruta
  * ip_address
  * user_agent
  * modelo_afectado
  * objeto_id
  * payload_changes
  * created_at
- Ningún endpoint mutable podrá omitirse deliberadamente del mecanismo de auditoría sin aprobación formal.

---

## 14. Política Obligatoria de Pruebas
- Ninguna funcionalidad se considerará finalizada sin pruebas correspondientes.
- Todo cambio deberá incluir:
  * pruebas unitarias nuevas o actualizadas;
  * validación de pruebas previamente existentes;
  * verificación de que el pipeline CI/CD continúa siendo exitoso;
  * cumplimiento de la cobertura mínima establecida por el proyecto.
- Ningún despliegue podrá realizarse si las pruebas automáticas fallan.

---

## 15. Política de Almacenamiento Seguro de Credenciales
- Nunca almacenar contraseñas en cliente ni servidor en texto plano.
- Expo Mobile (Android/iOS):
  * Utilizar expo-secure-store para el almacenamiento de tokens y credenciales persistentes.
- Expo Web:
  * No asumir compatibilidad equivalente con SecureStore.
  * Utilizar mecanismos aprobados por la arquitectura para minimizar la exposición de credenciales.
  * Evitar persistir refresh tokens en almacenamientos inseguros.
- Los secretos de producción deberán gestionarse exclusivamente mediante variables de entorno configuradas en los proveedores oficiales.

---

## Declaración Final
Estas disposiciones complementan las reglas existentes del AGENTS.md y son de cumplimiento obligatorio para cualquier desarrollador, agente automatizado o herramienta de generación asistida por IA que participe en la construcción del Proyecto Ícaro.

En caso de contradicción entre este documento y decisiones improvisadas durante la implementación, prevalecerá siempre el Contrato Técnico Definitivo aprobado para Ícaro.

