# Sauco-DE Architecture

## Arquitectura por Capas

La aplicación ha sido reorganizada siguiendo una arquitectura por capas para mejorar la mantenibilidad, escalabilidad y separación de responsabilidades. A continuación se describe la nueva estructura:

### Estructura de Carpetas

```
sauco-de/
├── src/
│   ├── commands/                 # Comandos de la extensión
│   │   └── CommandsService.ts    # Servicio para registrar y manejar comandos
│   ├── models/                   # Modelos de datos
│   │   ├── ApiModels.ts          # Interfaces para comunicación con la API
│   │   └── MetricModels.ts       # Interfaces para métricas de código
│   ├── services/                 # Servicios de la aplicación
│   │   ├── api/                  # Servicios relacionados con la API
│   │   │   └── ApiService.ts     # Servicio para comunicación con la API
│   │   └── metrics/              # Servicios relacionados con métricas
│   │       ├── MetricsService.ts # Servicio para cálculo de métricas
│   │       └── CognitiveComplexityMetric.ts # Implementación de métrica específica
│   ├── ui/                       # Componentes de interfaz de usuario
│   │   ├── tree/                 # Componentes para el árbol de navegación
│   │   │   ├── SaucoItem.ts      # Elemento del árbol
│   │   │   └── SaucoTreeDataProvider.ts # Proveedor de datos para el árbol
│   │   └── views/                # Vistas de la aplicación
│   │       ├── analysis/         # Vista de análisis
│   │       │   ├── SaucoAnalysisViewProvider.ts # Proveedor de vista de análisis
│   │       │   ├── main.js       # Script para la vista de análisis
│   │       │   └── styles.css    # Estilos para la vista de análisis
│   │       └── config/           # Vista de configuración
│   │           ├── SaucoConfigViewProvider.ts # Proveedor de vista de configuración
│   │           ├── main.js       # Script para la vista de configuración
│   │           └── styles.css    # Estilos para la vista de configuración
│   ├── utils/                    # Utilidades
│   │   └── ViewUtils.ts          # Utilidades para vistas
│   └── extension.ts              # Punto de entrada de la extensión
```

## Patrones de Diseño Implementados

### Patrón Servicio

Se han implementado servicios para encapsular la lógica de negocio y separar las responsabilidades:

- **ApiService**: Maneja la comunicación con la API de Sauco.
- **MetricsService**: Gestiona el cálculo y procesamiento de métricas de código.
- **CommandsService**: Centraliza el registro y manejo de comandos de la extensión.

### Patrón Proveedor

Se utilizan proveedores para suministrar datos y funcionalidad a diferentes componentes:

- **SaucoTreeDataProvider**: Proporciona datos para el árbol de navegación.
- **SaucoAnalysisViewProvider**: Gestiona la vista de análisis de código.
- **SaucoConfigViewProvider**: Maneja la vista de configuración.

### Patrón Modelo-Vista

Se ha separado claramente los modelos de datos (en la carpeta `models`) de las vistas (en la carpeta `ui/views`), permitiendo una mejor separación de responsabilidades.

## Beneficios de la Nueva Arquitectura

1. **Mantenibilidad**: Código más fácil de mantener gracias a la clara separación de responsabilidades.
2. **Escalabilidad**: Facilita la adición de nuevas características sin afectar el código existente.
3. **Testabilidad**: Estructura que facilita la implementación de pruebas unitarias.
4. **Reutilización**: Componentes modulares que pueden ser reutilizados en diferentes partes de la aplicación.
5. **Claridad**: Estructura de proyecto más intuitiva y fácil de entender para nuevos desarrolladores.

## Flujo de Datos

1. El usuario interactúa con la extensión a través de comandos o la interfaz de usuario.
2. Los comandos son manejados por el `CommandsService`.
3. Las solicitudes de análisis o métricas son procesadas por los servicios correspondientes.
4. Los resultados son mostrados al usuario a través de las vistas apropiadas.

## Próximos Pasos

- Implementar pruebas unitarias para cada componente.
- Añadir documentación detallada para cada servicio y componente.
- Considerar la implementación de un sistema de plugins para extender la funcionalidad.
