import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal } from './ui.jsx';

const ConfirmContext = createContext(null);

/**
 * Окно подтверждения в стиле приложения вместо стандартного window.confirm.
 * Использование: const ask = useConfirm(); if (!(await ask('Удалить роль?'))) return;
 * Подтверждаются необратимые действия: принятие, исключение, выход, смена состояния проекта (ui-design.md, §5).
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const ask = useCallback((message, { confirmLabel = 'Подтвердить', danger = false, title = 'Подтвердите действие' } = {}) => {
    setDialog({ message, confirmLabel, danger, title });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result) => {
    setDialog(null);
    resolver.current?.(result);
    resolver.current = null;
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {dialog && (
        <Modal title={dialog.title} onClose={() => close(false)}>
          <div className="modal__body">
            <p className="modal__text">{dialog.message}</p>
            <div className="actions actions--end">
              <button type="button" className="btn" onClick={() => close(false)}>
                Отмена
              </button>
              <button
                type="button"
                className={dialog.danger ? 'btn btn--danger-solid' : 'btn btn--primary'}
                // Фокус на кнопке подтверждения: Enter подтверждает, Esc отменяет.
                autoFocus
                onClick={() => close(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
