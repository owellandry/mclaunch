import { OS } from "../entities/OS";

/**
 * @file OSRepository.ts
 * @description Interfaz de repositorio para la detección del Sistema Operativo.
 * Aisla la lógica de detección de la aplicación para mantener el principio de inversión de dependencias.
 */
export interface OSRepository {
  /**
   * Detecta el sistema operativo actual del usuario.
   */
  detectOS(): OS;
}
