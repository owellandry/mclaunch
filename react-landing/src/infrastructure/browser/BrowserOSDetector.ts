/**
 * @file BrowserOSDetector.ts
 * @description Implementación de la capa de infraestructura para OSRepository.
 * Utiliza el objeto navigator del navegador para determinar el SO.
 */
import { OS } from "../../domain/entities/OS";
import { OSRepository } from "../../domain/repositories/OSRepository";

export class BrowserOSDetector implements OSRepository {
  detectOS(): OS {
    if (typeof window === "undefined" || !window.navigator) {
      return "unknown";
    }

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.indexOf("win") !== -1) {
      return "windows";
    }
    if (userAgent.indexOf("mac") !== -1) {
      return "mac";
    }
    if (userAgent.indexOf("linux") !== -1 || userAgent.indexOf("x11") !== -1) {
      return "linux";
    }

    return "unknown";
  }
}

export const browserOSDetector = new BrowserOSDetector();
