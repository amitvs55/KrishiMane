"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Tab = "overview" | "orders" | "products" | "users" | "inventory";

interface Stats {
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_products: number;
  orders_by_status: Record<string, number>;
  recent_orders: OrderSummary[];
}

interface OrderSummary {
  order_id: string;
  order_number: string;
  grand_total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  item_count: number;
  created_at: string | null;
}

interface OrderDetail {
  order_id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping: number;
  gst: number;
  grand_total: number;
  address: {
    name: string;
    phone: string;
    pin: string;
    city: string;
    state: string;
    line1: string;
    line2: string;
  };
  items: {
    product_name: string;
    variant_label: string;
    price: number;
    qty: number;
    total: number;
  }[];
  created_at: string | null;
}

interface ProductAdmin {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  badge: string;
  img: string;
  tags: string;
  description: string;
  category: string;
  is_active: boolean;
  variants: VariantAdmin[];
}

interface VariantAdmin {
  id: string;
  label: string;
  price: number;
  stock: number;
  is_active: boolean;
}

interface UserAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  order_count: number;
  created_at: string | null;
}

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_emoji: string;
  grain_stock_kg: number;
  grain_used_kg: number;
  grain_remaining_kg: number;
  grain_pct_used: number;
  oil_yield_pct: number;
  oil_produced_kg: number;
  oil_sold_kg: number;
  oil_remaining_kg: number;
  oil_pct_sold: number;
}

