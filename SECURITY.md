# Politica de Seguridad

## Versiones Soportadas

MC Launch esta en desarrollo activo, por lo que el soporte de seguridad se concentra en el codigo mas reciente de la rama principal y en las builds mas recientes generadas localmente o por CI.

| Version / Rama | Soporte |
| --- | --- |
| `master` / rama principal actual | Si |
| Ultima build local o generada por CI | Si |
| Snapshots viejos, forks o ramas desactualizadas | No |

## Como Reportar una Vulnerabilidad

Si encuentras un problema de seguridad, por favor no abras un issue publico con los detalles del exploit.

Ruta recomendada de reporte:

1. Abre un reporte privado mediante GitHub Security Advisories si esta disponible en este repositorio.
2. Si el reporte privado no esta disponible, contacta primero al mantenedor por GitHub antes de publicar detalles.

Al reportar, intenta incluir:

- una descripcion clara del problema
- area afectada o ruta del archivo
- impacto y escenario de ataque
- pasos de reproduccion o prueba de concepto
- alguna mitigacion sugerida, si ya la tienes

## Que Esperar del Proceso

Intentaremos:

- reconocer el reporte lo antes posible
- validar y reproducir el problema
- preparar una correccion o mitigacion
- coordinar la divulgacion cuando exista una solucion segura

## Alcance

Esta politica aplica a:

- el launcher Electron en `electron/`
- las aplicaciones React en `react-ui/` y `react-installer/`
- el mod cliente Fabric en `mc-home-client/`
- CI y automatizaciones dentro de `.github/`

Los servicios y dependencias de terceros como autenticacion de Microsoft, Discord RPC, Electron, Fabric o paquetes npm tambien deberian reportarse a sus respectivos proyectos cuando aplique.
