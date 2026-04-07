/**
 * @file useLandingStore.ts
 * @description Custom hook que orquesta los casos de uso para la landing page, sirviendo como store simple.
 */
import { useEffect, useState } from "react";
import { DetectOSUseCase } from "../useCases/DetectOSUseCase";
import { browserOSDetector } from "../../infrastructure/browser/BrowserOSDetector";
import { OS, DownloadOption } from "../../domain/entities/OS";

const detectOSUseCase = new DetectOSUseCase(browserOSDetector);

export function useLandingStore() {
  const [os, setOS] = useState<OS>("unknown");
  const [recommendedDownload, setRecommendedDownload] = useState<DownloadOption | null>(null);

  useEffect(() => {
    // Cuando el componente monta, detectamos el OS
    const result = detectOSUseCase.execute();
    setOS(result.os);
    setRecommendedDownload(result.option);
  }, []);

  return {
    os,
    recommendedDownload,
  };
}
