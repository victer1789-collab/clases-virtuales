/**
 * Servicio de Autenticación con Google OAuth (Google Identity Services)
 * Utiliza import.meta.env.VITE_GOOGLE_CLIENT_ID
 */

export interface GoogleUserProfile {
  sub: string; // Google User ID
  name: string;
  email: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          revoke: (hint: string, done: () => void) => void;
        };
      };
    };
  }
}

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const STORAGE_KEY_GOOGLE_PROFILE = 'aulasec_google_profile';

/**
 * Decodificar el token JWT de respuesta de Google Credential
 */
export function decodeGoogleJwt(token: string): GoogleUserProfile {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      sub: parsed.sub || `google-${Date.now()}`,
      name: parsed.name || `${parsed.given_name || 'Usuario'} ${parsed.family_name || ''}`.trim(),
      email: parsed.email || '',
      picture: parsed.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(parsed.name || 'User')}`,
      given_name: parsed.given_name,
      family_name: parsed.family_name,
      email_verified: parsed.email_verified,
    };
  } catch (error) {
    console.error('Error decodificando JWT de Google:', error);
    throw error;
  }
}

/**
 * Obtener perfil de Google guardado
 */
export function getStoredGoogleProfile(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOOGLE_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Guardar perfil de Google
 */
export function saveGoogleProfile(profile: GoogleUserProfile | null): void {
  try {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEY_GOOGLE_PROFILE);
    } else {
      localStorage.setItem(STORAGE_KEY_GOOGLE_PROFILE, JSON.stringify(profile));
    }
  } catch (e) {
    console.error('Error guardando perfil de Google:', e);
  }
}

/**
 * Inicializar botón oficial de Google en un contenedor del DOM
 */
export function renderGoogleButton(
  container: HTMLElement,
  onSuccess: (profile: GoogleUserProfile) => void,
  onError?: (err: any) => void
): boolean {
  if (!GOOGLE_CLIENT_ID) {
    console.warn(
      '[Google Auth] VITE_GOOGLE_CLIENT_ID no está configurado en las variables de entorno.'
    );
    return false;
  }

  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    console.warn('[Google Auth] SDK de Google gsi no cargado todavía.');
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        try {
          const profile = decodeGoogleJwt(response.credential);
          saveGoogleProfile(profile);
          onSuccess(profile);
        } catch (err) {
          if (onError) onError(err);
        }
      },
      cancel_on_tap_outside: true,
    });

    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: 280,
      locale: 'es',
    });

    return true;
  } catch (err) {
    console.error('[Google Auth] Error inicializando botón de Google:', err);
    if (onError) onError(err);
    return false;
  }
}
