import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "./CartDetailDialog.css";
import { formatEur } from "../lib/formatEur";
import { productImageUrl } from "../lib/productImageUrl";
import type { Product } from "../types/product";

type CartItem = {
  product: Product;
  quantity: number;
};

export type CartDetailDialogHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  items: CartItem[];
  totalCents: number;
  onIncreaseItem: (sku: string) => void;
  onDecreaseItem: (sku: string) => void;
  onOpenChange?: (open: boolean) => void;
};

export const CartDetailDialog = forwardRef<CartDetailDialogHandle, Props>(
  function CartDetailDialog(
    { items, totalCents, onIncreaseItem, onDecreaseItem, onOpenChange },
    ref,
  ) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closingRef = useRef(false);
    /** True if body/html were already scroll-locked (e.g. product detail) when cart opened — don't strip on cart close. */
    const hadScrollLockBeforeCartRef = useRef(false);
    const [useShippingAsBilling, setUseShippingAsBilling] = useState(false);
    const [exiting, setExiting] = useState(false);
    const taxCents = Math.round(totalCents * 0.1);
    const shippingCents = 0;
    const grandTotalCents = totalCents + taxCents + shippingCents;

    const finishClose = useCallback(() => {
      closingRef.current = false;
      setExiting(false);
      const dlg = dialogRef.current;
      if (dlg?.open) dlg.close();
      const keepScrollLock = hadScrollLockBeforeCartRef.current;
      hadScrollLockBeforeCartRef.current = false;
      if (!keepScrollLock) {
        document.body.classList.remove("detail-dialog-open");
        document.documentElement.classList.remove("detail-dialog-open");
      }
    }, []);

    const requestClose = useCallback(() => {
      const dlg = dialogRef.current;
      if (!dlg?.open || closingRef.current) return;

      onOpenChange?.(false);
      closingRef.current = true;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishClose();
        return;
      }

      setExiting(true);
    }, [finishClose, onOpenChange]);

    useEffect(() => {
      if (!exiting) return;
      const dlg = dialogRef.current;
      if (!dlg) {
        finishClose();
        return;
      }

      let done = false;
      const complete = () => {
        if (done) return;
        done = true;
        finishClose();
      };

      const onAnimationEnd = (e: AnimationEvent) => {
        if (e.target !== dlg || e.animationName !== "cart-drawer-slide-out")
          return;
        complete();
      };

      dlg.addEventListener("animationend", onAnimationEnd);
      const t = window.setTimeout(
        complete,
        900,
      ); /* slightly above --cart-drawer-exit-duration (0.8s) */

      return () => {
        window.clearTimeout(t);
        dlg.removeEventListener("animationend", onAnimationEnd);
      };
    }, [exiting, finishClose]);

    useEffect(() => {
      const dlg = dialogRef.current;
      if (!dlg) return;
      const onClick = (e: MouseEvent) => {
        if (e.target === dlg) requestClose();
      };
      dlg.addEventListener("click", onClick);
      dlg.addEventListener("cancel", requestClose);
      return () => {
        dlg.removeEventListener("click", onClick);
        dlg.removeEventListener("cancel", requestClose);
      };
    }, [requestClose]);

    const openModal = useCallback(() => {
      const dlg = dialogRef.current;
      if (!dlg) return;
      closingRef.current = false;
      setExiting(false);
      hadScrollLockBeforeCartRef.current =
        document.body.classList.contains("detail-dialog-open") ||
        document.documentElement.classList.contains("detail-dialog-open");
      if (!dlg.open) dlg.show();
      document.documentElement.classList.add("detail-dialog-open");
      document.body.classList.add("detail-dialog-open");
      onOpenChange?.(true);
    }, [onOpenChange]);

    useImperativeHandle(ref, () => ({ open: openModal, close: requestClose }), [
      openModal,
      requestClose,
    ]);

    return (
      <dialog
        ref={dialogRef}
        className={`product-detail-dialog footer-detail-dialog cart-detail-dialog${exiting ? " cart-detail-dialog--exiting" : ""}`}
        aria-label="Cart"
      >
        <div className="cart-detail-dialog__page">
          <div className="cart-detail-dialog__columns">
            <article className="product-card footer-detail-card cart-detail-card">
              <div className="product-card__body">
                <div className="product-card__detail cart-detail-card__detail">
                  {items.length === 0 ? (
                    <p className="product-card__summary">Your cart is empty.</p>
                  ) : (
                    <>
                      <ul className="cart-detail-card__list" role="list">
                        {items.map(({ product, quantity }) => (
                          <li
                            key={product.sku}
                            className="cart-detail-card__item"
                          >
                            <div className="cart-detail-card__stack">
                              <div className="cart-detail-card__product">
                                <img
                                  className="cart-detail-card__thumb"
                                  src={productImageUrl(product.image)}
                                  alt={product.title}
                                  loading="eager"
                                  fetchPriority="high"
                                  decoding="async"
                                  width={40}
                                  height={40}
                                />
                                <div className="cart-detail-card__aside">
                                  <span className="cart-detail-card__name">
                                    {product.title}
                                  </span>
                                  <div className="cart-detail-card__qty-controls">
                                    <button
                                      type="button"
                                      className="cart-detail-card__action-btn"
                                      onClick={() =>
                                        onDecreaseItem(product.sku)
                                      }
                                      aria-label={`Decrease quantity of ${product.title}`}
                                    >
                                      -
                                    </button>
                                    <span className="cart-detail-card__qty">
                                      {quantity}
                                    </span>
                                    <button
                                      type="button"
                                      className="cart-detail-card__action-btn"
                                      onClick={() =>
                                        onIncreaseItem(product.sku)
                                      }
                                      aria-label={`Increase quantity of ${product.title}`}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className="cart-detail-card__line-price">
                              {formatEur(product.priceCents * quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div
                        className="cart-detail-card__total-row"
                        aria-label="Cart total"
                      >
                        <span className="cart-detail-card__total-label">
                          Subtotal
                        </span>
                        <span className="cart-detail-card__total-value">
                          {formatEur(totalCents)}
                        </span>
                      </div>
                      <div
                        className="cart-detail-card__total-row"
                        aria-label="Tax"
                      >
                        <span className="cart-detail-card__total-label">
                          Tax
                        </span>
                        <span className="cart-detail-card__total-value">
                          {formatEur(taxCents)}
                        </span>
                      </div>
                      <div
                        className="cart-detail-card__total-row"
                        aria-label="Shipping"
                      >
                        <span className="cart-detail-card__total-label">
                          Shipping
                        </span>
                        <span className="cart-detail-card__total-value cart-detail-card__shipping-note">
                          calculated at next step
                        </span>
                      </div>
                      <div
                        className="cart-detail-card__total-row cart-detail-card__total-row--final"
                        aria-label="Total"
                      >
                        <span className="cart-detail-card__total-label">
                          Total
                        </span>
                        <span className="cart-detail-card__total-value">
                          {formatEur(grandTotalCents)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </article>
            {items.length > 0 ? (
              <article className="product-card footer-detail-card cart-detail-card cart-detail-card--checkout">
                <div className="product-card__body">
                  <div className="product-card__detail cart-detail-card__detail">
                    <h3
                      className="cart-detail-card__contact-title"
                      style={{ fontWeight: 700 }}
                    >
                      Contact information
                    </h3>
                    <form className="cart-detail-card__form">
                      <input
                        className="cart-detail-card__input"
                        type="text"
                        placeholder="first name"
                      />
                      <input
                        className="cart-detail-card__input"
                        type="text"
                        placeholder="last name"
                      />
                      <input
                        className="cart-detail-card__input"
                        type="text"
                        placeholder="address"
                      />
                      <input
                        className="cart-detail-card__input"
                        type="text"
                        placeholder="apartment suit unit"
                      />
                      <div className="cart-detail-card__input-row">
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="city"
                        />
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="country"
                        />
                      </div>
                      <div className="cart-detail-card__input-row">
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="state/ province"
                        />
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="zip/post code"
                        />
                      </div>
                      <input
                        className="cart-detail-card__input"
                        type="tel"
                        placeholder="number"
                      />
                      <input
                        className="cart-detail-card__input"
                        type="email"
                        placeholder="email"
                      />
                    </form>
                    <p className="cart-detail-card__shipping-copy">
                      Enter your shipping address to see available shipping
                      options.
                    </p>
                    <h3 style={{ fontWeight: 700 }}>Payment details</h3>
                    <form className="cart-detail-card__form">
                      <input
                        className="cart-detail-card__input"
                        type="text"
                        placeholder="name on card"
                        autoComplete="cc-name"
                      />
                      <input
                        className="cart-detail-card__input"
                        type="text"
                        placeholder="card number"
                        autoComplete="cc-number"
                        inputMode="numeric"
                      />
                      <div className="cart-detail-card__input-row">
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="expiry (MM/YY)"
                          autoComplete="cc-exp"
                          inputMode="numeric"
                        />
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="security code"
                          autoComplete="cc-csc"
                          inputMode="numeric"
                        />
                      </div>
                    </form>
                    <h3 style={{ marginTop: "2rem", fontWeight: 700 }}>
                      Billing address
                    </h3>
                    <label className="cart-detail-card__checkbox-row">
                      <input
                        className="cart-detail-card__checkbox"
                        type="checkbox"
                        checked={useShippingAsBilling}
                        onChange={(e) =>
                          setUseShippingAsBilling(e.target.checked)
                        }
                      />
                      <span>use shipping address and billing address</span>
                    </label>
                    {!useShippingAsBilling ? (
                      <form className="cart-detail-card__form">
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="address"
                        />
                        <input
                          className="cart-detail-card__input"
                          type="text"
                          placeholder="apartment suit unit"
                        />
                        <div className="cart-detail-card__input-row">
                          <input
                            className="cart-detail-card__input"
                            type="text"
                            placeholder="city"
                          />
                          <input
                            className="cart-detail-card__input"
                            type="text"
                            placeholder="country"
                          />
                        </div>
                        <div className="cart-detail-card__input-row">
                          <input
                            className="cart-detail-card__input"
                            type="text"
                            placeholder="state/ province"
                          />
                          <input
                            className="cart-detail-card__input"
                            type="text"
                            placeholder="zip/post code"
                          />
                        </div>
                      </form>
                    ) : null}
                    <button
                      type="button"
                      className="cart-detail-card__purchase-btn"
                    >
                      PURCHASE
                    </button>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </dialog>
    );
  },
);
