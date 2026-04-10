import "dotenv/config";
import { app } from "electron";
import { disableCurrentHotupdate, getBundledRuntimePaths, resolveDesktopRuntime } from "./services/hotupdateRuntime";

app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.commandLine.appendSwitch("disable-features", "UseSkiaRenderer,TranslateUI,AutomationControlled");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("no-zygote");
app.commandLine.appendSwitch("disable-web-security", "false");

const loadDesktopEntry = async (): Promise<void> => {
  const runtime = await resolveDesktopRuntime();

  try {
    delete require.cache[require.resolve(runtime.entryPath)];
    const loaded = require(runtime.entryPath) as {
      startDesktopApp?: (input: { runtimePaths: typeof runtime }) => Promise<void>;
    };

    if (typeof loaded.startDesktopApp !== "function") {
      throw new Error(`El runtime '${runtime.entryPath}' no exporta startDesktopApp().`);
    }

    await loaded.startDesktopApp({ runtimePaths: runtime });
  } catch (error) {
    console.error("[hotupdate] Fallo el runtime activo:", error);

    if (runtime.source === "hotupdate") {
      disableCurrentHotupdate(runtime.releaseId);
      const bundled = getBundledRuntimePaths();
      delete require.cache[require.resolve(bundled.entryPath)];
      const fallback = require(bundled.entryPath) as {
        startDesktopApp?: (input: { runtimePaths: typeof bundled }) => Promise<void>;
      };

      if (typeof fallback.startDesktopApp !== "function") {
        throw new Error(`El runtime base '${bundled.entryPath}' no exporta startDesktopApp().`);
      }

      await fallback.startDesktopApp({ runtimePaths: bundled });
      return;
    }

    throw error;
  }
};

app
  .whenReady()
  .then(() => loadDesktopEntry())
  .catch((error) => {
    console.error("[bootstrap] Error fatal iniciando Electron", error);
    app.quit();
  });
