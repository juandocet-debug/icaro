import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { DocumentScannerModal } from './components/DocumentScannerModal';
import { WebDocumentScanner } from './components/WebDocumentScanner';

interface Props {
  onFileCaptured: (file: any, fileName: string) => void;
  allowedTypes?: string[];
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const allowsImages = (types: string[]) =>
  types.length === 0 || types.some(t => IMAGE_TYPES.includes(t));

const buildAccept = (types: string[]) =>
  types.length > 0 ? types.join(',') : '*/*';

/** Encuadre de documento con marcadores de esquina */
const DocFrameGuide: React.FC = () => (
  <View style={guide.frame} pointerEvents="none">
    {/* Esquinas */}
    <View style={[guide.corner, guide.tl]} />
    <View style={[guide.corner, guide.tr]} />
    <View style={[guide.corner, guide.bl]} />
    <View style={[guide.corner, guide.br]} />
    <Text style={guide.hint}>Ajusta el documento dentro del recuadro</Text>
  </View>
);

const guide = StyleSheet.create({
  frame: {
    width: 220, height: 310,
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderRadius: 4,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24, height: 24,
    borderColor: '#fff',
    borderWidth: 3,
  },
  tl: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 16,
  },
});

export const EvidenciaCaptureSheet: React.FC<Props> = ({
  onFileCaptured,
  allowedTypes = [],
}) => {
  const fileInputRef = useRef<any>(null);
  const cameraInputRef = useRef<any>(null);
  const [showWebScanner, setShowWebScanner] = useState(false);

  // ── WEB ───────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    // Comprime imágenes antes de subir (fotos de cámara pueden ser 3-8MB)
    const compressImageFile = (file: File, maxW = 1600, quality = 0.70): Promise<File> => {
      if (!file.type.startsWith('image/')) return Promise.resolve(file);
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = url;
      });
    };

    const handleFile = async (e: any) => {
      const f = e.target.files?.[0];
      if (f) {
        const compressed = await compressImageFile(f);
        onFileCaptured(compressed, compressed.name);
        e.target.value = '';
      }
    };

    const handleWebScanCapture = (dataUrl: string) => {
      // Conversión dataUrl → Blob sincrónica (más compatible en móvil que fetch)
      try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const blob = new Blob([u8arr], { type: mime });
        const name = `doc_${Date.now()}.jpg`;
        const file = new File([blob], name, { type: 'image/jpeg' });
        // Primero pasar el archivo, luego cerrar el scanner
        onFileCaptured(file, name);
      } catch (err) {
        alert('Error al procesar la imagen. Intenta de nuevo.');
      }
      setShowWebScanner(false);
    };

    return (
      <>
        {showWebScanner ? (
          <WebDocumentScanner
            onCapture={handleWebScanCapture}
            onClose={() => setShowWebScanner(false)}
          />
        ) : (
          <View style={styles.container}>
            <View style={styles.grid}>
              {/* Tomar foto con cámara trasera */}
              <TouchableOpacity style={styles.option} onPress={() => cameraInputRef.current?.click()}>
                <View style={[styles.icon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="camera" size={28} color={colors.primary} />
                </View>
                <Text style={styles.label}>Cámara</Text>
              </TouchableOpacity>

              {/* Escanear documento con WebRTC live */}
              <TouchableOpacity style={styles.option} onPress={() => setShowWebScanner(true)}>
                <View style={[styles.icon, { backgroundColor: '#f59e0b20' }]}>
                  <Ionicons name="scan-outline" size={28} color="#f59e0b" />
                </View>
                <Text style={styles.label}>Documento</Text>
              </TouchableOpacity>

              {/* Galería / Archivo */}
              <TouchableOpacity style={styles.option} onPress={() => fileInputRef.current?.click()}>
                <View style={[styles.icon, { backgroundColor: '#10b98115' }]}>
                  <Ionicons name="folder-open-outline" size={28} color="#10b981" />
                </View>
                <Text style={styles.label}>Archivo</Text>
              </TouchableOpacity>
            </View>

            {/* Cámara trasera */}
            <input ref={cameraInputRef} type="file" accept="image/*"
              capture={"environment" as any}
              style={{ display: 'none' } as any} onChange={handleFile} />

            {/* Cualquier archivo */}
            <input ref={fileInputRef} type="file" accept={buildAccept(allowedTypes)}
              style={{ display: 'none' } as any} onChange={handleFile} />

            <Text style={styles.webHint}>
              {allowedTypes.length > 0
                ? `Formatos: ${allowedTypes.map(t => t === 'application/pdf' ? 'PDF' : t.split('/')[1]?.toUpperCase()).join(', ')} · Máx. 10MB`
                : 'JPG, PNG, PDF, DOC · Máx. 10MB'}
            </Text>
          </View>
        )}
      </>
    );
  }

  // ── NATIVE (Expo Go / App) ─────────────────────────────────────────────────
  const canImage = allowsImages(allowedTypes);

  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert('Permiso de cámara denegado. Habilítalo en Ajustes.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      const name = a.uri.split('/').pop() || 'photo.jpg';
      onFileCaptured({ uri: a.uri, name, type: 'image/jpeg' }, name);
    }
  };

  const handleGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Permiso de galería denegado. Habilítalo en Ajustes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      const name = a.uri.split('/').pop() || 'file.jpg';
      onFileCaptured({ uri: a.uri, name, type: a.mimeType || 'image/jpeg' }, name);
    }
  };

  const [showDocScanner, setShowDocScanner] = useState(false);
  const handleDocCapture = (uri: string) => {
    const name = `doc_${Date.now()}.jpg`;
    onFileCaptured({ uri, name, type: 'image/jpeg' }, name);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {canImage && (
          <TouchableOpacity style={styles.option} onPress={handleCamera}>
            <View style={[styles.icon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="camera" size={28} color={colors.primary} />
            </View>
            <Text style={styles.label}>Cámara</Text>
          </TouchableOpacity>
        )}

        {canImage && (
          <TouchableOpacity style={styles.option} onPress={() => setShowDocScanner(true)}>
            <View style={[styles.icon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="scan-outline" size={28} color="#f59e0b" />
            </View>
            <Text style={styles.label}>Documento</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.option} onPress={handleGallery}>
          <View style={[styles.icon, { backgroundColor: '#10b98115' }]}>
            <Ionicons name="folder-open-outline" size={28} color="#10b981" />
          </View>
          <Text style={styles.label}>Galería</Text>
        </TouchableOpacity>
      </View>

      {/* Scanner de documento con live camera */}
      <DocumentScannerModal
        visible={showDocScanner}
        onClose={() => setShowDocScanner(false)}
        onCapture={handleDocCapture}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  } as any,
  option: { alignItems: 'center', flex: 1 },
  icon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  webHint: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});

const docModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bg: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(15,15,25,0.95)',
    borderRadius: 20,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  } as any,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  tips: { gap: 8 } as any,
  tipItem: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
  } as any,
  btnTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
