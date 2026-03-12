"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient, updateClient } from "@/lib/db/clients";
import type { Client, ClientStatus } from "@/lib/types";

interface ClientFormProps {
  client?: Client;
  onSuccess: (client: Client) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "paused", label: "Paused" },
];

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const isEdit = !!client;
  const [form, setForm] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    status: (client?.status as ClientStatus) ?? "active",
    project_type: client?.project_type ?? "",
    monthly_rate: client?.monthly_rate?.toString() ?? "",
    start_date: client?.start_date ?? "",
    portal_password: client?.portal_password ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        status: form.status || "active",
        project_type: form.project_type.trim() || null,
        monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
        start_date: form.start_date || null,
        portal_password: form.portal_password.trim() || null,
      };
      const result = isEdit
        ? await updateClient(client.id, payload)
        : await createClient(payload);
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cf-name">
            Name <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="cf-name"
            value={form.name}
            onChange={field("name")}
            placeholder="Acme Corp"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-email">Email</Label>
          <Input
            id="cf-email"
            type="email"
            value={form.email}
            onChange={field("email")}
            placeholder="hello@acme.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-status">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, status: v as ClientStatus }))
            }
          >
            <SelectTrigger id="cf-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-project-type">Project Type</Label>
          <Input
            id="cf-project-type"
            value={form.project_type}
            onChange={field("project_type")}
            placeholder="Retainer, One-time…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-monthly-rate">Monthly Rate ($)</Label>
          <Input
            id="cf-monthly-rate"
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_rate}
            onChange={field("monthly_rate")}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cf-start-date">Start Date</Label>
          <Input
            id="cf-start-date"
            type="date"
            value={form.start_date}
            onChange={field("start_date")}
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="cf-portal-pw">Portal Password</Label>
          <Input
            id="cf-portal-pw"
            value={form.portal_password}
            onChange={field("portal_password")}
            placeholder="Client portal access password"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500 text-white"
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Client"}
        </Button>
      </div>
    </form>
  );
}

export default ClientForm;