import React, { useState } from "react";
import { AppModal, ModalButton, ModalType } from "../components/AppModal";

type ModalState = {
  visible: boolean;
  title?: string;
  message: string;
  type: ModalType;
  buttons: ModalButton[];
};

const HIDDEN: ModalState = {
  visible: false,
  message: "",
  type: "info",
  buttons: [],
};

export function useModal() {
  const [state, setState] = useState<ModalState>(HIDDEN);

  const hide = () => setState((s) => ({ ...s, visible: false }));

  const showAlert = (
    title: string,
    message: string,
    type: ModalType = "info",
    onDismiss?: () => void,
  ) => {
    setState({
      visible: true,
      title,
      message,
      type,
      buttons: [
        {
          text: "OK",
          onPress: () => {
            hide();
            onDismiss?.();
          },
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
      onCancel?: () => void;
    },
  ) => {
    setState({
      visible: true,
      title,
      message,
      type: options?.destructive ? "warning" : "info",
      buttons: [
        {
          text: options?.cancelText ?? "Cancel",
          variant: "cancel",
          onPress: () => {
            hide();
            options?.onCancel?.();
          },
        },
        {
          text: options?.confirmText ?? "Confirm",
          variant: options?.destructive ? "destructive" : "default",
          onPress: () => {
            hide();
            onConfirm();
          },
        },
      ],
    });
  };

  const modalElement = React.createElement(AppModal, {
    visible: state.visible,
    title: state.title,
    message: state.message,
    type: state.type,
    buttons: state.buttons,
    onBackdropPress: state.buttons.length === 1 ? hide : undefined,
  });

  return { showAlert, showConfirm, modalElement };
}
