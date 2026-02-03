# Prompt Detallado: Aplicación de Gestión Hotelera "Hotel RIGUT"

## 1. Resumen General

"Hotel RIGUT" es una aplicación web progresiva (PWA) moderna, segura y eficiente, diseñada para la gestión integral de un hotel. Permite al personal y a los administradores manejar todos los aspectos de la operación diaria, desde el estado de las habitaciones y las reservas de los huéspedes hasta el control financiero y la gestión de usuarios. La aplicación está optimizada para ser completamente funcional tanto en dispositivos de escritorio como móviles, pudiendo instalarse en el teléfono para una experiencia similar a una app nativa.

---

## 2. Pila Tecnológica

*   **Frontend**: [Next.js](https://nextjs.org/) con [React](https://reactjs.org/) (usando App Router y Server Components).
*   **Backend y Base de Datos**: [Firebase](https://firebase.google.com/) (Firestore para la base de datos en tiempo real y Firebase Authentication para la gestión de usuarios).
*   **UI/UX**:
    *   **Componentes**: [ShadCN/UI](https://ui.shadcn.com/) - Una colección de componentes reutilizables y accesibles.
    *   **Estilos**: [Tailwind CSS](https://tailwindcss.com/) - Un framework de CSS "utility-first" para un diseño rápido y personalizado.
    *   **Iconos**: [Lucide React](https://lucide.dev/) - Una librería de iconos limpia y consistente.
    *   **Gráficos**: [Recharts](https://recharts.org/) - Para visualizaciones de datos en las estadísticas.
*   **Formularios**: [React Hook Form](https://react-hook-form.com/) con [Zod](https://zod.dev/) para validación de esquemas.
*   **Utilidades**:
    *   `date-fns` para la manipulación de fechas.
    *   `xlsx` para la exportación de datos a Excel.

---

## 3. Estructura del Proyecto

El proyecto sigue la estructura estándar de una aplicación Next.js con el App Router (`src/app`):

*   `src/app/`: Contiene las rutas principales de la aplicación.
    *   Rutas públicas como `page.tsx` (Login), `register/page.tsx` y `forgot-password/page.tsx`.
    *   `/dashboard/page.tsx`: Pantalla principal que muestra el estado de todas las habitaciones.
    *   `/reservations/page.tsx`: Historial y gestión de reservas.
    *   `/customers/page.tsx`: Base de datos de clientes con su historial.
    *   `/stats/...`: Páginas de estadísticas (financieras, por habitación, etc.).
    *   `/settings/...`: Secciones de configuración para la cuenta, habitaciones, notificaciones, etc.
    *   `/admin/...`: Paneles de administración avanzada para usuarios y permisos.
    *   `layout.tsx`: Layout raíz que incluye proveedores de contexto y estilos globales.
    *   `globals.css`: Archivo de estilos globales y variables de tema de Tailwind/ShadCN.
*   `src/components/`: Componentes de React reutilizables.
    *   `ui/`: Componentes base de ShadCN (Button, Card, Input, etc.).
    *   `dashboard/`: Componentes específicos para el dashboard, como los modales de detalles.
    *   `auth/`: Componentes relacionados con la autenticación, como el formulario de login.
*   `src/firebase/`: Módulo centralizado para toda la configuración y lógica de Firebase.
    *   `config.ts`: Configuración del proyecto de Firebase.
    *   `provider.tsx`: Proveedor de contexto que inicializa y distribuye los servicios de Firebase (Auth, Firestore) y el estado del usuario.
    *   `index.ts`: Archivo "barrel" que exporta hooks y funciones de utilidad de Firebase.
    *   `firestore/`: Hooks personalizados como `useCollection` y `useDoc` para interactuar con Firestore en tiempo real.
*   `src/lib/`: Librerías de utilidad.
    *   `types.ts`: Definiciones de tipos de TypeScript para los modelos de datos (Room, Reservation, etc.).
    *   `utils.ts`: Funciones de utilidad general, como `cn` para fusionar clases de Tailwind.
    *   `icons.tsx`: Mapeo de iconos para componentes.
*   `docs/`: Documentación del proyecto.
    *   `backend.json`: Define el esquema de datos (entidades) y la estructura de las colecciones de Firestore.
*   `public/`: Archivos estáticos, como el `manifest.json` para la PWA.

---

## 4. Diseño y Experiencia de Usuario (UI/UX)

*   **Tema Oscuro por Defecto**: La interfaz utiliza un tema oscuro (`dark-mode`) elegante y moderno que reduce la fatiga visual. La paleta de colores se centra en tonos de azul oscuro y cian, con el color primario (`primary`) siendo un cian brillante que resalta las acciones importantes.
*   **Paleta de Colores**:
    *   **Fondo (`background`)**: Un azul noche profundo (`204 30% 12%`).
    *   **Tarjetas (`card`)**: Un azul ligeramente más claro y semitransparente (`204 30% 16% / 0.6`), que da una sensación de profundidad.
    *   **Primario (`primary`)**: Un cian vibrante (`185 75% 45%`) usado para botones, enlaces y elementos activos.
    *   **Acento (`accent`)**: Un verde azulado (`165 65% 40%`) para estados de "hover" y elementos secundarios.
    *   **Colores de Estado**: Se usan colores semánticos para los estados de las habitaciones:
        *   **Rojo**: Ocupada.
        *   **Verde**: Disponible.
        *   **Azul**: Limpieza Pendiente.
        *   **Naranja**: Mantenimiento.
*   **Tipografía**:
    *   **Titulares (`Poppins`)**: Una fuente moderna y audaz para los títulos.
    *   **Cuerpo (`PT Sans`)**: Una fuente limpia y legible para el texto general.
*   **Diseño Visual**:
    *   **Basado en Tarjetas**: La información se presenta en tarjetas (`Card`) con bordes redondeados y sombras sutiles, creando una interfaz organizada y fácil de escanear.
    *   **Consistencia**: Se reutilizan componentes de ShadCN en toda la app, garantizando una experiencia de usuario coherente.
    *   **Responsivo y Móvil-Primero**: El diseño está pensado para funcionar a la perfección en móviles. Incluye una barra de navegación inferior fija para un acceso rápido a las secciones principales en pantallas pequeñas. En escritorio, la navegación es más tradicional.
*   **Aplicación Web Progresiva (PWA)**: La aplicación puede ser "instalada" en la pantalla de inicio de cualquier dispositivo móvil, funcionando offline (en la medida de lo posible) y ofreciendo una experiencia rápida y fluida, similar a una app nativa.

---

## 5. Funcionalidades Clave (Detallado)

*   **Autenticación y Roles**:
    *   **Login**: Los usuarios inician sesión con `nombre de usuario` y `PIN`. El sistema busca el correo asociado al usuario para autenticarlo con Firebase.
    *   **Registro Seguro**: Solo se pueden crear nuevas cuentas usando un `PIN de desarrollador` (`231005`), asignando el rol de "Admin" por defecto.
    *   **Recuperación de PIN**: Un administrador puede iniciar el proceso de recuperación para un usuario. Se debe proporcionar el `nombre de usuario` y el `PIN de desarrollador`. Si son correctos, se envía un correo de recuperación al email del usuario.
    *   **Roles y Permisos**: Existen tres roles (`Admin`, `Socio`, `Colaborador`) con permisos granulares que se gestionan en `src/app/admin/permissions/page.tsx`. Los permisos controlan el acceso a estadísticas, ajustes, gestión de gastos, etc.
*   **Dashboard de Habitaciones (`/dashboard`)**:
    *   **Vista de Cuadrícula**: Muestra todas las habitaciones como tarjetas interactivas.
    *   **Información Rápida**: Cada tarjeta muestra el estado actual (Disponible, Ocupada, Limpieza, etc.) con un color distintivo, el nombre del huésped, las fechas de la estadía y los consumos extras.
    *   **Acciones Rápidas**: Permite hacer check-out o registrar pagos directamente desde la tarjeta.
    *   **Búsqueda y Filtros**: Se puede buscar por nombre de huésped o habitación y filtrar por fecha.
*   **Gestión de Reservas (`/new-reservation`)**:
    *   **Check-in Histórico**: Los administradores pueden registrar una estadía que ocurrió en el pasado, incluyendo fechas, datos del huésped y consumos. Esta información se refleja correctamente en las estadísticas de las fechas correspondientes.
    *   **Formulario Inteligente**: Sugiere clientes existentes mientras se escribe el nombre. Permite seleccionar una o varias habitaciones y calcula el costo total automáticamente.
*   **Gestión de Clientes (`/customers`)**:
    *   **Base de Datos Centralizada**: Muestra una lista de todos los clientes que han tenido una reserva.
    *   **Búsqueda y Filtros**: Permite buscar por nombre y filtrar por clientes recientes o frecuentes, por fecha de visita o por habitación ocupada.
    *   **Historial Completo**: Al seleccionar un cliente, un modal muestra todas sus visitas pasadas, notas y datos de contacto. Los administradores pueden editar el nombre del cliente.
*   **Herramientas (`/tools`)**:
    *   **Registro de Gastos**: Un formulario para registrar gastos del hotel, clasificándolos por categoría (Mantenimiento, Salarios, etc.).
    *   **Exportación a Excel**: Permite a los usuarios con permisos exportar un reporte completo en formato `.xlsx`. El reporte incluye hojas para Resumen Financiero, Reservas, Gastos, Clientes y más, filtrado por un rango de fechas.
*   **Estadísticas (`/stats`)**:
    *   **Dashboard Financiero**: Muestra ingresos netos, brutos, gastos totales y tasa de ocupación en un rango de fechas personalizable.
    *   **Gráficos Interactivos**: Visualiza el rendimiento diario y mensual con gráficos de barras.
    *   **Desgloses Específicos**: Secciones dedicadas a analizar el rendimiento por habitación individual y los ingresos generados por consumos extras.
*   **Configuración y Administración**:
    *   **Gestión de Habitaciones y Consumos**: Permite a los socios y administradores editar el precio, tipo y estado de las habitaciones, así como añadir, editar o eliminar productos de consumo extra.
    *   **Gestión de Usuarios y Permisos (Admin)**: Los administradores pueden crear nuevos usuarios, eliminar perfiles y asignar roles (`Admin`, `Socio`, `Colaborador`) y permisos específicos a cada uno.
    *   **Automatización de WhatsApp**: Permite configurar un mensaje de agradecimiento que se puede enviar a los clientes un día después de su check-out.

---

## 6. Flujo de Datos y Lógica (Firebase)

*   **Firestore Database**:
    *   **Estructura NoSQL en tiempo real**: Toda la información de la aplicación se almacena en colecciones de Firestore.
    *   **Colecciones Principales**:
        *   `/users/{userId}`: Almacena el perfil de cada usuario, incluyendo su rol y permisos.
        *   `/rooms/{roomId}`: Contiene la información estática de cada habitación (precio base, tipo, estado de mantenimiento).
        *   `/reservations/{reservationId}`: Guarda cada reserva, incluyendo datos del huésped, fechas, estado del pago, y consumos.
        *   `/expenses/{expenseId}`: Registros de todos los gastos del hotel.
        *   `/customers/{customerId}`: Perfiles de clientes con su información de contacto.
        *   `/settings/...`: Documentos únicos para configuraciones globales como las de notificaciones y WhatsApp.
    *   **Reactividad**: La aplicación utiliza `onSnapshot` (a través de los hooks `useCollection` y `useDoc`) para escuchar cambios en la base de datos en tiempo real, actualizando la interfaz automáticamente.
*   **Firebase Authentication**:
    *   Gestiona el ciclo de vida de los usuarios (creación, inicio de sesión, cambio de contraseña). La app abstrae el email del usuario final, permitiendo un login por nombre de usuario para una mejor experiencia.
*   **Manejo de Errores de Seguridad**:
    *   La aplicación tiene un sistema robusto para capturar errores de "permisos insuficientes" de Firestore.
    *   En lugar de bloquear la app, un `errorEmitter` global captura estos errores y los presenta al usuario en el entorno de desarrollo con un contexto detallado, facilitando la depuración de las reglas de seguridad.