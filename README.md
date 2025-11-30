# Examen Técnico Fullstack

**Tecnologías:** Angular 19 • Ionic • Express.js • Firebase • MySQL

---

## Estructura del Proyecto

```
examen/
├── examen-app/            # Ionic (App móvil)
├── examen-app-frontend/   # Angular 19 (Panel admin)
└── examen-app-backend/    # Express.js + TypeScript
```

---

## Instalación y Ejecución

### 1. Base de Datos MySQL

Crear la base de datos antes de ejecutar el backend:

```sql
CREATE DATABASE examen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Las tablas se crean automáticamente al iniciar el servidor (Sequelize sync).

### 2. Backend
```bash
cd examen-app-backend
npm install
# Configurar .env (ver .env.example)
npm run dev
# http://localhost:3000
```

### 3. Frontend Angular
```bash
cd examen-app-frontend
npm install
ng serve
# http://localhost:4200
```

### 4. Ionic (App Móvil)
```bash
cd examen-app
npm install
ionic serve
# http://localhost:8100
```

---

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Registro |
| CRUD | `/api/users` | Usuarios |
| CRUD | `/api/tasks` | Tareas |
| CRUD | `/api/products` | Productos |
| CRUD | `/api/orders` | Órdenes |
| POST | `/api/notifications/send` | Push FCM |

---

## Diseño SQL: Usuarios → Órdenes → Productos

```
┌─────────┐     ┌─────────┐     ┌────────────────┐     ┌──────────┐
│  users  │────<│ orders  │────<│ order_products │>────│ products │
│  (1)    │ 1:N │  (N)    │ 1:N │     (N:M)      │ N:1 │   (1)    │
└─────────┘     └─────────┘     └────────────────┘     └──────────┘
```

**Optimización de JOINs:**
- Índices en FK: `user_id`, `order_id`, `product_id`
- Índice compuesto: `(user_id, status)` para filtros
- Usar INNER JOIN en lugar de LEFT cuando hay datos
- LIMIT para paginación

---

## Diseño NoSQL: Chat con Firestore

```javascript
// Colección: chats
{
  id: "chat_123",
  type: "group",                    // "private" | "group"
  participants: ["user_1", "user_2"],
  lastMessage: {
    text: "Hola",
    senderId: "user_1",
    timestamp: Timestamp
  },
  createdAt: Timestamp
}

// Subcolección: chats/{chatId}/messages
{
  id: "msg_456",
  senderId: "user_1",
  text: "Hola a todos",
  type: "text",                     // "text" | "image" | "file"
  readBy: ["user_1", "user_2"],
  reactions: [
    { emoji: "👍", userId: "user_2" }
  ],
  createdAt: Timestamp
}

// Colección: users
{
  id: "user_1",
  displayName: "Juan",
  status: "online",                 // "online" | "offline"
  lastSeen: Timestamp
}
```

**Decisiones:**
- Subcolecciones para mensajes (paginación eficiente)
- `lastMessage` embebido (preview sin query extra)
- `reactions` como array (fácil actualización)

---

## Respuestas Teóricas

### Subject vs BehaviorSubject vs ReplaySubject
- **Subject**: No guarda valor, emite solo a suscriptores actuales
- **BehaviorSubject**: Requiere valor inicial, emite último valor al suscribirse
- **ReplaySubject**: Guarda N valores, los emite a nuevos suscriptores

### Ciclo de vida Angular
`constructor` → `ngOnChanges` → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterViewInit` → `ngOnDestroy`

### OnPush
Solo detecta cambios cuando: `@Input` cambia por referencia, evento interno, Observable con `async`, o `markForCheck()`

### Middleware Express
Función con acceso a `req`, `res`, `next()`. Usos: auth, validación, logging, errores.

### CORS
Permite peticiones cross-origin. Configurar: `origin`, `methods`, `headers`, `credentials`.

### SQL vs NoSQL
- **SQL**: Datos relacionales, transacciones ACID, esquema fijo
- **NoSQL**: Datos flexibles, escalabilidad horizontal, tiempo real

### Protección SQL Injection / XSS
- Usar ORM (Sequelize parametriza automáticamente)
- Angular sanitiza interpolaciones por defecto
- Helmet.js para headers de seguridad
