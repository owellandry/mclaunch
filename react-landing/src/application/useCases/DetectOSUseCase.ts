/**
 * @file DetectOSUseCase.ts
 * @description Caso de uso encargado de obtener el sistema operativo y devolver la mejor opción de descarga.
 */
import { OS, DownloadOption } from "../../domain/entities/OS";
import { OSRepository } from "../../domain/repositories/OSRepository";

const downloadOptions: Record<OS, DownloadOption | null> = {
  windows: { os: "windows", label: "Descargar para Windows", filename: "Slaumcher-Setup.exe", url: "#download-win" },
  mac: { os: "mac", label: "Descargar para macOS", filename: "Slaumcher.dmg", url: "#download-mac" },
  linux: { os: "linux", label: "Descargar para Linux", filename: "Slaumcher.AppImage", url: "#download-linux" },
  unknown: null,
};

export class DetectOSUseCase {
  constructor(private readonly osRepository: OSRepository) {}

  execute(): { os: OS; option: DownloadOption | null } {
    const os = this.osRepository.detectOS();
    return {
      os,
      option: downloadOptions[os] || downloadOptions["windows"] // Default fallback a Windows
    };
  }
}
