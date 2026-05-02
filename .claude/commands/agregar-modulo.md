# Guía para Agregar Nuevo Módulo al ERP Küme

Instrucciones para implementar un nuevo módulo siguiendo los patrones del proyecto.

## Instrucciones para Claude

Cuando se invoque con un nombre de módulo, implementa el módulo completo siguiendo este flujo:

## Checklist de Implementación

### 1. Definir Tipos (src/types/index.ts)
```typescript
export interface NuevoEntidad {
  id: string;
  // ... campos específicos
  createdAt: string;
  updatedAt: string;
}
```

### 2. Agregar Store a la Base de Datos (src/services/database.ts)
- Incrementar `version` en 1
- Agregar en `onupgradeneeded`:
```javascript
if (!db.objectStoreNames.contains('nuevoStore')) {
  const store = db.createObjectStore('nuevoStore', { keyPath: 'id' });
  store.createIndex('campoIndex', 'campoIndex');
}
```
- Agregar métodos CRUD (create, get, getAll, update, delete)

### 3. Crear Página (src/pages/NuevoModulo.tsx)
Estructura estándar del proyecto:
```tsx
import React, { useState, useEffect } from 'react';
import { /* iconos de lucide-react */ } from 'lucide-react';
import { db } from '../services/database';
import { NuevoEntidad } from '../types';

export default function NuevoModulo() {
  const [items, setItems] = useState<NuevoEntidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await db.getAll...();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nombre del Módulo
        </h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </button>
      </div>
      {/* Contenido */}
    </div>
  );
}
```

### 4. Agregar Ruta (src/App.tsx)
```tsx
import NuevoModulo from './pages/NuevoModulo';
// En Routes:
<Route path="nuevo-modulo" element={<NuevoModulo />} />
```

### 5. Agregar a Navegación (src/components/Layout.tsx)
```tsx
import { IconName } from 'lucide-react';
// En navigation array:
{ name: 'Nombre Módulo', href: '/nuevo-modulo', icon: IconName },
```

## Convenciones del Proyecto

### Estilos
- `className="text-gray-900 dark:text-white"` — textos
- `className="bg-white dark:bg-gray-800"` — fondos de tarjetas
- `className="border-gray-200 dark:border-gray-700"` — bordes
- `className="bg-blue-600 hover:bg-blue-700 text-white"` — botones primarios
- `className="bg-gray-100 dark:bg-gray-700"` — fondos secundarios

### Formularios
- Usar `useState` para estado del formulario
- Validar antes de guardar
- Mostrar feedback al usuario (toast o alerta)

### Base de Datos
- IndexedDB vía `db` service en `src/services/database.ts`
- IDs: `crypto.randomUUID()`
- Timestamps: `new Date().toISOString()`

### Iconos
- Usar lucide-react: `import { NombreIcono } from 'lucide-react'`

## Módulos Ya Implementados (no duplicar)
- Dashboard `/`
- Residentes `/residents`
- Fichas Clínicas `/medical-records`
- Planes de Atención `/care-plans`
- Monitoreo Diario `/daily-monitoring`
- Protocolos `/protocols`
- Personal `/staff`
- Reclamos `/complaints`
- Contratos `/contracts`
- Permisos `/permits`
- Reportes SENAMA `/senama-report`
- Egresos `/egress`
- Exportar `/export`
