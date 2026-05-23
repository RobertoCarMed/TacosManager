# TacosManager

TacosManager es una plataforma SaaS multi-tenant para la gestión operativa de taquerías en tiempo real.

Permite a meseros y cocineros coordinar pedidos, cocina y catálogo de productos desde dispositivos móviles y tablets.

---

## Documentación

La documentación completa del proyecto vive en el submodule `docs/`.

Es la **fuente de verdad** compartida entre el frontend y el backend.

| Documento | Descripción |
|-----------|-------------|
| [`docs/business-rules.md`](docs/business-rules.md) | Reglas de negocio, roles, multi-tenant, estados de orden, prioridad de cocina |
| [`docs/feature-list.md`](docs/feature-list.md) | Lista de funcionalidades implementadas por módulo |
| [`docs/readmap.md`](docs/readmap.md) | Roadmap de desarrollo por etapas con estado de cada fase |
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura del sistema: módulos, modelos de dominio, seguridad, realtime |
| [`docs/backend-api.md`](docs/backend-api.md) | Referencia completa de endpoints REST con contratos de request/response |
| [`docs/backend-realtime.md`](docs/backend-realtime.md) | Referencia de Socket.IO: conexión, eventos, payloads, integración React Native |
| [`docs/api-reference.md`](docs/api-reference.md) | Referencia rápida de rutas, reglas de ownership y WebSocket |

---

## Stack Tecnológico

### Frontend

- React Native CLI + TypeScript
- Context API (estado global de autenticación)
- Redux Toolkit (módulo de órdenes)

### Backend

- NestJS 11 con arquitectura modular
- Prisma 7 + PostgreSQL
- JWT Authentication (Bearer token, expiración 1 día)
- Socket.IO v4 (realtime en el mismo puerto que REST)
- Docker

---

## Arquitectura

```
Cliente React Native
    │
    ├── HTTP REST          ├── WebSocket Socket.IO
    ▼                              ▼
NestJS API                NestJS WebSocket Gateway
    │                              │
    ├── Auth Module        ├── RealtimeGateway
    ├── Users Module       ├── Rooms: taqueria:<taqueriaId>
    ├── Products Module    └── JWT validation en handshake
    ├── Orders Module
    └── Realtime Module
    │
    ▼
Prisma ORM → PostgreSQL
```

---

## Roles

| Rol | Permisos |
|-----|----------|
| `COOK` | Ver todos los pedidos, cambiar estados, gestionar productos, cocina en tiempo real |
| `WAITER` | Crear pedidos, ver sus propios pedidos, editar pedidos propios |

---

## Iniciar el proyecto

### Instalar dependencias

```bash
npm install
```

### Inicializar el submodule de documentación

```bash
git submodule update --init --recursive
```

### Correr en Android

```bash
npm run android
```

### Correr en iOS

```bash
npm run ios
```

---

## Reglas de desarrollo

Antes de implementar cualquier funcionalidad:

1. Leer la documentación relevante en `docs/`.
2. Verificar que la implementación sea consistente con las reglas en `docs/business-rules.md`.
3. Consultar los contratos de API en `docs/backend-api.md`.
4. Al finalizar, actualizar los documentos afectados en `docs/`.

La documentación debe quedar sincronizada con el estado final del código en cada etapa.
