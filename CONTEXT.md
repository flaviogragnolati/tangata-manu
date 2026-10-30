# Consultorios

Gestión de horas trabajadas por los profesionales en cada sitio, las tarifas por hora con que se pagan y los salarios y aguinaldos resultantes.

## Language

### Usuarios

**Baja de usuario**:
Marca reversible sobre un usuario que dejó de trabajar. Deja de aparecer en las listas y los filtros del admin y no puede cargar ni editar horas. Sus tarifas por usuario vigentes quedan inactivas. Sus registros de horas, salarios y aguinaldo se conservan y se siguen mostrando donde corresponde.
_Avoid_: Eliminar usuario, ocultar usuario, usuario inactivo, archivar usuario

**Reactivación de usuario**:
Fin de la baja de un usuario: vuelve a aparecer y a poder cargar horas. Sus tarifas por usuario siguen inactivas, así que cobra la tarifa del sitio hasta que se le cargue una nueva.
_Avoid_: Alta, restaurar usuario

### Sitios y tarifas

**Sitio**:
Lugar de trabajo donde un usuario carga horas; puede permitir o no horas de sábado (`allowsExtraHours`).
_Avoid_: Sede, site

**Tarifa**:
Valor por hora de un sitio para cada tipo de hora; puede estar activa o inactiva y opcionalmente asignada a un usuario.
_Avoid_: Valor de hora, rate

**Tarifa del sitio**:
Tarifa sin usuario asignado; aplica a todos los usuarios del sitio que no tengan una tarifa por usuario.
_Avoid_: Tarifa genérica, tarifa general

**Tarifa por usuario**:
Tarifa de un sitio asignada a un usuario puntual; para ese usuario reemplaza a la tarifa del sitio.
_Avoid_: Tarifa específica, tarifa propia, override

**Tarifa vigente**:
Tarifa marcada como activa. Cada sitio debería tener como máximo una tarifa del sitio vigente y una tarifa por usuario vigente por usuario.
_Avoid_: Tarifa actual

**Tarifa aplicable**:
La tarifa que se usaría hoy para un usuario en un sitio: su tarifa por usuario vigente si existe; si no, la tarifa del sitio vigente.

**Tarifa aplicada**:
La tarifa con la que se calculó el monto de un registro de horas.

**Tarifa desactualizada**:
Situación de un registro de horas cuya tarifa aplicada ya no es la tarifa aplicable para ese usuario y sitio.
_Avoid_: Tarifa no vigente, tarifa vieja

**Reemplazo de tarifa**:
Alta de una tarifa nueva que pasa a ser la vigente en lugar de otra del mismo alcance (tarifa del sitio, o tarifa por usuario del mismo usuario y sitio). La anterior queda inactiva y conserva sus registros de horas.
_Avoid_: Editar tarifa (para cambios hacia adelante), nueva versión

**Corrección de tarifa**:
Cambio de los valores de una tarifa existente, vigente o no. Siempre recalcula los registros de horas que tienen esa tarifa como tarifa aplicada.
_Avoid_: Editar tarifa (sin aclarar), ajuste

**Baja de tarifa por usuario**:
Desactivación de una tarifa por usuario sin reemplazo: el usuario vuelve a cobrar la tarifa del sitio vigente. La tarifa del sitio no tiene baja.
_Avoid_: Eliminar tarifa, borrar tarifa

**Borrado de tarifa**:
Eliminación definitiva de una tarifa cargada por error. Solo es posible si no tiene registros de horas. Si era vigente y reemplazó a otra, la reemplazada vuelve a ser la vigente.
_Avoid_: Eliminar tarifa, baja de tarifa

**Actualización retroactiva**:
Parte opcional de un reemplazo de tarifa o de una baja de tarifa por usuario: los registros de horas desde un período en adelante cambian de tarifa aplicada y se recalculan. Si se reemplaza una tarifa del sitio, alcanza a los registros con tarifa del sitio. Si se reemplaza una tarifa por usuario, a todos los registros de ese usuario en ese sitio. En una baja, a los registros de ese usuario en ese sitio con tarifa por usuario, que pasan a la tarifa del sitio vigente.
_Avoid_: Retroactivo desde una fecha

**Impacto**:
Los registros de horas que un cambio de tarifa recalcularía, con su monto actual y su monto nuevo.
_Avoid_: Afectados, preview

### Horas y salarios

**Registro de horas**:
Las horas de un usuario en un sitio durante un período, separadas por tipo de hora, con su monto calculado.
_Avoid_: Carga, hour log

**Tipo de hora**:
Categoría que define qué valor de la tarifa se aplica: normal (lunes a viernes), sábado hasta las 14:30 y sábado después de las 14:30.

**Período**:
Un mes de un año al que pertenece un registro de horas.
_Avoid_: Fecha (para referirse al mes)

**Salario**:
Suma de los montos de los registros de horas de un usuario (o de un sitio) en un período.
_Avoid_: Sueldo

**Aguinaldo**:
Monto acumulado por semestre: un doceavo de las horas del semestre, valuado con la tarifa aplicable. Para un usuario dado de baja, se valúa con la tarifa aplicada de su último registro de horas en cada sitio.
_Avoid_: Extra salary, SAC
