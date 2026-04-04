import type { ReactNode } from "react";
import { FiX } from "react-icons/fi";

type MockModalProps = {
  icon?: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
};

export function MockModal({ icon, title, subtitle, children, onClose }: MockModalProps) {
  return (
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <button aria-label="Cerrar overlay" className="modal-dismiss" onClick={onClose} type="button" />
      <div className="modal-shell">
        <div className="modal-header">
          <div className="modal-title-block">
            {icon ? <div className="section-icon">{icon}</div> : null}
            <div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>
          <button aria-label="Cerrar" className="icon-button" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
