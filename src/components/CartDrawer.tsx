import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const { isCartOpen, toggleCart, cartItems, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const shipping = cartItems.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 z-[80] transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={toggleCart}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 bottom-0 right-0 w-full sm:w-[420px] bg-brand-bg z-[90] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-neutral-200/60 bg-brand-bg/95 backdrop-blur-md shrink-0">
          <h2 className="font-serif italic text-2xl text-brand-text flex items-center gap-2">
            Your Cart
            {cartItems.length > 0 && (
              <span className="text-sm font-sans not-italic text-neutral-500 font-normal">
                ({cartItems.length})
              </span>
            )}
          </h2>
          <button onClick={toggleCart} className="text-neutral-500 hover:text-brand-text transition-colors p-1">
            <X strokeWidth={1.5} size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-20">
              <div className="w-16 h-16 rounded-full bg-neutral-200/50 flex items-center justify-center mb-6 text-neutral-400">
                <ShoppingBag size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-brand-text mb-2">Your cart is empty</h3>
              <p className="text-[15px] text-neutral-500 mb-8 max-w-[250px]">Looks like you haven't added anything to your cart yet.</p>
              <button 
                onClick={toggleCart} 
                className="bg-brand-text text-white px-8 py-3.5 rounded-full font-medium text-[15px] hover:bg-neutral-800 transition-colors w-full sm:w-auto shadow-sm"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-2 -mt-2">
                <button onClick={clearCart} className="text-[13px] text-neutral-500 hover:text-brand-accent transition-colors underline underline-offset-2">
                  Clear all items
                </button>
              </div>
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="flex gap-4 group">
                  {/* Image Placeholder */}
                  <div className={`w-28 h-[140px] rounded-xl shrink-0 ${item.image ? 'bg-neutral-100 overflow-hidden relative' : (item.bgColor === 'gray' ? 'bg-brand-card-gray' : 'bg-brand-card-beige')}`}>
                    {item.image && (
                      <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex w-full flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[15px] font-medium text-brand-text leading-snug pr-3">{item.title}</h3>
                        <button onClick={() => removeFromCart(item.cartItemId)} className="text-neutral-400 hover:text-brand-accent transition-colors p-1 -m-1">
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="text-[13px] text-neutral-500 mb-0.5">Size: {item.size}</p>
                      <p className="text-[13px] text-neutral-500">Color: {item.color}</p>
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                      <span className="text-[15px] font-medium text-brand-text inline-flex gap-1" dir="ltr">
                        <span>دج</span>
                        <span>{(item.price || 0).toFixed(0)}</span>
                      </span>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-white border border-neutral-200/80 rounded-full px-2.5 py-1.5 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, -1)}
                          className="text-neutral-500 hover:text-brand-text disabled:opacity-40 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className="text-[14px] font-medium text-brand-text w-5 text-center leading-none mt-0.5">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, 1)}
                          className="text-neutral-500 hover:text-brand-text transition-colors"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="bg-white px-6 pt-5 pb-8 border-t border-neutral-200/60 shrink-0">
            <div className="flex flex-col gap-3.5 mb-6">
              <div className="flex justify-between text-[15px] text-neutral-500">
                <span>Subtotal</span>
                <span className="inline-flex gap-1" dir="ltr">
                  <span>دج</span>
                  <span>{subtotal.toFixed(0)}</span>
                </span>
              </div>
              <div className="flex justify-between text-[15px] text-neutral-500">
                <span>Shipping</span>
                <span className="inline-flex gap-1" dir="ltr">
                  <span>دج</span>
                  <span>{shipping.toFixed(0)}</span>
                </span>
              </div>
              <div className="w-full h-px bg-neutral-100 my-1"></div>
              <div className="flex justify-between text-[17px] font-medium text-brand-text">
                <span>Total</span>
                <span className="inline-flex gap-1" dir="ltr">
                  <span>دج</span>
                  <span>{total.toFixed(0)}</span>
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                toggleCart();
                onCheckout?.();
              }}
              className="w-full bg-brand-text text-white py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg text-[15px]"
            >
              Proceed to Checkout
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
