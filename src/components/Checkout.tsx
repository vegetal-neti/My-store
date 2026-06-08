import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { createOrder, auth } from '../firebase';
import { ArrowLeft, CheckCircle2, Loader2, ShoppingBag } from 'lucide-react';

interface CheckoutProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onBack, onSuccess }) => {
  const { cartItems, subtotal, clearCart } = useCart();
  const shipping = cartItems.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    stateCity: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cartItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-brand-bg min-h-screen">
        <div className="w-16 h-16 rounded-full bg-neutral-200/50 flex items-center justify-center mb-6 text-neutral-400">
          <ShoppingBag size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-medium text-brand-text mb-2">Your cart is empty</h3>
        <p className="text-[15px] text-neutral-500 mb-8 max-w-[250px] text-center">Cannot proceed to checkout with an empty cart.</p>
        <button 
          onClick={onBack} 
          className="bg-brand-text text-white px-8 py-3.5 rounded-full font-medium text-[15px] hover:bg-neutral-800 transition-colors shadow-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        userId: auth.currentUser?.uid || null,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name || item.title || 'Unknown',
          price: item.price,
          image: item.image || null,
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null
        })),
        totalPrice: total,
        customerInfo: formData,
        paymentMethod: 'COD',
        status: 'pending',
      };

      await createOrder(orderData);
      clearCart();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Failed to create order. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg pb-10">
      <header className="px-5 pt-4 pb-3 flex items-center sticky top-0 bg-brand-bg/95 backdrop-blur-md z-10 border-b border-neutral-200/60">
        <button onClick={onBack} className="text-brand-text p-1 -ml-1 hover:text-neutral-600 transition-colors">
          <ArrowLeft strokeWidth={1.5} size={24} />
        </button>
        <h1 className="font-serif italic text-2xl tracking-tight ml-3">Checkout</h1>
      </header>

      <div className="px-5 mt-6 relative z-0">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[14px] mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 mb-6">
          <h2 className="font-medium text-brand-text mb-4 text-[17px]">Order Summary</h2>
          <div className="flex flex-col gap-3">
            {cartItems.map(item => (
              <div key={item.cartItemId} className="flex justify-between items-center text-[14px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name || item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-brand-card-beige" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-brand-text line-clamp-1">{item.name || item.title}</p>
                    <p className="text-neutral-500 text-[12px]">Qty: {item.quantity}</p>
                  </div>
                </div>
                 <span className="font-medium text-brand-text inline-flex gap-1" dir="ltr">
                  <span>دج</span>
                  <span>{((item.price || 0) * item.quantity).toFixed(0)}</span>
                </span>
              </div>
            ))}
          </div>
          
          <div className="w-full h-px bg-neutral-100 my-4"></div>
          
          <div className="flex flex-col gap-2 text-[14px]">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="inline-flex gap-1" dir="ltr">
                <span>دج</span>
                <span>{subtotal.toFixed(0)}</span>
              </span>
            </div>
            <div className="flex justify-between text-neutral-500">
               <span>Shipping</span>
               <span className="inline-flex gap-1" dir="ltr">
                 <span>دج</span>
                 <span>{shipping.toFixed(0)}</span>
               </span>
            </div>
            <div className="flex justify-between text-[16px] font-medium text-brand-text mt-2 pt-2 border-t border-neutral-100">
               <span>Total</span>
               <span className="inline-flex gap-1" dir="ltr">
                 <span>دج</span>
                 <span>{total.toFixed(0)}</span>
               </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="font-medium text-brand-text mb-1 text-[17px]">Shipping Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] text-neutral-500 mb-1.5 ml-1">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-brand-text transition-colors shadow-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-[13px] text-neutral-500 mb-1.5 ml-1">Phone Number</label>
              <input 
                required
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-brand-text transition-colors shadow-sm"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-[13px] text-neutral-500 mb-1.5 ml-1">State / City</label>
              <input 
                required
                type="text" 
                value={formData.stateCity}
                onChange={e => setFormData({...formData, stateCity: e.target.value})}
                className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-brand-text transition-colors shadow-sm"
                placeholder="New York, NY"
              />
            </div>

            <div>
              <label className="block text-[13px] text-neutral-500 mb-1.5 ml-1">Address</label>
              <textarea 
                required
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full bg-white border border-neutral-200/80 rounded-xl px-4 py-3.5 text-[15px] outline-none focus:border-brand-text transition-colors shadow-sm min-h-[100px] resize-y"
                placeholder="Street address, apartment, suite, etc."
              />
            </div>
          </div>

          {/* Cash on Delivery Information Card */}
          <div className="bg-neutral-50/80 border border-neutral-200/50 rounded-2xl p-4.5 mt-2 shadow-sm">
            <h3 className="font-semibold text-brand-text text-[14px] flex items-center justify-between mb-2">
              <span>طريقة الدفع / Payment Method</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider">
                COD ONLY
              </span>
            </h3>
            <p className="text-[14px] text-brand-text font-medium leading-relaxed">
              الدفع عند الاستلام (Cash on Delivery)
            </p>
            <p className="text-[12px] text-neutral-500 mt-1.5 leading-relaxed">
              ستقوم بالدفع نقداً للمندوب عند استلام طلبك من عتبة بابك. لا توجد أي رسوم خفية.
              <br />
              You will pay in cash to the delivery courier when your order arrives. No online payment required.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-text text-white py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg text-[15px] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Order'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export const OrderSuccess: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-brand-bg min-h-screen">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="text-green-500 w-10 h-10" />
      </div>
      <h3 className="font-serif italic text-3xl text-brand-text mb-3">Thank you!</h3>
      <p className="text-[15px] text-neutral-500 mb-8 max-w-[280px] text-center leading-relaxed">
        Your order has been placed successfully. We'll send you an update when it ships!
      </p>
      <button 
        onClick={onBackToHome} 
        className="bg-brand-text text-white px-8 py-3.5 rounded-full font-medium text-[15px] hover:bg-neutral-800 transition-colors shadow-sm w-full sm:w-auto"
      >
        Continue Shopping
      </button>
    </div>
  );
};
