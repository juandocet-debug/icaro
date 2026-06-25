import React from 'react';
import { Componente } from '../../domain/Componente';
import { Accion } from '../../domain/Accion';
import { MetaMapNode } from '../MetaMapNode';
import { useDraggableNode } from '../hooks/useMetaCanvas';
import { Pos } from '../hooks/useMetaData';

// ── DraggableComp ────────────────────────────────────────────────────────────
interface DraggableCompProps {
  comp: Componente;
  pos: Pos;
  positions: Record<string, Pos>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>;
  setNodeSize: (id: string, w: number, h: number) => void;
  isOpen: boolean;
  accCount: number;
  onToggle: () => void;
  onAdd?: () => void;
  onEditComp?: () => void;
  onDeleteComp?: () => void;
  canCrearAccion: boolean;
  disabled?: boolean;
}

export const DraggableComp: React.FC<DraggableCompProps> = ({
  comp, pos, positions, setPositions, setNodeSize,
  isOpen, accCount, onToggle, onAdd,
  onEditComp, onDeleteComp, canCrearAccion, disabled,
}) => {
  const { onMouseDown } = useDraggableNode(comp.id, positions, setPositions);

  return (
    <div
      style={{ position: 'absolute', left: pos.x, top: pos.y, cursor: 'grab', userSelect: 'none' } as any}
      onMouseDown={onMouseDown}
    >
      <div
        style={{ display: 'inline-block' } as any}
        ref={(el) => { if (el) setNodeSize(comp.id, el.offsetWidth, el.offsetHeight); }}
      >
        <MetaMapNode
          kind="componente"
          title={comp.nombre}
          subtitle={comp.descripcion}
          counter={accCount}
          expanded={isOpen}
          onToggle={onToggle}
          onAdd={canCrearAccion ? onAdd : undefined}
          addLabel="+ Acción"
          onEdit={onEditComp}
          onDelete={onDeleteComp}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

// ── DraggableAcc ─────────────────────────────────────────────────────────────
interface DraggableAccProps {
  acc: Accion;
  pos: Pos;
  positions: Record<string, Pos>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>;
  setNodeSize: (id: string, w: number, h: number) => void;
  onEvidencia?: () => void;
  onGestionarResp?: () => void;
  onEditAcc?: () => void;
  onDeleteAcc?: () => void;
  disabled?: boolean;
}

export const DraggableAcc: React.FC<DraggableAccProps> = ({
  acc, pos, positions, setPositions, setNodeSize,
  onEvidencia, onGestionarResp, onEditAcc, onDeleteAcc, disabled,
}) => {
  const { onMouseDown } = useDraggableNode(acc.id, positions, setPositions);

  return (
    <div
      style={{ position: 'absolute', left: pos.x, top: pos.y, cursor: 'grab', userSelect: 'none' } as any}
      onMouseDown={onMouseDown}
    >
      <div
        style={{ display: 'inline-block' } as any}
        ref={(el) => { if (el) setNodeSize(acc.id, el.offsetWidth, el.offsetHeight); }}
      >
        <MetaMapNode
          kind="accion"
          title={acc.nombre}
          subtitle={acc.descripcion}
          ejecucion={acc.ejecucion}
          proyeccion={acc.proyeccion}
          unidad={acc.unidadMedida}
          avancePorcentaje={acc.avancePorcentaje}
          numRequisitos={acc.requisitosVerificacion?.length}
          resumenVerificacion={acc.resumenVerificacion}
          responsables={acc.responsables}
          onManageResponsibles={onGestionarResp}
          onEvidencia={onEvidencia}
          onEdit={onEditAcc}
          onDelete={onDeleteAcc}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
