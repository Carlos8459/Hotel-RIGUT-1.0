# Prompt Detallado: Aplicación de Gestión Hotelera "Hotel RIGUT" (Versión Nativa con Flutter)

## 1. Resumen General

"Hotel RIGUT" es una aplicación nativa para Android, desarrollada con Flutter, que ofrece una solución moderna, segura y eficiente para la gestión integral de un hotel. Permite al personal y a los administradores manejar todos los aspectos de la operación diaria, desde el estado de las habitaciones y las reservas de los huéspedes hasta el control financiero y la gestión de usuarios. La aplicación está diseñada para ofrecer un rendimiento y una experiencia de usuario óptimos en dispositivos móviles.

---

## 2. Pila Tecnológica

*   **Framework de Desarrollo**: [Flutter](https://flutter.dev/) con lenguaje [Dart](https://dart.dev/).
*   **Backend y Base de Datos**: [Firebase](https://firebase.google.com/) (Firestore para la base de datos en tiempo real y Firebase Authentication para la gestión de usuarios).
*   **UI/UX**:
    *   **Diseño**: [Material Design 3](https://m3.material.io/) - Utilizando el catálogo de widgets nativos de Flutter (`Card`, `Button`, `TextField`, etc.).
    *   **Paquetes de UI**:
        *   **Iconos**: [lucide_flutter](https://pub.dev/packages/lucide_flutter) - Una librería de iconos limpia y consistente.
        *   **Fuentes**: [google_fonts](https://pub.dev/packages/google_fonts) - Para cargar dinámicamente las tipografías 'Poppins' y 'PT Sans'.
        *   **Gráficos**: [fl_chart](https://pub.dev/packages/fl_chart) - Para visualizaciones de datos en las estadísticas.
*   **Estado y Gestión de Datos**:
    *   **Gestión de Estado**: [Riverpod](https://riverpod.dev/) o [Bloc](https://bloclibrary.dev/) - Para manejar el estado de la aplicación de manera eficiente y escalable.
    *   **Modelos de Datos**: [freezed](https://pub.dev/packages/freezed) - Para la creación de modelos de datos inmutables y seguros.
*   **Formularios**: Widgets nativos de Flutter (`Form`, `TextFormField`) para la entrada y validación de datos.
*   **Utilidades**:
    *   `intl` para el formato y manipulación de fechas.
    *   `excel` para la generación y exportación de archivos `.xlsx`.

---

## 3. Estructura del Proyecto

El proyecto sigue una estructura estándar y escalable para una aplicación Flutter:

*   `lib/`: Contiene todo el código fuente de la aplicación en Dart.
    *   `main.dart`: Punto de entrada de la aplicación, inicialización de Firebase y configuración del proveedor de estado.
    *   `screens/` o `features/`: Directorios que agrupan los archivos por funcionalidad o pantalla.
        *   `auth/`: Pantallas de Login, Registro y Recuperación de PIN.
        *   `dashboard/`: Pantalla principal con la vista de habitaciones.
        *   `reservations/`, `customers/`, `stats/`, `settings/`, `admin/`.
    *   `widgets/`: Componentes reutilizables de la interfaz de usuario.
        *   `common/` o `ui/`: Widgets genéricos como botones personalizados, tarjetas, etc.
        *   `dashboard_widgets/`: Widgets específicos para el dashboard.
    *   `services/`: Clases para interactuar con servicios externos, principalmente Firebase.
        *   `auth_service.dart`: Lógica de autenticación.
        *   `firestore_service.dart`: Lógica para interactuar con Firestore (lectura/escritura de datos).
    *   `providers/` o `state/`: Contiene los proveedores de estado (ej. Riverpod) que exponen los datos y la lógica de negocio a la UI.
    *   `models/`: Define las clases de los modelos de datos (`Room`, `Reservation`, etc.), generadas con `freezed`.
    *   `utils/`: Funciones de utilidad, constantes de colores, temas y estilos.
    *   `firebase_options.dart`: Archivo de configuración de Firebase generado automáticamente.
*   `pubspec.yaml`: Archivo de configuración del proyecto donde se definen las dependencias (paquetes) y los assets.
*   `docs/`: Documentación del proyecto.
    *   `backend.json`: Define el esquema de datos (entidades) y la estructura de las colecciones de Firestore.
*   `android/` y `ios/`: Carpetas del proyecto nativo para configuración específica de cada plataforma.

---

## 4. Diseño y Experiencia de Usuario (UI/UX)

*   **Tema Oscuro por Defecto**: La interfaz utiliza un tema oscuro (`dark-mode`) elegante y moderno que reduce la fatiga visual, aprovechando los temas de Material Design en Flutter.
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
    *   **Titulares (`Poppins`)**: Una fuente moderna y audaz para los títulos, cargada con `google_fonts`.
    *   **Cuerpo (`PT Sans`)**: Una fuente limpia y legible para el texto general.
*   **Diseño Visual**:
    *   **Basado en Tarjetas**: La información se presenta en widgets `Card` con bordes redondeados y sombras sutiles (`elevation`), creando una interfaz organizada y fácil de escanear.
    *   **Consistencia Nativa**: Se utilizan los widgets de Material Design de Flutter para garantizar una experiencia de usuario coherente y familiar en Android.
    *   **Navegación**: Se usa un `BottomNavigationBar` para el acceso rápido a las secciones principales (Dashboard, Reservas, Herramientas, etc.), ideal para móviles.

---

## 5. Funcionalidades Clave (Detallado)

*   **Autenticación y Roles**:
    *   **Login**: Los usuarios inician sesión con `nombre de usuario` y `PIN`. El sistema busca el correo asociado al usuario para autenticarlo con Firebase.
    *   **Registro Seguro**: Solo se pueden crear nuevas cuentas usando un `PIN de desarrollador` (`231005`), asignando el rol de "Admin" por defecto.
    *   **Recuperación de PIN**: Un administrador puede iniciar el proceso de recuperación para un usuario. Se debe proporcionar el `nombre de usuario` y el `PIN de desarrollador`. Si son correctos, se envía un correo de recuperación al email del usuario.
    *   **Roles y Permisos**: Existen tres roles (`Admin`, `Socio`, `Colaborador`) con permisos granulares que se gestionan en una pantalla de administración. Los permisos controlan el acceso a estadísticas, ajustes, gestión de gastos, etc.
*   **Dashboard de Habitaciones**:
    *   **Vista de Cuadrícula (`GridView`)**: Muestra todas las habitaciones como tarjetas interactivas.
    *   **Información Rápida**: Cada tarjeta muestra el estado actual, nombre del huésped, fechas y consumos.
    *   **Acciones Rápidas**: Diálogos (`AlertDialog`) para hacer check-out o registrar pagos directamente desde la tarjeta.
*   **Gestión de Reservas**:
    *   **Check-in Histórico**: Los administradores pueden registrar una estadía que ocurrió en el pasado.
    *   **Formulario Inteligente**: Sugiere clientes existentes mientras se escribe el nombre. Permite seleccionar una o varias habitaciones.
*   **Gestión de Clientes**:
    *   **Base de Datos Centralizada**: Muestra una lista (`ListView`) de todos los clientes.
    *   **Búsqueda y Filtros**: Permite buscar y filtrar la lista de clientes.
    *   **Historial Completo**: Al seleccionar un cliente, un diálogo (`Dialog` o `BottomSheet`) muestra su historial de visitas.
*   **Herramientas**:
    *   **Registro de Gastos**: Un formulario para registrar gastos del hotel.
    *   **Exportación a Excel**: Permite a los usuarios con permisos generar y compartir un reporte `.xlsx`.
*   **Estadísticas**:
    *   **Dashboard Financiero**: Muestra ingresos, gastos y tasa de ocupación en un rango de fechas.
    *   **Gráficos Interactivos**: Visualiza el rendimiento con gráficos de barras (usando `fl_chart`).
*   **Configuración y Administración**:
    *   **Gestión de Habitaciones y Consumos**: Edición de precios, tipos y estado de habitaciones.
    *   **Gestión de Usuarios y Permisos (Admin)**: Creación de usuarios y asignación de roles.
    *   **Automatización de WhatsApp**: Configura un mensaje de agradecimiento para enviar a los clientes.

---

## 6. Flujo de Datos y Lógica (Firebase)

*   **Firestore Database**:
    *   **Estructura NoSQL en tiempo real**: Toda la información se almacena en colecciones de Firestore.
    *   **Colecciones Principales**: `/users`, `/rooms`, `/reservations`, `/expenses`, `/customers`, `/settings`. (La estructura es idéntica a la versión web).
    *   **Reactividad**: La aplicación utiliza `StreamBuilder` en Flutter para escuchar los `snapshots` de las colecciones de Firestore en tiempo real. Cualquier cambio en la base de datos se refleja instantáneamente en la interfaz de usuario.
*   **Firebase Authentication**:
    *   Gestiona el ciclo de vida de los usuarios. El servicio de autenticación en Flutter (`AuthService`) encapsula las llamadas a `firebase_auth`.
*   **Manejo de Errores de Seguridad**:
    *   La lógica en los servicios de Firestore debe estar preparada para capturar excepciones de tipo `FirebaseException` con el código `permission-denied`.
    *   Cuando se detecta este error, la UI debe reaccionar mostrando un mensaje claro al usuario (usando un `SnackBar` o un `AlertDialog`) en lugar de simplemente fallar, facilitando la depuración de las reglas de seguridad.