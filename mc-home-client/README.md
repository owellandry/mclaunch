# MC Launch Home Client

Subproyecto separado para la capa visual del cliente de Minecraft que va a personalizar el home screen sin mezclar esta logica con Electron ni con la UI del launcher.

## Objetivo

Esta base esta pensada para:

- mantener Minecraft oficial como cliente base
- inyectar una experiencia visual propia solo del lado del cliente
- reemplazar progresivamente el `TitleScreen` por una UI de `MC Launch`
- permitir iterar assets, layouts y comportamiento como un proyecto aislado

## Base tecnica

- Minecraft: `1.20.1`
- Fabric Loader: `0.18.6`
- Yarn mappings: `1.20.1+build.10`
- Java target: `17`

## Estructura

- `src/client/java`: codigo client-only
- `src/main/resources`: `fabric.mod.json` y configuracion de mixins
- `src/client/resources`: textos y assets del cliente

## Estado inicial

La primera base no reemplaza aun todo el menu vanilla. En cambio:

1. registra el cliente `mclaunch-home`
2. engancha el `TitleScreen` por mixin
3. agrega un boton `MC Launch UI`
4. abre una pantalla preview propia para empezar a construir el nuevo home screen

Eso nos permite iterar sin romper de golpe el menu original.

## Siguientes pasos recomendados

1. crear una `HomeScreen` completa con sidebar, branding y fondo propio
2. mover colores, textos e imagenes a recursos configurables
3. decidir si el reemplazo final sera total o si mantendremos acceso rapido al menu vanilla
4. integrar este subproyecto con el launcher para instalarlo automaticamente en la instancia

## Como trabajarlo

El subproyecto ya trae wrapper propio. Desde esta carpeta puedes usar:

```powershell
.\gradlew.bat runClient
```

Para compilar el jar:

```powershell
.\gradlew.bat build
```

Base validada con Gradle `9.2.0`.
