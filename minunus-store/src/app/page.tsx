"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

// Types
type Role = "ADMIN" | "CLIENT";
type View = "inventory" | "sales" | "admin" | "stats";

type User = {
  id: number;
  username: string;
  role: Role;
};

type Product = {
  id: number;
  name: string;
  size: string;
  sellingPrice: number;
  purchasePrice?: number;
  quantity?: number;
};

type Sale = {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  user: { username: string };
  product: { name: string; size: string };
};

type Purchase = {
  id: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  createdAt: string;
  product: { name: string; size: string };
};

// Simplified Clear Icons
const IconInventory = () => (
   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10l8 4m0-10l8-4m-8 4v10M4 7l8-4m0 0l8 4m-8 16V11" />
  </svg>
);

const IconCart = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const IconAdmin = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconPlus = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>("inventory");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  const [saleProductId, setSaleProductId] = useState(0);
  const [saleQty, setSaleQty] = useState(1);

  const [purchaseProductId, setPurchaseProductId] = useState(0);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseUnitCost, setPurchaseUnitCost] = useState(0);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const selectedSaleProduct = useMemo(
    () => products.find((p) => p.id === saleProductId),
    [products, saleProductId],
  );

  const [createName, setCreateName] = useState("");
  const [createSize, setCreateSize] = useState("");
  const [createSellingPrice, setCreateSellingPrice] = useState(0);
  const [createPurchasePrice, setCreatePurchasePrice] = useState(0);
  const [createQuantity, setCreateQuantity] = useState(0);

  const fetchJSON = useCallback(async <T,>(url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data as T;
  }, []);

  const refreshData = useCallback(async (role: Role) => {
    const [productsRes, salesRes] = await Promise.all([
      fetchJSON<{ products: Product[] }>("/api/products"),
      fetchJSON<{ sales: Sale[] }>("/api/sales"),
    ]);
    const nextProducts = productsRes.products;
    setProducts(nextProducts);
    setSales(salesRes.sales);

    if (nextProducts.length > 0) {
      if (!nextProducts.some(p => p.id === saleProductId)) {
        setSaleProductId(nextProducts[0].id);
      }
      if (!nextProducts.some(p => p.id === purchaseProductId)) {
        setPurchaseProductId(nextProducts[0].id);
      }
    }

    if (role === "ADMIN") {
      const purchasesRes = await fetchJSON<{ purchases: Purchase[] }>("/api/purchases");
      setPurchases(purchasesRes.purchases);
    }
  }, [fetchJSON, saleProductId, purchaseProductId]);

  const bootstrap = useCallback(async () => {
    try {
      setLoading(true);
      const me = await fetchJSON<{ user: User | null }>("/api/me");
      setUser(me.user);
      if (me.user) await refreshData(me.user.role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Initialization failed");
    } finally {
      setLoading(false);
    }
  }, [fetchJSON, refreshData]);

  useEffect(() => {
    setMounted(true);
    bootstrap();
  }, [bootstrap]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetchJSON<{ user: User }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(res.user);
      await refreshData(res.user.role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auth failed");
    }
  }

  async function onSale(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      await fetchJSON<{ sale: Sale }>("/api/sales", {
        method: "POST",
        body: JSON.stringify({ productId: saleProductId, quantity: saleQty }),
      });
      if (user) await refreshData(user.role);
      setInfo("Sale registered successfully!");
      setSaleQty(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sale failed");
    }
  }

  async function onPurchase(e: FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    try {
      await fetchJSON<{ purchase: Purchase }>("/api/purchases", {
        method: "POST",
        body: JSON.stringify({ productId: purchaseProductId, quantity: purchaseQty, unitCost: purchaseUnitCost }),
      });
      if (user) await refreshData(user.role);
      setInfo("Stock replenished successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refill failed");
    }
  }

  async function onAdminCreateProduct(e: FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    try {
      await fetchJSON<{ product: Product }>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: createName,
          size: createSize,
          sellingPrice: createSellingPrice,
          purchasePrice: createPurchasePrice,
          quantity: createQuantity,
        }),
      });
      setCreateName(""); setCreateSize("");
      setCreateSellingPrice(0); setCreatePurchasePrice(0); setCreateQuantity(0);
      if (user) await refreshData(user.role);
      setInfo("New asset deployed to catalog!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deployment failed");
    }
  }

  if (!mounted || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0f18]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0f18] px-6">
        <div className="w-full max-w-sm rounded-[2rem] bg-[#111827] p-10 shadow-2xl ring-1 ring-white/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Minunus Store</h1>
            <p className="mt-1 text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Login to Suite</p>
          </div>
          
          <form onSubmit={onLogin} className="space-y-4">
            <input
              className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-[#0a0f18] shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform" type="submit">
              Access Dashboard
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
               <button 
                onClick={() => { setUsername("admin"); setPassword("admin123"); }}
                className="rounded-xl bg-white/5 p-3 text-[10px] font-black uppercase text-white hover:bg-white/10"
               >
                 As Admin
               </button>
               <button 
                onClick={() => { setUsername("client"); setPassword("client123"); }}
                className="rounded-xl bg-white/5 p-3 text-[10px] font-black uppercase text-white hover:bg-white/10"
               >
                 As Client
               </button>
            </div>
          </div>

          {error && <p className="mt-4 text-center text-xs font-bold text-red-500">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f18] text-gray-300 pb-24">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-[#0a0f18]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">Minunus Store</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase">{activeView}</p>
          </div>
          <button onClick={() => { fetch("/api/logout", {method:"POST"}).then(() => setUser(null)) }} className="rounded-full bg-white/5 p-2 px-4 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors">
            Exit
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-6">
        {/* Messages */}
        <div className="mb-6 space-y-2 text-center">
            {error && <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 border border-red-500/20">{error}</div>}
            {info && <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400 border border-emerald-500/20">{info}</div>}
        </div>

        {/* View Content */}
        {activeView === "inventory" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Catalogue Summary</h2>
            {user.role === "ADMIN" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: "Active Stock", val: products.reduce((sum, p) => sum + (p.quantity ?? 0), 0), unit: "Units" },
                  { label: "Equity Value", val: products.reduce((sum, p) => sum + (p.quantity ?? 0) * p.sellingPrice, 0).toLocaleString(), unit: "USD" },
                  { label: "Total Revenue", val: sales.reduce((sum, s) => sum + s.totalPrice, 0).toLocaleString(), unit: "USD" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-3xl bg-[#111827] p-8 relative overflow-hidden group border border-white/5 shadow-xl">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500/60 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-white">{stat.val}</p>
                      <p className="text-[10px] font-bold text-gray-600 uppercase">{stat.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {products.map(p => (
                <div key={p.id} className="rounded-3xl bg-[#111827] p-6 shadow-xl ring-1 ring-white/5 flex justify-between items-center group">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{p.size}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xl font-black text-emerald-400">${p.sellingPrice}</span>
                      <span className="text-[10px] text-gray-600 font-bold uppercase">selling</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{p.quantity ?? 0}</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase">Units</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === "sales" && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-6">Quick Transaction</h2>
              <form onSubmit={onSale} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pick Product</label>
                  <select className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm text-white border border-white/5" value={saleProductId} onChange={e => setSaleProductId(Number(e.target.value))}>
                    {products.map(p => <option key={p.id} value={p.id} className="bg-[#0a0f18]">{p.name} ({p.size})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">How many?</label>
                    <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm text-white" type="number" min={1} value={saleQty} onChange={e => setSaleQty(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Settlement</label>
                    <div className="text-2xl font-black text-white flex items-center justify-end h-14">${selectedSaleProduct ? selectedSaleProduct.sellingPrice * saleQty : 0}</div>
                  </div>
                </div>
                <button className="w-full rounded-2xl bg-white py-5 text-xs font-black uppercase tracking-widest text-[#0a0f18] shadow-2xl active:scale-95 transition-transform" type="submit">
                  Confirm & Process
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Recent Activity</h3>
              <div className="space-y-2">
                {sales.map(s => (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl bg-white/[0.02] p-4 px-6 border-l-2 border-emerald-500">
                    <div>
                      <p className="text-sm font-black text-white">{s.product.name}</p>
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">{new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-emerald-400">+${s.totalPrice}</p>
                       <p className="text-[9px] font-bold text-gray-600 uppercase">{s.quantity} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeView === "admin" && (
           <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
             {/* Refill Section */}
             <div className="rounded-3xl bg-[#111827] p-8 shadow-2xl ring-1 ring-emerald-500/10">
               <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2"><IconPlus /> Stock Refill</h2>
               <form onSubmit={onPurchase} className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Target Product</label>
                   <select className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm text-white border border-white/5" value={purchaseProductId} onChange={e => setPurchaseProductId(Number(e.target.value))}>
                      {products.map(p => <option key={p.id} value={p.id} className="bg-[#0a0f18]">{p.name} ({p.size})</option>)}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Units Added</label>
                      <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm text-white" type="number" min={1} value={purchaseQty} onChange={e => setPurchaseQty(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cost/Unit</label>
                      <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm text-white" type="number" min={0} value={purchaseUnitCost} onChange={e => setPurchaseUnitCost(Number(e.target.value))} />
                    </div>
                 </div>
                 <button className="w-full rounded-2xl bg-emerald-500 py-4 font-black text-[#0a0f18] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform" type="submit">Update Stock Levels</button>
               </form>
             </div>

             {/* Create Product Section */}
             <div className="rounded-3xl bg-[#111827] p-8 shadow-2xl ring-1 ring-white/5 border-dashed border-2 border-white/5">
                <div className="mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Create New Asset</h2>
                  <p className="mt-1 text-[10px] font-bold text-gray-600 uppercase">Initialize a brand new product line</p>
                </div>
                <form onSubmit={onAdminCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm" placeholder="Product Name" value={createName} onChange={e => setCreateName(e.target.value)} required />
                    <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm" placeholder="Spec / Size" value={createSize} onChange={e => setCreateSize(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm" placeholder="Selling Price" type="number" value={createSellingPrice || ""} onChange={e => setCreateSellingPrice(Number(e.target.value))} required />
                    <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm" placeholder="Cost Price" type="number" value={createPurchasePrice || ""} onChange={e => setCreatePurchasePrice(Number(e.target.value))} required />
                    <input className="w-full rounded-2xl bg-[#0a0f18] p-4 text-sm" placeholder="Initial Qty" type="number" value={createQuantity || ""} onChange={e => setCreateQuantity(Number(e.target.value))} required />
                  </div>
                  <button className="w-full rounded-2xl bg-white/5 border border-white/10 py-4 font-black text-white uppercase tracking-widest hover:bg-white/10 transition-colors" type="submit">Deploy Asset</button>
                </form>
             </div>
           </section>
        )}
      </div>

      {/* Bottom Nav: THE REAL FIX */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-[#111827]/80 p-2 px-3 backdrop-blur-2xl border border-white/5 shadow-2xl ring-1 ring-white/10">
        <button
          onClick={() => setActiveView("inventory")}
          className={`flex items-center gap-2 rounded-full p-3 px-6 text-xs font-black uppercase tracking-widest transition-all ${activeView === "inventory" ? "bg-emerald-500 text-[#0a0f18]" : "text-gray-500"}`}
        >
          <IconInventory />
          <span className={activeView === "inventory" ? "block" : "hidden"}>Catalog</span>
        </button>
        <button
          onClick={() => setActiveView("sales")}
          className={`flex items-center gap-2 rounded-full p-3 px-6 text-xs font-black uppercase tracking-widest transition-all ${activeView === "sales" ? "bg-emerald-500 text-[#0a0f18]" : "text-gray-500"}`}
        >
          <IconCart />
          <span className={activeView === "sales" ? "block" : "hidden"}>Sales</span>
        </button>
        {user.role === "ADMIN" && (
          <button
            onClick={() => setActiveView("admin")}
            className={`flex items-center gap-2 rounded-full p-3 px-6 text-xs font-black uppercase tracking-widest transition-all ${activeView === "admin" ? "bg-emerald-500 text-[#0a0f18]" : "text-gray-500"}`}
          >
            <IconAdmin />
            <span className={activeView === "admin" ? "block" : "hidden"}>Manage</span>
          </button>
        )}
      </nav>
    </main>
  );
}
