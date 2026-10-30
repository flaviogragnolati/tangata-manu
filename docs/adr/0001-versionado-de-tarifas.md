# Tarifas versionadas: monto = horas × tarifa aplicada

**Status:** accepted (2026-10-29)

Salarios, aguinaldo e historial calculan el monto de cada registro de horas con los valores actuales de su tarifa aplicada, así que cambiar los valores de una tarifa en el lugar cambia montos ya cargados. Decidimos que el monto de un registro siempre es horas × valores de su tarifa aplicada, y que una tarifa con registros nunca cambia de valor sin que esos registros se recalculen. Los cambios hacia adelante son un **reemplazo de tarifa**: se crea una tarifa nueva y la anterior queda inactiva con sus registros intactos, con actualización retroactiva opcional desde un período. Cambiar los valores en el lugar es una **corrección de tarifa** y siempre recalcula los registros que la usan. El alcance de una tarifa (sitio y usuario) nunca cambia, y una tarifa inactiva no se vuelve a activar.

## Considered Options

- **Monto congelado:** editar en el lugar sin recalcular y que Salarios lea `UserHourLog.amount`. Se descartó porque la tarifa aplicada que se muestra dejaría de explicar el monto (mismo id, otros valores) y obligaba a reescribir todos los cálculos de salarios y aguinaldo.
- **Mixto** (versiones para cambios hacia adelante y monto congelado para algunas correcciones): dos fuentes de verdad para el monto, difícil de explicar en la UI.

## Consequences

- No se agrega un "editar sin recalcular". Si un caso parece pedirlo, es un reemplazo.
- Toda mutación que cambia horas o tarifa aplicada (carga, edición, corrección, retroactivo, baja) vuelve a escribir `amount` con la regla, para que el monto guardado coincida con lo que muestran las pantallas.
