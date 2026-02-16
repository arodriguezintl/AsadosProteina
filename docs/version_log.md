# Historial de Versiones del Sistema

## v0.9.0 - Release Candidate 1 (Febrero 2026)
**Estado: Producción (BETA)**

Esta es la primera versión estable candidata para producción, con todos los módulos core funcionales.

### Características Principales
- **Autenticación y Roles (RBAC)**: Super Admin, Admin, Cajero, Cocinero, Repartidor.
- **Módulos Core**:
  - **Punto de Venta (POS)**: Creación de órdenes, selección de productos, cálculo de totales.
  - **Inventario**: Gestión de productos, categorías, control de stock en tiempo real.
  - **Recetas**: Definición de ingredientes y cálculo de costos.
  - **Finanzas**: Registro básico de transacciones.
  - **Recursos Humanos**: Gestión de empleados y asistencia.
- **Infraestructura**: Base de datos Supabase con RLS habilitado y migraciones consolidadas.

---

## v0.8.0 - Integración (Enero 2026)
**Estado: Desarrollo**

### Características
- Integración inicial de módulos.
- Implementación de lógica de descuento de inventario al vender.
- Primeros despliegues en entorno de pruebas.

---

## v0.5.0 - Prototipo Funcional (Diciembre 2025)
**Estado: Alpha**

### Características
- UI Base implementada.
- Estructura de base de datos preliminar.
- Pruebas de concepto de navegación y autenticación.
