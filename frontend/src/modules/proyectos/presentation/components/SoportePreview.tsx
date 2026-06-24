import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';
import { styles } from './MisActividadesStyles';

import { env } from '../../../../config/env';

const toUrl = (url: string) => {
  const API_BASE = env.apiUrl;
  return url?.startsWith('http') ? url : `${API_BASE}${url}`;
};

const fileIcon = (t: string): any =>
  t?.startsWith('image/') ? 'image-outline'
  : t === 'application/pdf' ? 'document-text-outline'
  : t?.includes('spreadsheetml') ? 'grid-outline' : 'document-outline';

const fileColor = (t: string) =>
  t?.startsWith('image/') ? '#10b981' : t === 'application/pdf' ? '#ef4444' : colors.primary;

interface SoportePreviewProps {
  previewSoporte: any;
  setPreviewSoporte: (file: any) => void;
  canEditActiveEv: boolean;
  handleDeleteSoporte: (id: any) => void;
}

export const SoportePreview: React.FC<SoportePreviewProps> = ({
  previewSoporte,
  setPreviewSoporte,
  canEditActiveEv,
  handleDeleteSoporte,
}) => {
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, [previewSoporte]);

  if (!previewSoporte) return null;

  const handleWheel = (e: any) => {
    if (Platform.OS === 'web') {
      const delta = e.deltaY * -0.003;
      setZoomScale(prev => Math.min(Math.max(1, prev + delta), 4));
    }
  };

  const handleMouseDown = (e: any) => {
    if (Platform.OS === 'web') {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: any) => {
    if (Platform.OS === 'web' && isDragging.current) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setPan({ x: newX, y: newY });
    }
  };

  const handleMouseUpOrLeave = () => {
    if (Platform.OS === 'web') {
      isDragging.current = false;
    }
  };

  return (
    <View style={styles.previewBox}>
      <View style={styles.previewHeaderRow}>
        <Text style={styles.sectionTitle}>Vista previa de la evidencia seleccionada</Text>
        <TouchableOpacity onPress={() => setPreviewSoporte(null)}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {previewSoporte.file_type?.startsWith('image/') ? (
        <View 
          style={{ width: '100%', height: 280, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, backgroundColor: '#f8fafc' }}
          {...(Platform.OS === 'web' ? {
            onWheel: handleWheel,
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUpOrLeave,
            onMouseLeave: handleMouseUpOrLeave,
          } : {})}
        >
          <Image 
            source={{ uri: toUrl(previewSoporte.file_url) }} 
            style={{
              width: '100%',
              height: 280,
              transform: [
                { scale: zoomScale },
                { translateX: pan.x / zoomScale },
                { translateY: pan.y / zoomScale }
              ],
              cursor: isDragging.current ? 'grabbing' : 'grab',
            } as any} 
            resizeMode="contain" 
          />
        </View>
      ) : (
        <View style={styles.previewIconBox}>
          <Ionicons name={fileIcon(previewSoporte.file_type)} size={48} color={fileColor(previewSoporte.file_type)} />
        </View>
      )}
      <View style={styles.previewFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewFileName} numberOfLines={1}>{previewSoporte.file_name}</Text>
          <Text style={styles.previewMetaText}>{previewSoporte.created_at}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 } as any}>
          {canEditActiveEv && (
            <TouchableOpacity
              style={[styles.btnActionIcon, { borderColor: '#ef4444' }]}
              onPress={() => handleDeleteSoporte(previewSoporte.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.btnOpenNewTab}
            onPress={() => { if (Platform.OS === 'web') (window as any).open(toUrl(previewSoporte.file_url), '_blank'); }}
          >
            <Text style={styles.btnOpenNewTabTxt}>Abrir en nueva pestaña ↗</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
