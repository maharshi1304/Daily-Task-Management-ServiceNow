import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft, Edit2, Trash2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function IncidentDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/incidents/:id");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: incident, isLoading } = useQuery<any>({
    queryKey: ["incidents", params?.id],
    queryFn: () => api.get(`/incidents/${params?.id}`),
    enabled: !!params?.id,
  });

  const [form, setForm] = useState<any>({});

  const startEdit = () => {
    setForm({ ...incident });
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch<any>(`/incidents/${params?.id}`, data),
    onSuccess: () => {
      toast({ title: "Incident updated" });
      qc.invalidateQueries({ queryKey: ["incidents", params?.id] });
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/incidents/${params?.id}`),
    onSuccess: () => {
      toast({ title: "Incident deleted" });
      qc.invalidateQueries({ queryKey: ["incidents"] });
      setLocation("/incidents");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-10 w-48 bg-muted/20 rounded"/><div className="h-64 bg-muted/20 rounded-lg"/></div>;
  if (!incident) return <div className="text-center py-20 text-muted-foreground">Incident not found.</div>;

  const field = (key: string) => editing ? form[key] ?? "" : incident[key];
  const setField = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/incidents")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Incidents
        </Button>
        <div className="flex-1" />
        {!editing ? (
          <>
            <Button variant="outline" size="sm" onClick={startEdit}><Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="text-red-400 hover:text-red-400 hover:border-red-400/40"
              onClick={() => { if (confirm("Delete this incident?")) deleteMutation.mutate(); }}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> {updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
          </>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          {incident.incidentNumber && (
            <Badge variant="outline" className="font-mono text-xs">{incident.incidentNumber}</Badge>
          )}
          <PriorityBadge priority={incident.priority} />
          <StatusBadge status={incident.status} />
        </div>
        {editing ? (
          <Input className="text-2xl font-bold h-auto py-1 text-xl" value={form.title ?? ""} onChange={(e) => setField("title", e.target.value)} />
        ) : (
          <h1 className="text-2xl font-bold">{incident.title}</h1>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Created {format(new Date(incident.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Incident Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              {editing ? (
                <Select value={form.priority ?? incident.priority} onValueChange={(v) => setField("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : <div className="text-sm capitalize">{incident.priority}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              {editing ? (
                <Select value={form.status ?? incident.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              ) : <div className="text-sm capitalize">{incident.status.replace("_", " ")}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              {editing ? <Input value={form.category ?? ""} onChange={(e) => setField("category", e.target.value)} placeholder="e.g. Network" /> : <div className="text-sm">{incident.category || "—"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Configuration Item</Label>
              {editing ? <Input value={form.configurationItem ?? ""} onChange={(e) => setField("configurationItem", e.target.value)} placeholder="CI name" /> : <div className="text-sm">{incident.configurationItem || "—"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assigned To</Label>
              {editing ? <Input value={form.assignedTo ?? ""} onChange={(e) => setField("assignedTo", e.target.value)} /> : <div className="text-sm">{incident.assignedTo || "—"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Incident Date</Label>
              {editing ? <Input type="date" value={form.incidentDate ?? ""} onChange={(e) => setField("incidentDate", e.target.value)} /> : <div className="text-sm">{incident.incidentDate || "—"}</div>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Textarea value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} rows={4} placeholder="Detailed description, symptoms, impact…" />
            ) : (
              <div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-3">{incident.description || <span className="text-muted-foreground italic">No description.</span>}</div>
            )}
          </div>

          {(incident.tags || editing) && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tags</Label>
              {editing ? <Input value={form.tags ?? ""} onChange={(e) => setField("tags", e.target.value)} placeholder="comma, separated, tags" /> : <div className="text-sm">{incident.tags || "—"}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