function getToken() {
  return localStorage.getItem("km_token") || "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

const STATUS_COLORS: Record<string, string> = {
  placed: "#e8b84b",
  confirmed: "#4a7c2a",
  shipped: "#2d5016",
  delivered: "#1a3a0a",
  cancelled: "#c0392b",
};

const STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editingGrain, setEditingGrain] = useState<string | null>(null);
  const [editGrainStock, setEditGrainStock] = useState("");
  const [editingGrainUsed, setEditingGrainUsed] = useState<string | null>(null);
  const [editGrainUsed, setEditGrainUsed] = useState("");

  // Add Product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", slug: "", emoji: "🫒", badge: "", description: "", img: "",
    tags: "", category: "oil", yield_pct: 0, grain_stock_kg: 50000,
  });
  const [newVariants, setNewVariants] = useState<{ label: string; price: number; weight: number; stock: number }[]>([
    { label: "", price: 0, weight: 0, stock: 100 },
  ]);
  const [addingVariantTo, setAddingVariantTo] = useState<string | null>(null);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("100");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/stats`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/orders`, { headers: authHeaders() });
      if (res.ok) setOrders(await res.json());
    } catch {}
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/products`, { headers: authHeaders() });
      if (res.ok) setProducts(await res.json());
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/users`, { headers: authHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch {}
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/inventory`, { headers: authHeaders() });
      if (res.ok) setInventory(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    setLoadingData(true);
    const load = async () => {
      if (activeTab === "overview") await fetchStats();
      else if (activeTab === "orders") await fetchOrders();
      else if (activeTab === "products") await fetchProducts();
      else if (activeTab === "users") await fetchUsers();
      else if (activeTab === "inventory") await fetchInventory();
      setLoadingData(false);
    };
    load();
  }, [activeTab, user, fetchStats, fetchOrders, fetchProducts, fetchUsers, fetchInventory]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.order_id === orderId) {
          setSelectedOrder({ ...selectedOrder, status });
        }
      }
    } catch {}
  };

  const viewOrderDetail = async (orderId: string) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}`, { headers: authHeaders() });
      if (res.ok) setSelectedOrder(await res.json());
    } catch {}
  };

  const toggleProduct = async (productId: string) => {
    try {
      const res = await fetch(`${API}/admin/products/${productId}`, {
        method: "PUT",
        headers: authHeaders(),
      });
      if (res.ok) fetchProducts();
    } catch {}
  };

  const saveVariant = async (variantId: string) => {
    const body: Record<string, number> = {};
    if (editPrice) body.price = parseFloat(editPrice);
    if (editStock) body.stock = parseInt(editStock);
    try {
      const res = await fetch(`${API}/admin/variants/${variantId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditingVariant(null);
        fetchProducts();
      }
    } catch {}
  };

  const startEditVariant = (v: VariantAdmin) => {
    setEditingVariant(v.id);
    setEditPrice(v.price.toString());
    setEditStock(v.stock.toString());
  };

  const updateGrainStock = async (productId: string) => {
    if (!editGrainStock) return;
    try {
      const res = await fetch(`${API}/admin/inventory/${productId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ grain_stock_kg: parseFloat(editGrainStock) }),
      });
      if (res.ok) {
        setEditingGrain(null);
        fetchInventory();
      }
    } catch {}
  };

  const updateGrainUsed = async (productId: string) => {
    if (!editGrainUsed) return;
    try {
      const res = await fetch(`${API}/admin/inventory/${productId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ grain_used_kg: parseFloat(editGrainUsed) }),
      });
      if (res.ok) {
        setEditingGrainUsed(null);
        fetchInventory();
      }
    } catch {}
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const createProduct = async () => {
    if (!newProduct.name.trim()) return alert("Product name is required");
    const slug = newProduct.slug.trim() || autoSlug(newProduct.name);
    try {
      const res = await fetch(`${API}/admin/products`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...newProduct,
          slug,
          variants: newVariants.filter((v) => v.label.trim()),
        }),
      });
      if (res.ok) {
        setShowAddProduct(false);
        setNewProduct({ name: "", slug: "", emoji: "🫒", badge: "", description: "", img: "", tags: "", category: "oil", yield_pct: 0, grain_stock_kg: 50000 });
        setNewVariants([{ label: "", price: 0, weight: 0, stock: 100 }]);
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create product");
      }
    } catch {}
  };

  const addVariantToProduct = async (productId: string) => {
    if (!newVariantLabel.trim() || !newVariantPrice) return;
    try {
      const res = await fetch(`${API}/admin/products/${productId}/variants`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ label: newVariantLabel, price: parseFloat(newVariantPrice), stock: parseInt(newVariantStock) || 100 }),
      });
      if (res.ok) {
        setAddingVariantTo(null);
        setNewVariantLabel("");
        setNewVariantPrice("");
        setNewVariantStock("100");
        fetchProducts();
      }
    } catch {}
  };

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="admin-logo-icon">🌿</span>
          <div>
            <div className="admin-logo-text">KrishiMane</div>
            <div className="admin-logo-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="admin-nav">
          {([
            ["overview", "📊", "Overview"],
            ["orders", "📦", "Orders"],
            ["products", "🫒", "Products"],
            ["users", "👥", "Users"],
            ["inventory", "🌾", "Inventory"],
          ] as [Tab, string, string][]).map(([tab, icon, label]) => (
            <button
              key={tab}
              className={`admin-nav-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => { setActiveTab(tab); setSelectedOrder(null); }}
            >
              {icon} {label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/" className="admin-back-btn">← Back to Store</a>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === "overview" && "Dashboard Overview"}
            {activeTab === "orders" && (selectedOrder ? `Order ${selectedOrder.order_number}` : "Order Management")}
            {activeTab === "products" && "Product Management"}
            {activeTab === "users" && "Registered Users"}
            {activeTab === "inventory" && "Grain → Oil Inventory"}
          </h1>
          <div className="admin-user-badge">🛡 {user.name}</div>
        </header>

        <div className="admin-content">
          {loadingData && <div className="admin-loading">Loading data...</div>}

          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && stats && !loadingData && (
            <>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-value">{stats.total_orders}</div>
                  <div className="stat-label">Total Orders</div>
                </div>
                <div className="admin-stat-card revenue">
                  <div className="stat-icon">💰</div>
                  <div className="stat-value">₹{stats.total_revenue.toLocaleString("en-IN")}</div>
                  <div className="stat-label">Total Revenue</div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-value">{stats.total_users}</div>
                  <div className="stat-label">Customers</div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon">🫒</div>
                  <div className="stat-value">{stats.total_products}</div>
                  <div className="stat-label">Active Products</div>
                </div>
              </div>

              {/* Order status breakdown */}
              <div className="admin-section">
                <h2>Orders by Status</h2>
                <div className="admin-status-bar">
                  {STATUSES.map((s) => (
                    <div key={s} className="status-bar-item">
                      <span className="status-dot" style={{ background: STATUS_COLORS[s] }} />
                      <span className="status-name">{s}</span>
                      <span className="status-count">{stats.orders_by_status[s] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent orders */}
              <div className="admin-section">
                <h2>Recent Orders</h2>
                {stats.recent_orders.length === 0 ? (
                  <p className="admin-empty">No orders yet.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_orders.map((o) => (
                        <tr key={o.order_id}>
                          <td className="order-num">{o.order_number}</td>
                          <td>{o.item_count}</td>
                          <td>₹{o.grand_total.toLocaleString("en-IN")}</td>
                          <td>
                            <span className="status-badge" style={{ background: STATUS_COLORS[o.status] }}>
                              {o.status}
                            </span>
                          </td>
                          <td>{formatDate(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ─── ORDERS ─── */}
          {activeTab === "orders" && !loadingData && !selectedOrder && (
            <div className="admin-section">
              {orders.length === 0 ? (
                <p className="admin-empty">No orders found.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.order_id}>
                        <td className="order-num">{o.order_number}</td>
                        <td>{o.item_count}</td>
                        <td>₹{o.grand_total.toLocaleString("en-IN")}</td>
                        <td>{o.payment_method.toUpperCase()}</td>
                        <td>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => updateOrderStatus(o.order_id, e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>{formatDate(o.created_at)}</td>
                        <td>
                          <button className="admin-btn-sm" onClick={() => viewOrderDetail(o.order_id)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ─── ORDER DETAIL ─── */}
          {activeTab === "orders" && selectedOrder && (
            <div className="admin-section">
              <button className="admin-btn-back" onClick={() => setSelectedOrder(null)}>
                ← Back to Orders
              </button>

              <div className="order-detail-grid">
                <div className="order-detail-card">
                  <h3>Order Info</h3>
                  <div className="detail-row"><span>Order #:</span> <strong>{selectedOrder.order_number}</strong></div>
                  <div className="detail-row"><span>Status:</span>
                    <select
                      className="status-select"
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.order_id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="detail-row"><span>Payment:</span> {selectedOrder.payment_method.toUpperCase()} ({selectedOrder.payment_status})</div>
                  <div className="detail-row"><span>Date:</span> {formatDate(selectedOrder.created_at)}</div>
                </div>

                <div className="order-detail-card">
                  <h3>Shipping Address</h3>
                  <p><strong>{selectedOrder.address.name}</strong></p>
                  <p>{selectedOrder.address.line1}</p>
                  {selectedOrder.address.line2 && <p>{selectedOrder.address.line2}</p>}
                  <p>{selectedOrder.address.city}, {selectedOrder.address.state} — {selectedOrder.address.pin}</p>
                  <p>Phone: {selectedOrder.address.phone}</p>
                </div>

                <div className="order-detail-card">
                  <h3>Price Breakdown</h3>
                  <div className="detail-row"><span>Subtotal:</span> ₹{selectedOrder.subtotal.toLocaleString("en-IN")}</div>
                  <div className="detail-row"><span>Shipping:</span> ₹{selectedOrder.shipping}</div>
                  <div className="detail-row"><span>GST:</span> ₹{selectedOrder.gst}</div>
                  <div className="detail-row total"><span>Grand Total:</span> <strong>₹{selectedOrder.grand_total.toLocaleString("en-IN")}</strong></div>
                </div>
              </div>

              <h3 style={{ marginTop: "1.5rem" }}>Items</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product_name}</td>
                      <td>{item.variant_label}</td>
                      <td>₹{item.price}</td>
                      <td>{item.qty}</td>
                      <td>₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── PRODUCTS ─── */}
          {activeTab === "products" && !loadingData && (
            <div className="admin-section">
              <div className="admin-section-header">
                <button className="admin-btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}>
                  {showAddProduct ? "✕ Cancel" : "+ Add New Product"}
                </button>
              </div>

              {/* ── Add Product Form ── */}
              {showAddProduct && (
                <div className="add-product-form">
                  <h3>Create New Product</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input type="text" placeholder="e.g. Sesame Oil" value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value, slug: autoSlug(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Slug (URL-friendly)</label>
                      <input type="text" placeholder="auto-generated" value={newProduct.slug}
                        onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Emoji</label>
                      <input type="text" value={newProduct.emoji}
                        onChange={(e) => setNewProduct({ ...newProduct, emoji: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Badge</label>
                      <input type="text" placeholder="e.g. Heart Healthy" value={newProduct.badge}
                        onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                        <option value="oil">Oil</option>
                        <option value="aata">Chakki Aata</option>
                        <option value="cookies">Millet Cookies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Image Path</label>
                      <input type="text" placeholder="/products/product-name.svg" value={newProduct.img}
                        onChange={(e) => setNewProduct({ ...newProduct, img: e.target.value })} />
                    </div>
                    <div className="form-group full-width">
                      <label>Tags (comma-separated)</label>
                      <input type="text" placeholder="e.g. High Protein,Organic,Farm Fresh" value={newProduct.tags}
                        onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })} />
                    </div>
                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea placeholder="Product description..." value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Yield % (100kg input → X kg output)</label>
                      <input type="number" placeholder="e.g. 40" value={newProduct.yield_pct || ""}
                        onChange={(e) => setNewProduct({ ...newProduct, yield_pct: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label>Initial Grain/Raw Stock (kg)</label>
                      <input type="number" value={newProduct.grain_stock_kg}
                        onChange={(e) => setNewProduct({ ...newProduct, grain_stock_kg: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>

                  <h4 style={{ marginTop: "1rem" }}>Variants</h4>
                  {newVariants.map((v, i) => (
                    <div key={i} className="variant-row">
                      <input type="text" placeholder="Label (e.g. 500 ml • Glass Bottle)" value={v.label}
                        onChange={(e) => { const nv = [...newVariants]; nv[i].label = e.target.value; setNewVariants(nv); }} />
                      <input type="number" placeholder="Price ₹" value={v.price || ""}
                        onChange={(e) => { const nv = [...newVariants]; nv[i].price = parseFloat(e.target.value) || 0; setNewVariants(nv); }} />
                      <input type="number" placeholder="Stock" value={v.stock || ""}
                        onChange={(e) => { const nv = [...newVariants]; nv[i].stock = parseInt(e.target.value) || 0; setNewVariants(nv); }} />
                      {newVariants.length > 1 && (
                        <button className="admin-btn-sm danger" onClick={() => setNewVariants(newVariants.filter((_, j) => j !== i))}>✕</button>
                      )}
                    </div>
                  ))}
                  <button className="admin-btn-sm" onClick={() => setNewVariants([...newVariants, { label: "", price: 0, weight: 0, stock: 100 }])}>
                    + Add Variant
                  </button>

                  <div className="form-actions">
                    <button className="admin-btn-primary" onClick={createProduct}>Create Product</button>
                    <button className="admin-btn-sm" onClick={() => setShowAddProduct(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {products.length === 0 && !showAddProduct ? (
                <p className="admin-empty">No products found.</p>
              ) : (
                /* Group products by category */
                Object.entries(
                  products.reduce<Record<string, ProductAdmin[]>>((acc, p) => {
                    const cat = p.category || "other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(p);
                    return acc;
                  }, {})
                ).map(([category, catProducts]) => (
                  <div key={category} className="product-category-section">
                    <h2 className="category-heading">
                      {category === "oil" && "🫒 Cold-Pressed Oils"}
                      {category === "aata" && "🌾 Chakki Aata"}
                      {category === "cookies" && "🍪 Millet Cookies"}
                      {!["oil", "aata", "cookies"].includes(category) && `📦 ${category}`}
                      <span className="category-count">{catProducts.length} products</span>
                    </h2>

                    {catProducts.map((p) => (
                      <div key={p.id} className={`admin-product-card ${!p.is_active ? "inactive" : ""}`}>
                        <div className="product-card-header">
                          <div>
                            <span className="product-emoji">{p.emoji}</span>
                            <strong>{p.name}</strong>
                            {p.badge && <span className="product-badge-tag">{p.badge}</span>}
                            {!p.is_active && <span className="product-inactive-tag">Inactive</span>}
                          </div>
                          <button
                            className={`admin-btn-sm ${p.is_active ? "danger" : "success"}`}
                            onClick={() => toggleProduct(p.id)}
                          >
                            {p.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>

                        <table className="admin-table compact">
                          <thead>
                            <tr>
                              <th>Variant</th>
                              <th>Price (₹)</th>
                              <th>Stock</th>
                              <th>Active</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.variants.map((v) => (
                              <tr key={v.id}>
                                <td>{v.label}</td>
                                <td>
                                  {editingVariant === v.id ? (
                                    <input type="number" className="admin-input-sm" value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)} />
                                  ) : (
                                    `₹${v.price}`
                                  )}
                                </td>
                                <td>
                                  {editingVariant === v.id ? (
                                    <input type="number" className="admin-input-sm" value={editStock}
                                      onChange={(e) => setEditStock(e.target.value)} />
                                  ) : (
                                    <span className={v.stock < 10 ? "low-stock" : ""}>{v.stock}</span>
                                  )}
                                </td>
                                <td>{v.is_active ? "✅" : "❌"}</td>
                                <td>
                                  {editingVariant === v.id ? (
                                    <div className="admin-btn-group">
                                      <button className="admin-btn-sm success" onClick={() => saveVariant(v.id)}>Save</button>
                                      <button className="admin-btn-sm" onClick={() => setEditingVariant(null)}>Cancel</button>
                                    </div>
                                  ) : (
                                    <button className="admin-btn-sm" onClick={() => startEditVariant(v)}>Edit</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {/* Add variant row */}
                            {addingVariantTo === p.id && (
                              <tr className="add-variant-row">
                                <td>
                                  <input type="text" className="admin-input-sm" placeholder="Label" value={newVariantLabel}
                                    onChange={(e) => setNewVariantLabel(e.target.value)} />
                                </td>
                                <td>
                                  <input type="number" className="admin-input-sm" placeholder="Price" value={newVariantPrice}
                                    onChange={(e) => setNewVariantPrice(e.target.value)} />
                                </td>
                                <td>
                                  <input type="number" className="admin-input-sm" placeholder="Stock" value={newVariantStock}
                                    onChange={(e) => setNewVariantStock(e.target.value)} />
                                </td>
                                <td></td>
                                <td>
                                  <div className="admin-btn-group">
                                    <button className="admin-btn-sm success" onClick={() => addVariantToProduct(p.id)}>Add</button>
                                    <button className="admin-btn-sm" onClick={() => setAddingVariantTo(null)}>Cancel</button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        {addingVariantTo !== p.id && (
                          <button className="admin-btn-sm add-variant-btn" onClick={() => setAddingVariantTo(p.id)}>
                            + Add Variant
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── USERS ─── */}
          {activeTab === "users" && !loadingData && (
            <div className="admin-section">
              {users.length === 0 ? (
                <p className="admin-empty">No users found.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Orders</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || "—"}</td>
                        <td>
                          <span className={`role-badge ${u.role}`}>{u.role}</span>
                        </td>
                        <td>{u.order_count}</td>
                        <td>{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ─── INVENTORY ─── */}
          {activeTab === "inventory" && !loadingData && (
            <div className="admin-section">
              {inventory.length === 0 ? (
                <p className="admin-empty">No inventory data found. Run seed to initialize.</p>
              ) : (
                <>
                  {/* Summary cards — all in kg */}
                  <div className="inv-summary-grid">
                    <div className="inv-summary-card">
                      <div className="stat-icon">🌾</div>
                      <div className="stat-value">
                        {inventory.reduce((s, i) => s + i.grain_remaining_kg, 0).toLocaleString("en-IN")} kg
                      </div>
                      <div className="stat-label">Total Grain Remaining</div>
                    </div>
                    <div className="inv-summary-card">
                      <div className="stat-icon">🫒</div>
                      <div className="stat-value">
                        {inventory.reduce((s, i) => s + i.oil_remaining_kg, 0).toLocaleString("en-IN")} kg
                      </div>
                      <div className="stat-label">Total Oil Remaining</div>
                    </div>
                    <div className="inv-summary-card">
                      <div className="stat-icon">📦</div>
                      <div className="stat-value">
                        {inventory.reduce((s, i) => s + i.oil_sold_kg, 0).toLocaleString("en-IN")} kg
                      </div>
                      <div className="stat-label">Total Oil Sold</div>
                    </div>
                  </div>

                  {/* Per-product inventory cards */}
                  {inventory.map((inv) => (
                    <div key={inv.id} className="inv-product-card">
                      <div className="inv-product-header">
                        <span className="inv-product-title">
                          {inv.product_emoji} {inv.product_name}
                        </span>
                        <span className="inv-yield-badge">
                          Yield: {inv.oil_yield_pct}% (100kg grain → {inv.oil_yield_pct}kg oil)
                        </span>
                      </div>

                      <div className="inv-dual-track">
                        {/* Grain tracker */}
                        <div className="inv-track-section">
                          <h4>🌾 Grain Stock</h4>
                          <div className="inv-stats-row">
                            <div className="inv-stat">
                              <span className="inv-stat-label">Total Stock</span>
                              <span className="inv-stat-value">
                                {editingGrain === inv.product_id ? (
                                  <span className="inv-edit-group">
                                    <input
                                      type="number"
                                      className="admin-input-sm"
                                      value={editGrainStock}
                                      onChange={(e) => setEditGrainStock(e.target.value)}
                                      style={{ width: "120px" }}
                                    />
                                    <span className="inv-unit">kg</span>
                                    <button className="admin-btn-sm success" onClick={() => updateGrainStock(inv.product_id)}>Save</button>
                                    <button className="admin-btn-sm" onClick={() => setEditingGrain(null)}>Cancel</button>
                                  </span>
                                ) : (
                                  <span>
                                    {inv.grain_stock_kg.toLocaleString("en-IN")} kg
                                    <button
                                      className="admin-btn-sm inv-edit-btn"
                                      onClick={() => { setEditingGrain(inv.product_id); setEditGrainStock(inv.grain_stock_kg.toString()); }}
                                    >
                                      Edit
                                    </button>
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="inv-stat">
                              <span className="inv-stat-label">Grain Used (in machine)</span>
                              <span className="inv-stat-value">
                                {editingGrainUsed === inv.product_id ? (
                                  <span className="inv-edit-group">
                                    <input
                                      type="number"
                                      className="admin-input-sm"
                                      value={editGrainUsed}
                                      onChange={(e) => setEditGrainUsed(e.target.value)}
                                      style={{ width: "120px" }}
                                    />
                                    <span className="inv-unit">kg</span>
                                    <button className="admin-btn-sm success" onClick={() => updateGrainUsed(inv.product_id)}>Save</button>
                                    <button className="admin-btn-sm" onClick={() => setEditingGrainUsed(null)}>Cancel</button>
                                  </span>
                                ) : (
                                  <span>
                                    {inv.grain_used_kg.toLocaleString("en-IN")} kg
                                    <button
                                      className="admin-btn-sm inv-edit-btn"
                                      onClick={() => { setEditingGrainUsed(inv.product_id); setEditGrainUsed(inv.grain_used_kg.toString()); }}
                                    >
                                      Edit
                                    </button>
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="inv-stat">
                              <span className="inv-stat-label">Remaining</span>
                              <span className="inv-stat-value good">{inv.grain_remaining_kg.toLocaleString("en-IN")} kg</span>
                            </div>
                          </div>
                          <div className="inv-progress-bar">
                            <div
                              className="inv-progress-fill grain"
                              style={{ width: `${Math.min(inv.grain_pct_used, 100)}%` }}
                            />
                          </div>
                          <div className="inv-progress-label">{inv.grain_pct_used}% grain used</div>
                        </div>

                        {/* Oil tracker — auto-calculated */}
                        <div className="inv-track-section">
                          <h4>🫒 Oil (auto-calculated from grain used)</h4>
                          <div className="inv-stats-row">
                            <div className="inv-stat">
                              <span className="inv-stat-label">Produced</span>
                              <span className="inv-stat-value">{inv.oil_produced_kg.toLocaleString("en-IN")} kg</span>
                            </div>
                            <div className="inv-stat">
                              <span className="inv-stat-label">Sold</span>
                              <span className="inv-stat-value warn">{inv.oil_sold_kg.toLocaleString("en-IN")} kg</span>
                            </div>
                            <div className="inv-stat">
                              <span className="inv-stat-label">Remaining</span>
                              <span className="inv-stat-value good">{inv.oil_remaining_kg.toLocaleString("en-IN")} kg</span>
                            </div>
                          </div>
                          <div className="inv-progress-bar">
                            <div
                              className="inv-progress-fill oil"
                              style={{ width: `${Math.min(inv.oil_pct_sold, 100)}%` }}
                            />
                          </div>
                          <div className="inv-progress-label">{inv.oil_pct_sold}% oil sold</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
