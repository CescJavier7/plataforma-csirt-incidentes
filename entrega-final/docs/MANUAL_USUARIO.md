# 📖 Manual de Usuario y Operación del SOC

## 1. Inicio de Sesión
1. Abra su navegador web e ingrese a la dirección del sistema (`http://localhost:3000` o la URL de producción).
2. Introduzca su correo electrónico corporativo y contraseña asignada:
   - **Administrador:** `admin@incidentes.com`
   - **Supervisor:** `supervisor@incidentes.com`
   - **Analista:** `analista@incidentes.com`
3. Haga clic en **"Ingresar al SOC"**. Si las credenciales son válidas, el sistema cargará el panel operativo mostrando su nombre y rol en la barra superior.

---

## 2. Operación según Roles

### 2.1 Para Analistas de Ciberseguridad (Nivel 1)
- **Consultar la bandeja de incidentes:** En la tabla central se listan todos los incidentes activos. Puede filtrar por estado (`ABIERTO`, `EN_PROCESO`, `RESUELTO`, `CERRADO`) o por prioridad (`BAJA`, `MEDIA`, `ALTA`, `CRITICA`).
- **Registrar nuevo incidente:**
  1. Complete el formulario "Registrar Nuevo Incidente de Seguridad".
  2. Indique un título representativo (mínimo 5 caracteres).
  3. Describa detalladamente el vector de ataque observado, IPs sospechosas o activos comprometidos.
  4. Seleccione el nivel de severidad y presione **"Reportar Incidente"**.

### 2.2 Para Supervisores del SOC (Nivel 2)
- **Actualizar estado de un incidente:**
  1. En la columna de estado del incidente en la tabla, seleccione el nuevo estado deseado (`EN_PROCESO`, `RESUELTO`, `CERRADO`).
  2. Presione el botón **"Guardar"**.
  3. Si seleccionó el estado **`CERRADO`**, el sistema solicitará una **Resolución Técnica Obligatoria**.
  4. Ingrese las acciones ejecutadas para contener y erradicar la amenaza (mínimo 5 caracteres). El sistema no permitirá cerrar el ticket si este campo está vacío.

### 2.3 Para Administradores del SOC (Nivel 3)
- **Eliminación y Depuración:**
  1. Los administradores disponen del botón rojo **"Eliminar"** en cada fila.
  2. Al confirmarlo, el registro será purgado de la base de datos relacional de manera segura.

---

## 3. Cierre Seguro de Sesión
- Al finalizar el turno o alejarse de la estación, presione el botón **"Cerrar sesión"** en la esquina superior derecha. El token JWT será eliminado inmediatamente del almacenamiento del navegador.

