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

export default function WorkNoteDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/work-notes/:id");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const { data: note, isLoading } = useQuery<any>({
    queryKey: ["work-notes", params?.id],
    queryFn: () => api.get(`/work-notes/${params?.id}`),
    enabled: !!params?.id,
  });

  const startEdit = () => { setForm({ ...note }); setEditing(true); };
  const setField = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch<any>(`/work-notes/${params?.id}`, data),
    onSuccess: () => {
      toast({ title: "Work note updated" });
      qc.invalidateQueries({ queryKey: ["work-notes", params?.id] });
      qc.invalidateQueries({ queryKey: ["work-notes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/work-notes/${params?.id}`),
    onSuccess: () => { toast({ title: "Note deleted" }); qc.invalidateQueries({ queryKey: ["work-notes"] }); setLocation("/work-notes"); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted/20 rounded-lg" />;
  if (!note) return <div className="text-center py-20 text-muted-foreground">Note not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/work-notes")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Work Notes
        </Button>
        <div className="flex-1" />
        {!editing ? (
          <>
            <Button variant="outline" size="sm" onClick={startEdit}><Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="text-red-400 hover:border-red-400/40" onClick={() => { if (confirm("Delete this note?")) deleteMutation.mutate(); }}>
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
          {note.relatedNumber && <Badge variant="outline" className="font-mono text-xs">{note.relatedNumber}</Badge>}
          {note.relatedType && note.relatedType !== "general" && (
            <Badge variant="secondary" className="text-xs">{note.relatedType === "incident" ? "Incident" : "Service Request"}</Badge>
          )}
        </div>
        {editing ? (
          <Input className="text-xl font-bold" value={form.title ?? ""} onChange={(e) => setField("title", e.target.value)} />
        ) : (
          <h1 className="text-2xl font-bold">{note.title}</h1>
        )}
        <p className="text-xs text-muted-foreground mt-1">Created {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Note Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Related To</Label>
              {editing ? (
                <Select value={form.relatedType ?? "general"} onValueChange={(v) => setField("relatedType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="service_request">Service Request</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              ) : <div className="text-sm capitalize">{note.relatedType?.replace("_", " ") || "General"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ticket Number</Label>
              {editing ? <Input value={form.relatedNumber ?? ""} onChange={(e) => setField("relatedNumber", e.target.value)} placeholder="INC… or RITM…" /> : <div className="text-sm font-mono">{note.relatedNumber || "—"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hours Spent</Label>
              {editing ? <Input value={form.hoursSpent ?? ""} onChange={(e) => setField("hoursSpent", e.target.value)} placeholder="e.g. 2.5" /> : <div className="text-sm">{note.hoursSpent ? `${note.hoursSpent}h` : "—"}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              {editing ? <Input type="date" value={form.noteDate ?? ""} onChange={(e) => setField("noteDate", e.target.value)} /> : <div className="text-sm">{note.noteDate || "—"}</div>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Work Note</Label>
            {editing ? (
              <Textarea value={form.content ?? ""} onChange={(e) => setField("content", e.target.value)} rows={6} />
            ) : (
              <div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-4 leading-relaxed">{note.content}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
