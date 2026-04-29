import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import contactStarUrl from "../../STAR.png.svg";

const termsCopy =
  "We have curated a range of natural products that have been traditionally used to support wellbeing. We do not provide any kind of medical/health advice. Information and statements about the products on this site have not been evaluated by the Food and Drug Administration and are not intended to diagnose, treat, cure, or prevent any disease. Please consult your doctor prior to use if you have any concerns or questions.";

export type FooterDetailDialogHandle = {
  open: (item: string) => void;
  close: () => void;
};

type Props = { onOpenChange?: (open: boolean) => void };

export const FooterDetailDialog = forwardRef<FooterDetailDialogHandle, Props>(
  function FooterDetailDialog({ onOpenChange }, ref) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [activeItem, setActiveItem] = useState<string | null>(null);

    const closeModal = useCallback(() => {
      const dlg = dialogRef.current;
      if (!dlg?.open) return;
      dlg.close();
      document.documentElement.classList.remove("detail-dialog-open");
      document.body.classList.remove("detail-dialog-open");
      setActiveItem(null);
      onOpenChange?.(false);
    }, [onOpenChange]);

    useEffect(() => {
      const dlg = dialogRef.current;
      if (!dlg) return;
      const onClick = (e: MouseEvent) => {
        if (e.target === dlg) closeModal();
      };
      dlg.addEventListener("click", onClick);
      dlg.addEventListener("cancel", closeModal);
      return () => {
        dlg.removeEventListener("click", onClick);
        dlg.removeEventListener("cancel", closeModal);
      };
    }, [closeModal]);

    useEffect(() => {
      return () => {
        document.documentElement.classList.remove("detail-dialog-open");
        document.body.classList.remove("detail-dialog-open");
      };
    }, []);

    const openItem = useCallback(
      (item: string) => {
        const dlg = dialogRef.current;
        if (!dlg) return;
        setActiveItem(item);
        if (!dlg.open) dlg.show();
        document.documentElement.classList.add("detail-dialog-open");
        document.body.classList.add("detail-dialog-open");
        onOpenChange?.(true);
      },
      [onOpenChange],
    );

    useImperativeHandle(
      ref,
      () => ({ open: openItem, close: closeModal }),
      [openItem, closeModal],
    );

    return (
      <dialog
        ref={dialogRef}
        className="product-detail-dialog footer-detail-dialog"
        aria-label={activeItem ? `${activeItem} details` : "Footer details"}
      >
        {activeItem ? (
          <article className="product-card footer-detail-card">
            <div className="product-card__body">
              <h2 className="product-card__title">{activeItem}</h2>
              <div className="product-card__detail footer-detail-card__detail">
                {activeItem === "Terms" ? (
                  <p className="product-card__summary">{termsCopy}</p>
                ) : activeItem === "Contact" ? (
                  <div className="footer-contact">
                    <img
                      className="footer-contact-star"
                      src={contactStarUrl}
                      width={2480}
                      height={2480}
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      fetchPriority="low"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ) : null}
      </dialog>
    );
  },
);
