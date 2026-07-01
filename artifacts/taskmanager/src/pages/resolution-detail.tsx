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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const RESOLUTION_CODES = [
  "Solved (Permanently)",
  "Solved (Work Around)",
  "Not Solved (Not Reproducible)",
  "Not Solved (Too Costly)",
  "Closed/Resolved by Caller",
  "Solved (Permanently) - Vendor Fix",
];

export default function ResolutionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/resolutions/:id");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const { data: resolution, isLoading } = useQuery<any>({
    queryKey: ["resolutions", params?.id],
    queryFn: () => api.get(`/resolutions/${params?.id}`),
    enabled: !!params?.id,
  });

  const startEdit = () => { setForm({ ...resolution }); setEditing(true); };
  const setField = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch<any>(`/resolutions/${params?.id}`, data),
    onSuccess: () => {
      toast({ title: "Resolution updated" });
      qc.invalidateQueries({ queryKey: ["resolutions", params?.id] });
      qc.invalidateQueries({ queryKey: ["resolutions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/resolutions/${params?.id}`),
    onSuccess: () => { toast({ title: "Resolution deleted" }); qc.invalidateQueries({ queryKey: ["resolutions"] }); setLocation("/resolutions"); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
  if (!resolution) return <div className="text-center py-20 text-muted-foreground">Resolution not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/resolutions")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Resolutions
        </Button>
        <div className="flex-1" />
        {!editing ? (
          <>
            <Button variant="outline" size="sm" onClick={startEdit}><Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="text-red-400 hover:border-red-400/40" onClick={() => { if (confirm("Delete this resolution?")) deleteMutation.mutate(); }}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              <Save className="w-3.5 h-3.5 mr-1.5" />{updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
          </>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          {resolution.relatedNumber && <Badge variant="outline" className="font-mono text-xs">{resolution.relatedNumber}</Badge>}
          {resolution.resolutionCode && <Badge variant="secondary" className="text-xs">{resolution.resolutionCode}</Badge>}
        </div>
        {editing ? (
          <Input className="text-xl font-bold" value={form.title ?? ""} onChange={(e) => setField("title", e.target.value)} />
        ) : (
          <h1 className="text-2xl font-bold">{resolution.title}</h1>
        )}
        <p className="text-xs text-muted-foreground mt-1">Created {format(new Date(resolution.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resolution Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resolution Code</Label>
              {editing ? (
                <Select value={form.resolutionCode ?? ""} onValueChange={(v) => setField("resolutionCode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RESOLUTION_CODES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              ) : <div className="text-sm">{resolution.resolutionCode || "—"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Related Ticket</Label>
              {editing ? <Input value={form.relatedNumber ?? ""} onChange={(e) => setField("relatedNumber", e.target.value)} placeholder="INC… or RITM…" /> : <div className="text-sm font-mono">{resolution.relatedNumber || "—"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resolution Date</Label>
              {editing ? <Input type="date" value={form.resolutionDate ?? ""} onChange={(e) => setField("resolutionDate", e.target.value)} /> : <div className="text-sm">{resolution.resolutionDate || "—"}</div>}
            </div>
          </div>

          {[
            { key: "description", label: "Resolution Notes" },
            { key: "rootCause", label: "Root Cause" },
            { key: "actionsTaken", label: "Actions Taken" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              {editing ? (
                <Textarea value={form[key] ?? ""} onChange={(e) => setField(key, e.target.value)} rows={3} />
              ) : (
                <div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-3">
                  {resolution[key] || <span className="italic text-muted-foreground">Not provided.</span>}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
