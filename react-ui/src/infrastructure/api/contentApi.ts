import { backendRequest, type BackendBanner } from "./backendClient";

export const contentApi = {
  getHomeBanners(signal?: AbortSignal): Promise<BackendBanner[]> {
    return backendRequest<BackendBanner[]>("/api/v1/banners?placement=home", { signal });
  },
};
