import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const RESOLUTION_CODES = [
  "Solved (Permanently)",
  "Solved (Work Around)",
  "Not Solved (Not Reproducible)",
  "Not Solved (Too Costly)",
  "Closed/Resolved by Caller",
  "Solved (Permanently) - Vendor Fix",
];

function CreateResolutionDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [resolutionCode, setResolutionCode] = useState("Solved (Permanently)");
  const [relatedNumber, setRelatedNumber] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/resolutions", data),
    onSuccess: () => {
      toast({ title: "Resolution logged" });
      qc.invalidateQueries({ queryKey: ["resolutions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setTitle(""); setDescription(""); setRootCause(""); setActionsTaken(""); setRelatedNumber("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log Resolution Note</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title || !description) return; mutation.mutate({ title, description, rootCause: rootCause || undefined, actionsTaken: actionsTaken || undefined, resolutionCode, relatedNumber: relatedNumber || undefined, resolutionDate: date }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Resolution Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of the resolution…" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Resolution Code</Label>
              <Select value={resolutionCode} onValueChange={setResolutionCode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESOLUTION_CODES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related Ticket #</Label>
              <Input value={relatedNumber} onChange={(e) => setRelatedNumber(e.target.value)} placeholder="INC0001234 or RITM…" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Resolution Notes *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe how the issue was resolved…" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Root Cause</Label>
            <Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="What caused the issue?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Actions Taken</Label>
            <Textarea value={actionsTaken} onChange={(e) => setActionsTaken(e.target.value)} placeholder="Steps taken to resolve…" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Resolution Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending || !title || !description}>
              {mutation.isPending ? "Saving…" : "Log Resolution"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ResolutionsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: resolutions, isLoading } = useQuery<any[]>({
    queryKey: ["resolutions"],
    queryFn: () => api.get("/resolutions"),
  });

  const filtered = (resolutions ?? []).filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" /> Resolution Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{resolutions?.length ?? 0} resolutions logged</p>
        </div>
        <CreateResolutionDialog>
          <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> Log Resolution</Button>
        </CreateResolutionDialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resolutions…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 rounded-lg bg-muted/20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No resolutions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card border rounded-lg px-4 py-3 hover:border-primary/40 cursor-pointer transition-colors" onClick={() => setLocation(`/resolutions/${r.id}`)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.title}</span>
                    {r.relatedNumber && <Badge variant="outline" className="font-mono text-[10px] py-0">{r.relatedNumber}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{r.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {r.resolutionDate && <span>{r.resolutionDate}</span>}
                  </div>
                </div>
                {r.resolutionCode && (
                  <Badge variant="secondary" className="text-[10px] shrink-0 max-w-[140px] text-center leading-tight">{r.resolutionCode}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
