import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Ticket, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function CreateRequestDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [assignedGroup, setAssignedGroup] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/service-requests", data),
    onSuccess: (res) => {
      toast({ title: "Request created", description: res.requestNumber });
      qc.invalidateQueries({ queryKey: ["service-requests"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setTitle(""); setDescription(""); setRequester(""); setCategory(""); setSubCategory(""); setAssignedGroup("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Service Request</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title) return; mutation.mutate({ title, description: description || undefined, requester: requester || undefined, priority, status: "open", category: category || undefined, subCategory: subCategory || undefined, assignedGroup: assignedGroup || undefined, requestDate: date }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Request Summary *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is being requested?" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details, justification, business need…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Requester</Label>
              <Input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Requestor's name" />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Access, Hardware…" />
            </div>
            <div className="space-y-2">
              <Label>Sub-Category</Label>
              <Input value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="e.g. VPN Access" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Assignment Group</Label>
              <Input value={assignedGroup} onChange={(e) => setAssignedGroup(e.target.value)} placeholder="Team or group name" />
            </div>
            <div className="space-y-2">
              <Label>Request Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending || !title}>
              {mutation.isPending ? "Creating…" : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ServiceRequestsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: requests, isLoading } = useQuery<any[]>({
    queryKey: ["service-requests"],
    queryFn: () => api.get("/service-requests"),
  });

  const filtered = (requests ?? []).filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.requestNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-400" /> Service Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{requests?.length ?? 0} total requests</p>
        </div>
        <CreateRequestDialog>
          <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> New Request</Button>
        </CreateRequestDialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or RITM number…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-20 rounded-lg bg-muted/20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No service requests found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 hover:border-primary/40 cursor-pointer transition-colors" onClick={() => setLocation(`/service-requests/${r.id}`)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {r.requestNumber && <span className="font-mono text-xs text-muted-foreground shrink-0">{r.requestNumber}</span>}
                  <span className="font-medium text-sm truncate">{r.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {r.category && <span>{r.category}{r.subCategory ? ` / ${r.subCategory}` : ""}</span>}
                  {r.requester && <span>By {r.requester}</span>}
                  {r.requestDate && <span>{r.requestDate}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <PriorityBadge priority={r.priority} />
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
