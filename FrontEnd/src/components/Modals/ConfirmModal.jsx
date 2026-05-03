import React from "react";
import styles from "./Modals.module.css";

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlayConfirm}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Delete Confirm</h3>
        <div className={styles.buttons}>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Confirm
          </button>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;