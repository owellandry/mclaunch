# Postman Backend

Coleccion y environment listos para probar el backend remoto de MC Launch.

## Archivos

- `mclaunch-backend.postman_collection.json`
- `mclaunch-backend.remote.postman_environment.json`

## Valores remotos incluidos

- Host: `207.180.205.8`
- Puerto: `8787`
- Base URL: `http://207.180.205.8:8787`
- WebSocket URL: `ws://207.180.205.8:8787/ws/v1/launcher`

## Variables utiles

- `baseUrl`
- `wsUrl`
- `bearerToken`
- `sessionId`
- `authorizeUrl`
- `bannerId`
- `downloadFileName`
- `hotupdateFileName`

## Flujo sugerido

1. Importa la coleccion y el environment.
2. Selecciona el environment remoto.
3. Ejecuta `Login / Start`.
4. Abre manualmente `authorizeUrl` en un navegador.
5. Cuando Microsoft redirija al callback, vuelve a Postman y ejecuta `Login / Status`.
6. Copia el token devuelto a `bearerToken` si quieres probar rutas privadas.

Nota: las rutas privadas requieren `Authorization: Bearer {{bearerToken}}`.
