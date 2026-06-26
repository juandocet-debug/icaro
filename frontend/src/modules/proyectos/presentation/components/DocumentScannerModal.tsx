import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Dimensions, Platform, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { typography } from '../../../../shared/constants/typography';

const { width: SW, height: SH } = Dimensions.get('window');

// Proporciones del recuadre A4 (escala para caber en pantalla con margen)
const FRAME_W = SW * 0.82;
const FRAME_H = FRAME_W * (297 / 210);
const FRAME_TOP = (SH - FRAME_H) / 2 - 30;

const CORNER = 28;
const BORDER = 3;
const CORNER_COLOR = '#ffffff';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
}

export const DocumentScannerModal: React.FC<Props> = ({ visible, onClose, onCapture }) => {
  const camRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flash, setFlash] = useState<FlashMode>(FlashMode.off);
  const [capturing, setCapturing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Camera.requestCameraPermissionsAsync().then(({ granted }) => setHasPermission(granted));
      // Pulso en el recuadre para guiar al usuario
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.015, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  if (Platform.OS === 'web') return null; // Solo nativo

  const takePhoto = async () => {
    if (!camRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await camRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      onCapture(photo.uri);
      onClose();
    } catch {
      // ignore
    } finally {
      setCapturing(false);
    }
  };

  const toggleFlash = () =>
    setFlash(f => f === FlashMode.off ? FlashMode.torch : FlashMode.off);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.container}>

        {!hasPermission ? (
          <View style={s.permBox}>
            <Ionicons name="camera-off-outline" size={48} color="#94a3b8" />
            <Text style={s.permTxt}>Permiso de cámara requerido</Text>
            <TouchableOpacity style={s.permBtn}
              onPress={() => Camera.requestCameraPermissionsAsync().then(({ granted }) => setHasPermission(granted))}>
              <Text style={s.permBtnTxt}>Solicitar permiso</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cámara de fondo completa */}
            <Camera
              ref={camRef}
              style={StyleSheet.absoluteFill}
              type={CameraType.back}
              flashMode={flash}
            />

            {/* Overlay oscuro con recorte del documento */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {/* Zona superior */}
              <View style={[s.shadow, { height: FRAME_TOP }]} />
              {/* Zona media: lateral izquierdo + frame + lateral derecho */}
              <View style={{ flexDirection: 'row', height: FRAME_H }}>
                <View style={[s.shadow, { flex: 1 }]} />
                {/* El recuadre transparente - animado */}
                <Animated.View style={[s.frame, { width: FRAME_W, height: FRAME_H, transform: [{ scale: pulseAnim }] }]}>
                  {/* Esquinas */}
                  <View style={[s.corner, s.tl]} />
                  <View style={[s.corner, s.tr]} />
                  <View style={[s.corner, s.bl]} />
                  <View style={[s.corner, s.br]} />
                </Animated.View>
                <View style={[s.shadow, { flex: 1 }]} />
              </View>
              {/* Zona inferior */}
              <View style={[s.shadow, { flex: 1 }]} />
            </View>

            {/* Instrucción en el centro del frame */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: FRAME_TOP + FRAME_H + 12,
                left: 0, right: 0,
                alignItems: 'center',
              }}>
              <Text style={s.hint}>Ajusta el documento dentro del recuadro</Text>
            </View>

            {/* Barra superior */}
            <View style={s.topBar}>
              <TouchableOpacity style={s.iconBtn} onPress={onClose}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={s.topTitle}>Escanear Documento</Text>
              <TouchableOpacity style={s.iconBtn} onPress={toggleFlash}>
                <Ionicons
                  name={flash === FlashMode.off ? 'flash-off-outline' : 'flash-outline'}
                  size={22}
                  color={flash === FlashMode.off ? '#94a3b8' : '#fbbf24'}
                />
              </TouchableOpacity>
            </View>

            {/* Botón de captura */}
            <View style={s.bottomBar}>
              <TouchableOpacity
                style={[s.captureBtn, capturing && { opacity: 0.6 }]}
                onPress={takePhoto}
                disabled={capturing}
                activeOpacity={0.8}
              >
                <View style={s.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  shadow: { backgroundColor: 'rgba(0,0,0,0.62)' },
  frame: {
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: CORNER_COLOR,
    borderWidth: BORDER,
  },
  tl: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: typography.fontFamily,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topTitle: {
    color: '#fff',
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 48, left: 0, right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 72, height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captureBtnInner: {
    width: 54, height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  permBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16,
  } as any,
  permTxt: {
    color: '#94a3b8', fontFamily: typography.fontFamily, fontSize: 15, textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12,
  },
  permBtnTxt: {
    color: '#fff', fontFamily: typography.fontFamily, fontWeight: '700', fontSize: 14,
  },
});
