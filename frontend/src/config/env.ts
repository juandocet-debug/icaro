export const env = {
  get apiUrl(): string {
    // EXPO_PUBLIC_API_URL es inyectado por Expo CLI en tiempo de compilación a partir de .env
    const url = (process as any).env.EXPO_PUBLIC_API_URL;
    if (!url) {
      throw new Error("EXPO_PUBLIC_API_URL no está definida en las variables de entorno.");
    }
    return url;
  }
};
