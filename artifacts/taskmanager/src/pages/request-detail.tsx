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

export default function RequestDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/service-requests/:id");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const { data: request, isLoading } = useQuery<any>({
    queryKey: ["service-requests", params?.id],
    queryFn: () => api.get(`/service-requests/${params?.id}`),
    enabled: !!params?.id,
  });

  const startEdit = () => { setForm({ ...request }); setEditing(true); };
  const setField = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch<any>(`/service-requests/${params?.id}`, data),
    onSuccess: () => {
      toast({ title: "Request updated" });
      qc.invalidateQueries({ queryKey: ["service-requests", params?.id] });
      qc.invalidateQueries({ queryKey: ["service-requests"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/service-requests/${params?.id}`),
    onSuccess: () => { toast({ title: "Request deleted" }); qc.invalidateQueries({ queryKey: ["service-requests"] }); setLocation("/service-requests"); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
  if (!request) return <div className="text-center py-20 text-muted-foreground">Request not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/service-requests")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Requests
        </Button>
        <div className="flex-1" />
        {!editing ? (
          <>
            <Button variant="outline" size="sm" onClick={startEdit}><Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="text-red-400 hover:border-red-400/40" onClick={() => { if (confirm("Delete this request?")) deleteMutation.mutate(); }}>
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
          {request.requestNumber && <Badge variant="outline" className="font-mono text-xs">{request.requestNumber}</Badge>}
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />
        </div>
        {editing ? (
          <Input className="text-xl font-bold" value={form.title ?? ""} onChange={(e) => setField("title", e.target.value)} />
        ) : (
          <h1 className="text-2xl font-bold">{request.title}</h1>
        )}
        <p className="text-xs text-muted-foreground mt-1">Created {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Request Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "status", label: "Status", options: ["open","in_progress","pending","resolved","closed"] },
              { key: "priority", label: "Priority", options: ["low","medium","high","critical"] },
            ].map(({ key, label, options }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? (
                  <Select value={form[key] ?? request[key]} onValueChange={(v) => setField(key, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o.replace("_"," ")}</SelectItem>)}</SelectContent>
                  </Select>
                ) : <div className="text-sm capitalize">{request[key]?.replace("_"," ")}</div>}
              </div>
            ))}
            {[
              { key: "requester", label: "Requester" },
              { key: "assignedGroup", label: "Assignment Group" },
              { key: "category", label: "Category" },
              { key: "subCategory", label: "Sub-Category" },
              { key: "requestDate", label: "Request Date", type: "date" },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                {editing ? <Input type={type} value={form[key] ?? ""} onChange={(e) => setField(key, e.target.value)} /> : <div className="text-sm">{request[key] || "—"}</div>}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {editing ? (
              <Textarea value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} rows={4} />
            ) : (
              <div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-3">{request.description || <span className="italic text-muted-foreground">No description.</span>}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
