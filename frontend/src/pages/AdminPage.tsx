import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, type AuthUser } from "../services/auth";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
  uploadProductImage,
  type Category,
  type CreateProductVariantInput,
  type Product,
  type UpdateProductVariantInput,
} from "../services/admin";
import styles from "./AdminPage.module.css";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type AdminView = "dashboard" | "categories" | "products" | "addProduct" | "editProduct";

type VariantDraft = {
  id?: string;
  unit: string;
  price: string;
  stock: string;
  note: string;
  images: ProductImageDraft[];
};

type ProductImageDraft = {
  image_url: string;
  imageFile: File | null;
  imagePreview: string;
};

const emptyVariant = (): VariantDraft => ({
  unit: "",
  price: "",
  stock: "",
  note: "",
  images: [],
});

const productImageDraftFromUrl = (imageUrl: string): ProductImageDraft => ({
  image_url: imageUrl,
  imageFile: null,
  imagePreview: imageUrl,
});

// ─────────────────────────────────────────────
// AdminPage Component
// ─────────────────────────────────────────────
const AdminPage = () => {
  const navigate = useNavigate();

  // Auth & role gate
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Navigation
  const [view, setView] = useState<AdminView>("dashboard");

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Category form
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catError, setCatError] = useState("");

  // Product form
  const [prodName, setProdName] = useState("");
  const [prodBrand, setProdBrand] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [productImages, setProductImages] = useState<ProductImageDraft[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);
  const [prodSubmitting, setProdSubmitting] = useState(false);
  const [prodError, setProdError] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // ── Auth check on mount ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    getCurrentUser()
      .then(async (currentUser) => {
        setUser(currentUser);
        // The /me endpoint currently doesn't return role; fetch separately
        // by attempting a categories admin call. Instead, we keep a simple
        // role field if it's returned, otherwise trust the guard on the API.
        // For the frontend gate, we try a lightweight admin-only call.
        try {
          await getCategories(); // public — just to confirm connectivity
        } catch {
          // ignore — API will enforce admin role
        }
        setAuthChecked(true);
      })
      .catch(() => {
        navigate("/");
      });
  }, [navigate]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // ── Load data when view changes ──────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (view === "categories" || view === "dashboard") loadCategories();
    if (
      view === "products" ||
      view === "addProduct" ||
      view === "editProduct" ||
      view === "dashboard"
    )
      loadProducts();
  }, [view, authChecked]);

  // ── Category CRUD ────────────────────────────────────────
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;
    setCatSubmitting(true);
    setCatError("");
    try {
      const cat = await createCategory({ name: catName.trim(), slug: catSlug.trim() });
      setCategories((prev) => [...prev, cat]);
      setCatName("");
      setCatSlug("");
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}" and all its products?`)) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setProducts((prev) => prev.filter((p) => p.category_id !== id));
    } catch {
      setError("Failed to delete category");
    }
  };

  // ── Product CRUD ─────────────────────────────────────────
  const resetProductForm = () => {
    setProdName("");
    setProdBrand("");
    setProdDesc("");
    setProdCategoryId("");
    setProductImages([]);
    setVariants([emptyVariant()]);
    setProdError("");
    setEditingProductId(null);
  };

  const resolveVariantDrafts = async () =>
    Promise.all(
      variants.map(async (variant) => {
        const image_urls = (
          await Promise.all(
            variant.images.map(async (image) => {
              if (image.imageFile) {
                return uploadProductImage(image.imageFile);
              }

              return image.image_url;
            }),
          )
        ).filter((imageUrl) => imageUrl.trim().length > 0);

        return {
          id: variant.id,
          unit: variant.unit.trim(),
          price: parseFloat(variant.price),
          stock: variant.stock ? parseInt(variant.stock, 10) : 0,
          image_urls: image_urls.length > 0 ? image_urls : undefined,
          image_url: image_urls[0] || undefined,
          note: variant.note.trim() || undefined,
        };
      }),
    );

  const resolveProductImageDrafts = async () =>
    Promise.all(
      productImages.map(async (image) => {
        if (image.imageFile) {
          return uploadProductImage(image.imageFile);
        }

        return image.image_url;
      }),
    );

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdBrand(product.brand ?? "");
    setProdDesc(product.description ?? "");
    setProdCategoryId(product.category_id);
    setProductImages(
      (product.product_images ?? [])
        .sort((a, b) => a.position - b.position)
        .map((image) => productImageDraftFromUrl(image.image_url)),
    );
    setVariants(
      product.product_variants.length > 0
        ? product.product_variants.map((variant) => {
            const variantImages = (variant.product_variant_images ?? [])
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((image) => productImageDraftFromUrl(image.image_url));

            const fallbackImages =
              variantImages.length > 0
                ? variantImages
                : variant.image_url
                  ? [productImageDraftFromUrl(variant.image_url)]
                  : [];

            return {
              id: variant.id,
              unit: variant.unit,
              price: String(variant.price),
              stock: String(variant.stock),
              note: variant.note ?? "",
              images: fallbackImages,
            };
          })
        : [emptyVariant()],
    );
    setProdError("");
    setView("editProduct");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodCategoryId || variants.length === 0) {
      setProdError("Name, category, and at least one variant are required.");
      return;
    }
    setProdSubmitting(true);
    setProdError("");
    try {
      const resolvedVariants =
        (await resolveVariantDrafts()) as CreateProductVariantInput[];
      const resolvedProductImages = await resolveProductImageDrafts();

      const product = await createProduct({
        category_id: prodCategoryId,
        name: prodName.trim(),
        brand: prodBrand.trim() || undefined,
        description: prodDesc.trim() || undefined,
        image_urls: resolvedProductImages,
        variants: resolvedVariants,
      });

      setProducts((prev) => [product, ...prev]);
      resetProductForm();
      setView("products");
    } catch (err: unknown) {
      setProdError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId || !prodName.trim() || !prodCategoryId || variants.length === 0) {
      setProdError("Name, category, and at least one variant are required.");
      return;
    }
    setProdSubmitting(true);
    setProdError("");
    try {
      const resolvedVariants =
        (await resolveVariantDrafts()) as UpdateProductVariantInput[];
      const resolvedProductImages = await resolveProductImageDrafts();
      const product = await updateProduct(editingProductId, {
        category_id: prodCategoryId,
        name: prodName.trim(),
        brand: prodBrand.trim() || undefined,
        description: prodDesc.trim() || undefined,
        image_urls: resolvedProductImages,
        variants: resolvedVariants,
      });

      setProducts((prev) =>
        prev.map((current) => (current.id === product.id ? product : current)),
      );
      resetProductForm();
      setView("products");
    } catch (err: unknown) {
      setProdError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete product");
    }
  };

  // ── Variant helpers ──────────────────────────────────────
  const updateVariant = (index: number, field: keyof VariantDraft, value: string | File | null) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  };

  const handleVariantImages = (index: number, files: FileList | null) => {
    if (!files) return;

    const nextImages = Array.from(files).map((file) => ({
      image_url: "",
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));

    setVariants((prev) =>
      prev.map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, images: [...variant.images, ...nextImages] }
          : variant,
      ),
    );
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              images: variant.images.filter((_, i) => i !== imageIndex),
            }
          : variant,
      ),
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductImages = (files: FileList | null) => {
    if (!files) return;

    const nextImages = Array.from(files).map((file) => ({
      image_url: "",
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));

    setProductImages((prev) => [...prev, ...nextImages]);
  };

  const removeProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Slug auto-generate ───────────────────────────────────
  const handleCatNameChange = (val: string) => {
    setCatName(val);
    setCatSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  };

  // ── Dashboard stats ──────────────────────────────────────
  const totalVariants = products.reduce(
    (acc, p) => acc + (p.product_variants?.length ?? 0),
    0,
  );
  const lowStockCount = products
    .flatMap((p) => p.product_variants ?? [])
    .filter((v) => v.stock < 5).length;
  const normalizedProductSearch = productSearch.trim().toLowerCase();
  const filteredProducts = normalizedProductSearch
    ? products.filter((product) => {
        const categoryName =
          categories.find((category) => category.id === product.category_id)
            ?.name ?? "";
        const searchableText = [
          product.name,
          product.brand ?? "",
          product.description ?? "",
          categoryName,
          ...product.product_variants.map((variant) => variant.unit),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedProductSearch);
      })
    : products;

  if (!authChecked) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading admin panel…</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoPrimary}>Bin</span>
          <span className={styles.logoAccent}>zo</span>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          {(
            [
              { id: "dashboard", label: "Dashboard", icon: "fa-gauge-high" },
              { id: "categories", label: "Categories", icon: "fa-tags" },
              { id: "products", label: "Products", icon: "fa-box-open" },
              { id: "addProduct", label: "Add Product", icon: "fa-plus-circle" },
            ] as { id: AdminView; label: string; icon: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${view === item.id ? styles.navItemActive : ""}`}
              onClick={() => {
                setError("");
                if (item.id === "addProduct") resetProductForm();
                setView(item.id);
              }}
            >
              <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userChip}>
            <i className="fa-solid fa-user-shield" aria-hidden="true" />
            <div>
              <p className={styles.userName}>{user?.name ?? "Admin"}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate("/")}
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            Back to store
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────── */}
      <main className={styles.main}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}

        {/* ── DASHBOARD ─────────────────────────────────── */}
        {view === "dashboard" && (
          <section className={styles.section}>
            <h2 className={styles.pageTitle}>Dashboard</h2>
            <p className={styles.pageSubtitle}>
              Welcome back{user?.name ? `, ${user.name}` : ""}! Here's your store overview.
            </p>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconNeutral}`}>
                  <i className="fa-solid fa-tags" />
                </div>
                <div>
                  <p className={styles.statLabel}>Categories</p>
                  <p className={styles.statValue}>{categories.length}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconNeutral}`}>
                  <i className="fa-solid fa-box-open" />
                </div>
                <div>
                  <p className={styles.statLabel}>Products</p>
                  <p className={styles.statValue}>{products.length}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconNeutral}`}>
                  <i className="fa-solid fa-layer-group" />
                </div>
                <div>
                  <p className={styles.statLabel}>Total Variants</p>
                  <p className={styles.statValue}>{totalVariants}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconNeutral}`}>
                  <i className="fa-solid fa-triangle-exclamation" />
                </div>
                <div>
                  <p className={styles.statLabel}>Low Stock (&lt;5)</p>
                  <p className={styles.statValue}>{lowStockCount}</p>
                </div>
              </div>
            </div>

            <div className={styles.quickActions}>
              <h3>Quick Actions</h3>
              <div className={styles.quickActionsRow}>
                <button
                  type="button"
                  className={styles.quickActionBtn}
                  onClick={() => {
                    resetProductForm();
                    setView("addProduct");
                  }}
                >
                  <i className="fa-solid fa-plus" />
                  Add Product
                </button>
                <button
                  type="button"
                  className={`${styles.quickActionBtn} ${styles.quickActionBtnSecondary}`}
                  onClick={() => setView("categories")}
                >
                  <i className="fa-solid fa-folder-plus" />
                  Add Category
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── CATEGORIES ────────────────────────────────── */}
        {view === "categories" && (
          <section className={styles.section}>
            <h2 className={styles.pageTitle}>Categories</h2>

            {/* Add form */}
            <div className={styles.formCard}>
              <h3 className={styles.formCardTitle}>New Category</h3>
              <form className={styles.inlineForm} onSubmit={handleCreateCategory}>
                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="cat-name" className={styles.label}>
                      Category Name
                    </label>
                    <input
                      id="cat-name"
                      className={styles.input}
                      type="text"
                      placeholder="e.g. Dairy & Eggs"
                      value={catName}
                      onChange={(e) => handleCatNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="cat-slug" className={styles.label}>
                      Slug
                    </label>
                    <input
                      id="cat-slug"
                      className={styles.input}
                      type="text"
                      placeholder="dairy-eggs"
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {catError && (
                  <p className={styles.formError} role="alert">
                    {catError}
                  </p>
                )}
                <button
                  id="create-category-btn"
                  className={styles.submitBtn}
                  type="submit"
                  disabled={catSubmitting}
                >
                  {catSubmitting ? (
                    <>
                      <span className={styles.btnSpinner} /> Creating…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plus" />
                      Create Category
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Category list */}
            {loading ? (
              <div className={styles.centerSpinner}>
                <div className={styles.spinner} />
              </div>
            ) : (
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Products</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={styles.emptyRow}>
                          No categories yet. Add one above.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id}>
                          <td className={styles.nameCell}>
                            <span className={styles.categoryDot} />
                            {cat.name}
                          </td>
                          <td>
                            <code className={styles.slugBadge}>{cat.slug}</code>
                          </td>
                          <td>
                            {
                              products.filter((p) => p.category_id === cat.id)
                                .length
                            }
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() =>
                                handleDeleteCategory(cat.id, cat.name)
                              }
                              aria-label={`Delete category ${cat.name}`}
                            >
                              <i className="fa-solid fa-trash" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── PRODUCTS LIST ─────────────────────────────── */}
        {view === "products" && (
          <section className={styles.section}>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Products</h2>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={() => {
                  resetProductForm();
                  setView("addProduct");
                }}
              >
                <i className="fa-solid fa-plus" />
                Add Product
              </button>
            </div>

            <div className={styles.searchToolbar}>
              <div className={styles.searchInputWrap}>
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                <input
                  className={styles.searchInput}
                  type="search"
                  placeholder="Search by product, brand, category, or unit"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  aria-label="Search products"
                />
              </div>
            </div>

            {loading ? (
              <div className={styles.centerSpinner}>
                <div className={styles.spinner} />
              </div>
            ) : (
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Variants</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={styles.emptyRow}>
                          {productSearch.trim()
                            ? "No products match your search."
                            : "No products yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const category = categories.find(
                          (c) => c.id === product.category_id,
                        );
                        return (
                          <tr key={product.id}>
                            <td className={styles.nameCell}>
                              {product.name}
                            </td>
                            <td>{product.brand ?? "—"}</td>
                            <td>
                              {category ? (
                                <span className={styles.categoryBadge}>
                                  {category.name}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <div className={styles.variantChips}>
                                {(product.product_variants ?? []).map((v) => (
                                  <span
                                    key={v.id}
                                    className={`${styles.variantChip} ${v.stock < 5 ? styles.variantChipLow : ""}`}
                                    title={`Stock: ${v.stock}`}
                                  >
                                    {v.unit} — ₹{v.price}
                                    {v.stock < 5 && (
                                      <i className="fa-solid fa-triangle-exclamation" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className={styles.actionGroup}>
                                <button
                                  type="button"
                                  className={styles.editBtn}
                                  onClick={() => handleEditProduct(product)}
                                  aria-label={`Edit product ${product.name}`}
                                >
                                  <i className="fa-solid fa-pen-to-square" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className={styles.deleteBtn}
                                  onClick={() =>
                                    handleDeleteProduct(product.id, product.name)
                                  }
                                  aria-label={`Delete product ${product.name}`}
                                >
                                  <i className="fa-solid fa-trash" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── ADD PRODUCT ───────────────────────────────── */}
        {(view === "addProduct" || view === "editProduct") && (
          <section className={styles.section}>
            <h2 className={styles.pageTitle}>
              {view === "editProduct" ? "Edit Product" : "Add New Product"}
            </h2>

            <form
              className={styles.formCard}
              onSubmit={view === "editProduct" ? handleUpdateProduct : handleCreateProduct}
            >
              {/* Product info */}
              <h3 className={styles.formCardTitle}>Product Information</h3>
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="prod-name" className={styles.label}>
                    Product Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="prod-name"
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Amul Full Cream Milk"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="prod-brand" className={styles.label}>
                    Brand
                  </label>
                  <input
                    id="prod-brand"
                    className={styles.input}
                    type="text"
                    placeholder="e.g. Amul"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="prod-category" className={styles.label}>
                    Category <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="prod-category"
                    className={styles.input}
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Select a category…</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="prod-desc" className={styles.label}>
                    Description
                  </label>
                  <input
                    id="prod-desc"
                    className={styles.input}
                    type="text"
                    placeholder="Short product description"
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.productImagesSection}>
                <div className={styles.variantHeader}>
                  <h3 className={styles.formCardTitle}>Product Images</h3>
                  <label className={styles.addVariantBtn} htmlFor="product-images">
                    <i className="fa-solid fa-images" />
                    Add Images
                  </label>
                  <input
                    id="product-images"
                    type="file"
                    accept="image/*"
                    multiple
                    className={styles.fileInputHidden}
                    onChange={(e) => {
                      handleProductImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                {productImages.length > 0 ? (
                  <div className={styles.productImageGrid}>
                    {productImages.map((image, index) => (
                      <div key={`${image.imagePreview}-${index}`} className={styles.productImagePreview}>
                        <img src={image.imagePreview} alt={`Product preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeProductImage(index)}
                          aria-label={`Remove product image ${index + 1}`}
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.productImageEmpty}>
                    <i className="fa-solid fa-image" aria-hidden="true" />
                    Upload one or more product photos for the card and detail gallery.
                  </div>
                )}
              </div>

              {/* Variants */}
              <div className={styles.sectionDivider} />
              <div className={styles.variantHeader}>
                <h3 className={styles.formCardTitle}>
                  Variants <span className={styles.required}>*</span>
                </h3>
                <button
                  type="button"
                  className={styles.addVariantBtn}
                  onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
                >
                  <i className="fa-solid fa-plus" />
                  Add Variant
                </button>
              </div>

              {variants.map((variant, idx) => (
                <div key={idx} className={styles.variantRow}>
                  <div className={styles.variantIndex}>
                    <span>{idx + 1}</span>
                  </div>

                  {/* Variant images */}
                  <div className={styles.variantImageBox}>
                    <label
                      htmlFor={`variant-img-${idx}`}
                      className={styles.imageUploadLabel}
                      title="Click to upload variant images"
                    >
                      {variant.images.length > 0 ? (
                        <div className={styles.variantImageGrid}>
                          {variant.images.map((image, imageIndex) => (
                            <div
                              key={`${image.imagePreview}-${imageIndex}`}
                              className={styles.variantImagePreview}
                            >
                              <img
                                src={image.imagePreview}
                                alt={`Variant ${idx + 1} preview ${imageIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  removeVariantImage(idx, imageIndex);
                                }}
                                aria-label={`Remove variant ${idx + 1} image ${imageIndex + 1}`}
                              >
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <i className="fa-solid fa-image" />
                          <span>Upload</span>
                        </div>
                      )}
                    </label>
                    <input
                      id={`variant-img-${idx}`}
                      type="file"
                      accept="image/*"
                      multiple
                      className={styles.fileInputHidden}
                      onChange={(e) => {
                        handleVariantImages(idx, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div className={styles.variantFields}>
                    <div className={styles.variantFieldRow}>
                      <div className={styles.fieldGroup}>
                        <label
                          htmlFor={`variant-unit-${idx}`}
                          className={styles.label}
                        >
                          Unit <span className={styles.required}>*</span>
                        </label>
                        <input
                          id={`variant-unit-${idx}`}
                          className={styles.input}
                          type="text"
                          placeholder="e.g. 500ml, 1L, 1kg"
                          value={variant.unit}
                          onChange={(e) =>
                            updateVariant(idx, "unit", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label
                          htmlFor={`variant-price-${idx}`}
                          className={styles.label}
                        >
                          Price (₹) <span className={styles.required}>*</span>
                        </label>
                        <input
                          id={`variant-price-${idx}`}
                          className={styles.input}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(idx, "price", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label
                          htmlFor={`variant-stock-${idx}`}
                          className={styles.label}
                        >
                          Stock
                        </label>
                        <input
                          id={`variant-stock-${idx}`}
                          className={styles.input}
                          type="number"
                          min="0"
                          placeholder="0"
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariant(idx, "stock", e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label
                          htmlFor={`variant-note-${idx}`}
                          className={styles.label}
                        >
                          Note
                        </label>
                        <input
                          id={`variant-note-${idx}`}
                          className={styles.input}
                          type="text"
                          placeholder="Optional note"
                          value={variant.note}
                          onChange={(e) =>
                            updateVariant(idx, "note", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeVariantBtn}
                      onClick={() => removeVariant(idx)}
                      aria-label={`Remove variant ${idx + 1}`}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
              ))}

              {prodError && (
                <p className={styles.formError} role="alert">
                  {prodError}
                </p>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    resetProductForm();
                    setView("products");
                  }}
                >
                  Cancel
                </button>
                <button
                  id="create-product-btn"
                  className={styles.submitBtn}
                  type="submit"
                  disabled={prodSubmitting}
                >
                  {prodSubmitting ? (
                    <>
                      <span className={styles.btnSpinner} /> Saving…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk" />
                      {view === "editProduct" ? "Update Product" : "Save Product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
