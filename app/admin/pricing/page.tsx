"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Check,
  X,
  Search,
  ExternalLink,
} from "lucide-react";

interface PricingFeature {
  id: string;
  planId: string;
  text: string;
  included: boolean;
  order: number;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingPeriod: string;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
  order: number;
  buttonText: string;
  buttonLink: string | null;
  features: PricingFeature[];
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [planSearchQuery, setPlanSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billingPeriod: "monthly",
    currency: "USD",
    isPopular: false,
    isActive: true,
    order: 0,
    buttonText: "Get Started",
    buttonLink: "",
  });

  const [featureDrafts, setFeatureDrafts] = useState<
    Record<string, { text: string; included: boolean }>
  >({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/admin/pricing");
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch {
      toast.error("Failed to load pricing plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPlan ? "/api/admin/pricing" : "/api/admin/pricing";
      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingPlan ? { id: editingPlan.id, ...formData } : formData,
        ),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingPlan
            ? "Plan updated successfully"
            : "Plan created successfully",
        );
        setEditingPlan(null);
        setIsCreating(false);
        resetForm();
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to save pricing plan");
      }
    } catch (error) {
      console.error("Error saving pricing plan:", error);
      toast.error("Failed to save pricing plan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing plan?")) return;

    try {
      const response = await fetch(`/api/admin/pricing?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Plan deleted successfully");
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to delete pricing plan");
      }
    } catch (error) {
      console.error("Error deleting pricing plan:", error);
      toast.error("Failed to delete pricing plan");
    }
  };

  const handleAddFeature = async (planId: string) => {
    const draft = featureDrafts[planId] || { text: "", included: true };
    if (!draft.text.trim()) {
      toast.error("Feature text is required");
      return;
    }

    const plan = plans.find((p) => p.id === planId);

    try {
      const response = await fetch("/api/admin/pricing/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          text: draft.text,
          included: draft.included,
          order: plan?.features.length ?? 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Feature added successfully");
        setFeatureDrafts((prev) => ({
          ...prev,
          [planId]: { text: "", included: true },
        }));
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to add feature");
      }
    } catch (error) {
      console.error("Error adding feature:", error);
      toast.error("Failed to add feature");
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    try {
      const response = await fetch(
        `/api/admin/pricing/features?id=${featureId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Feature deleted successfully");
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to delete feature");
      }
    } catch (error) {
      console.error("Error deleting feature:", error);
      toast.error("Failed to delete feature");
    }
  };

  const handleUpdatePlan = async (
    id: string,
    updates: Partial<PricingPlan>,
  ) => {
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPlans();
      } else {
        toast.error(data.error || "Failed to update plan");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      billingPeriod: "monthly",
      currency: "USD",
      isPopular: false,
      isActive: true,
      order: 0,
      buttonText: "Get Started",
      buttonLink: "",
    });
  };

  const startEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price.toString(),
      billingPeriod: plan.billingPeriod,
      currency: plan.currency,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      order: plan.order,
      buttonText: plan.buttonText,
      buttonLink: plan.buttonLink || "",
    });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
    resetForm();
  };

  const setFeatureDraft = (
    planId: string,
    update: Partial<{ text: string; included: boolean }>,
  ) => {
    setFeatureDrafts((prev) => ({
      ...prev,
      [planId]: {
        text: prev[planId]?.text ?? "",
        included: prev[planId]?.included ?? true,
        ...update,
      },
    }));
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      !planSearchQuery.trim() ||
      plan.name.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
      (plan.description || "")
        .toLowerCase()
        .includes(planSearchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (planFilter === "active") return plan.isActive;
    if (planFilter === "inactive") return !plan.isActive;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AdminPage className="p-6">
      <AdminPageHeader
        eyebrow="Revenue design"
        title="Pricing Management"
        description="Edit plan structure, feature flags, calls to action, and merchandising across the pricing surface."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/pricing" target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Public Pricing
              </Button>
            </Link>
            <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Plans</p>
            <p className="mt-1 text-3xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Plans</p>
            <p className="mt-1 text-3xl font-bold">
              {plans.filter((plan) => plan.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Popular Plans</p>
            <p className="mt-1 text-3xl font-bold">
              {plans.filter((plan) => plan.isPopular).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Features</p>
            <p className="mt-1 text-3xl font-bold">
              {plans.reduce((sum, plan) => sum + plan.features.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPlan ? "Edit Pricing Plan" : "Create New Pricing Plan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="billingPeriod">Billing Period *</Label>
                  <Select
                    value={formData.billingPeriod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, billingPeriod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonText: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="buttonLink">Button Link</Label>
                  <Input
                    id="buttonLink"
                    value={formData.buttonLink}
                    onChange={(e) =>
                      setFormData({ ...formData, buttonLink: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPopular: checked })
                    }
                  />
                  <Label htmlFor="isPopular">Mark as Popular</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search plans by name or description..."
                value={planSearchQuery}
                onChange={(e) => setPlanSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={planFilter}
              onValueChange={(value) =>
                setPlanFilter(value as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.isPopular ? "border-primary" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.isActive && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                    {plan.isPopular && (
                      <span className="text-xs font-normal text-primary">
                        (Popular)
                      </span>
                    )}
                  </CardTitle>
                  {plan.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <DollarSign className="h-5 w-5" />
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">
                  {plan.currency} / {plan.billingPeriod}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={(checked) =>
                      handleUpdatePlan(plan.id, { isActive: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Popular</span>
                  <Switch
                    checked={plan.isPopular}
                    onCheckedChange={(checked) =>
                      handleUpdatePlan(plan.id, { isPopular: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Features</Label>
                </div>
                <div className="space-y-1">
                  {plan.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span>{feature.text}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteFeature(feature.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="New feature..."
                    value={featureDrafts[plan.id]?.text || ""}
                    onChange={(e) =>
                      setFeatureDraft(plan.id, { text: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      featureDrafts[plan.id]?.included === false
                        ? "outline"
                        : "default"
                    }
                    onClick={() =>
                      setFeatureDraft(plan.id, {
                        included: !(featureDrafts[plan.id]?.included ?? true),
                      })
                    }
                  >
                    {(featureDrafts[plan.id]?.included ?? true) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" onClick={() => handleAddFeature(plan.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length > 0 && filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No plans match your current filters.
          </CardContent>
        </Card>
      ) : null}
    </AdminPage>
  );
}
