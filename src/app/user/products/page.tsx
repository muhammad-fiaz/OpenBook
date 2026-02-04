"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from "@/actions/products";
import { exportProductsToCSV } from "@/actions/export";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons";
import { formatCurrency } from "@/lib/financial";
import { currencies } from "@/lib/currencies";
import { toast } from "sonner";
import {
  Plus,
  Download,
  Pencil,
  Trash2,
  Package,
  Search,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const input = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      sku: (formData.get("sku") as string) || undefined,
      unitPrice: Number.parseFloat(formData.get("unitPrice") as string),
      currency: formData.get("currency") as string,
      taxRate: Number.parseFloat((formData.get("taxRate") as string) || "0"),
      unit: (formData.get("unit") as string) || undefined,
      type: formData.get("type") as string,
      image: (formData.get("image") as string) || undefined,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, input);
        toast.success("Product updated");
      } else {
        await createProduct(input);
        toast.success("Product created");
      }
      setDialogOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
      fetchProducts();
    } catch {
      toast.error("Failed to save product");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  }

  async function handleToggleActive(id: string) {
    try {
      await toggleProductActive(id);
      fetchProducts();
    } catch {
      toast.error("Failed to toggle product status");
    }
  }

  async function handleExport() {
    try {
      const csv = await exportProductsToCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Products exported");
    } catch {
      toast.error("Failed to export");
    }
  }

  function openEdit(product: any) {
    setEditingProduct(product);
    setImagePreview(product.image || null);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditingProduct(null);
    setImagePreview(null);
    setDialogOpen(true);
  }

  if (loading) return (
    <div className="min-h-screen space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Items</h1>
          <p className="text-muted-foreground">Manage your products and services</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={`ps-${i}`} />
        ))}
      </div>
      <TableSkeleton rows={8} />
    </div>
  );

  return (
    <motion.div className="space-y-6" {...fadeIn} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Items</h1>
          <p className="text-muted-foreground">Manage your products and services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "New Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <div className="flex gap-4 items-start">
                     <div className="flex-1 space-y-2">
                        <Input
                          id="image"
                          name="image"
                          placeholder="https://example.com/image.png"
                          defaultValue={editingProduct?.image ?? ""}
                          onChange={(e) => setImagePreview(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Optional. Provide a URL to an image.</p>
                     </div>
                     {imagePreview && (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="h-full w-full object-cover" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                     )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      defaultValue={editingProduct?.name ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      name="sku"
                      defaultValue={editingProduct?.sku ?? ""}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={2}
                    defaultValue={editingProduct?.description ?? ""}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price *</Label>
                    <Input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={editingProduct?.unitPrice ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" defaultValue={editingProduct?.currency ?? "INR"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct?.taxRate ?? "0"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue={editingProduct?.type ?? "SERVICE"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SERVICE">Service</SelectItem>
                        <SelectItem value="PRODUCT">Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      name="unit"
                      placeholder="hrs, pcs, etc."
                      defaultValue={editingProduct?.unit ?? ""}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-35">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="SERVICE">Service</SelectItem>
            <SelectItem value="PRODUCT">Product</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.filter((p) => p.type === "SERVICE").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.filter((p) => p.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products & Services ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-muted-foreground">Create your first product or service to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Tax %</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((product) => (
                      <motion.tr
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            ) : (
                               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                                  <Package className="h-5 w-5 opacity-50" />
                               </div>
                            )}
                            <div>
                              <div>{product.name}</div>
                              {product.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-50">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{product.sku || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={product.type === "SERVICE" ? "secondary" : "outline"}>
                            {product.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(Number(product.unitPrice), product.currency)}
                        </TableCell>
                        <TableCell className="text-right">{product.taxRate}%</TableCell>
                        <TableCell>{product.unit || "—"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={() => handleToggleActive(product.id)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
