import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { NotebookPen, Plus, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

function CreateWorkNoteDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedType, setRelatedType] = useState("general");
  const [relatedNumber, setRelatedNumber] = useState("");
  const [hoursSpent, setHoursSpent] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/work-notes", data),
    onSuccess: () => {
      toast({ title: "Work note logged" });
      qc.invalidateQueries({ queryKey: ["work-notes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setTitle(""); setContent(""); setRelatedNumber(""); setHoursSpent("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Work Note</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title || !content) return; mutation.mutate({ title, content, relatedType, relatedNumber: relatedNumber || undefined, hoursSpent: hoursSpent || undefined, noteDate: date }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did you work on?" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Work Note * <span className="text-muted-foreground font-normal">(describe the work performed)</span></Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Steps taken, findings, next actions, observations…" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Related To</Label>
              <Select value={relatedType} onValueChange={setRelatedType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="service_request">Service Request</SelectItem>
                  <SelectItem value="general">General / Standalone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ticket Number</Label>
              <Input value={relatedNumber} onChange={(e) => setRelatedNumber(e.target.value)} placeholder="INC0001234 or RITM…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Hours Spent</Label>
              <Input value={hoursSpent} onChange={(e) => setHoursSpent(e.target.value)} placeholder="e.g. 1.5" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending || !title || !content}>
              {mutation.isPending ? "Saving…" : "Save Work Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkNotesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: notes, isLoading } = useQuery<any[]>({
    queryKey: ["work-notes"],
    queryFn: () => api.get("/work-notes"),
  });

  const filtered = (notes ?? []).filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <NotebookPen className="w-6 h-6 text-slate-400" /> Work Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{notes?.length ?? 0} total notes</p>
        </div>
        <CreateWorkNoteDialog>
          <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Work Note</Button>
        </CreateWorkNoteDialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted/20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
          <NotebookPen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No work notes yet</p>
          <p className="text-sm mt-1">Log what you worked on today.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => (
            <div key={note.id} className="bg-card border rounded-lg px-4 py-3 hover:border-primary/40 cursor-pointer transition-colors" onClick={() => setLocation(`/work-notes/${note.id}`)}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{note.title}</span>
                    {note.relatedNumber && (
                      <Badge variant="outline" className="font-mono text-[10px] py-0">{note.relatedNumber}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{note.noteDate}</span>
                    {note.hoursSpent && <span>{note.hoursSpent}h</span>}
                    {note.relatedType && note.relatedType !== "general" && (
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {note.relatedType === "incident" ? "INC" : "RITM"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
