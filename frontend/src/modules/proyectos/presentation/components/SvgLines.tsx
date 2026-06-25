import React from 'react';
import { colors } from '../../../../shared/constants/colors';
import { Pos, NODE_W } from '../hooks/useMetaData';
import { Accion } from '../../domain/Accion';

interface SvgLinesProps {
  metaCenter: Pos;
  compCenters: Record<string, Pos>;
  compIds: string[];
  acciones: Record<string, Accion[]>;
  expanded: Record<string, boolean>;
  actionCenters: Record<string, Pos>;
}

export const SvgLines: React.FC<SvgLinesProps> = ({
  metaCenter, compCenters, compIds, acciones, expanded, actionCenters,
}) => {
  if (!compIds.length) return null;
  const cp = 60;

  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      } as any}
    >
      {/* Líneas Meta → Componentes */}
      {compIds.map(id => {
        const cc = compCenters[id];
        if (!cc) return null;
        const sx = metaCenter.x, sy = metaCenter.y;
        const ex = cc.x,        ey = cc.y;
        const d = `M ${sx} ${sy} C ${sx + cp} ${sy}, ${ex - cp} ${ey}, ${ex} ${ey}`;
        return (
          <g key={`comp-${id}`}>
            <path d={d} fill="none"
              stroke={colors.primary} strokeWidth="2" strokeOpacity="0.5"
              strokeLinecap="round"
            />
            <circle cx={ex} cy={ey} r="4" fill={colors.primary} fillOpacity="0.65" />
          </g>
        );
      })}

      {/* Líneas Componentes → Acciones */}
      {compIds.map(compId => {
        if (!expanded[compId]) return null;
        const accs = acciones[compId] ?? [];
        const cc = compCenters[compId];
        if (!cc) return null;

        return accs.map(acc => {
          const ac = actionCenters[acc.id];
          if (!ac) return null;
          const sx = cc.x + NODE_W, sy = cc.y;
          const ex = ac.x,         ey = ac.y;
          const d = `M ${sx} ${sy} C ${sx + cp} ${sy}, ${ex - cp} ${ey}, ${ex} ${ey}`;
          return (
            <g key={`acc-${acc.id}`}>
              <path d={d} fill="none"
                stroke={colors.success} strokeWidth="1.5" strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <circle cx={ex} cy={ey} r="3" fill={colors.success} fillOpacity="0.65" />
            </g>
          );
        });
      })}

      {/* Punto en el origen */}
      <circle cx={metaCenter.x} cy={metaCenter.y} r="4.5" fill={colors.primary} fillOpacity="0.7" />
    </svg>
  );
};
