import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertCircle, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Incident {
  id: number;
  incidentNumber: string | null;
  title: string;
  description: string | null;
  shortDescription: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  category: string | null;
  configurationItem: string | null;
  tags: string | null;
  incidentDate: string | null;
  createdAt: string;
}

function CreateIncidentDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("open");
  const [category, setCategory] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [ci, setCi] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/incidents", data),
    onSuccess: (res) => {
      toast({ title: "Incident created", description: res.incidentNumber ?? "Created" });
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setTitle(""); setDescription(""); setCategory(""); setAssignedTo(""); setCi("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Incident</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title) return; mutation.mutate({ title, description: description || undefined, priority, status, category: category || undefined, assignedTo: assignedTo || undefined, configurationItem: ci || undefined, incidentDate: date }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Short Description *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the incident…" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description, symptoms, impact…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Network, Hardware…" />
            </div>
            <div className="space-y-2">
              <Label>Configuration Item</Label>
              <Input value={ci} onChange={(e) => setCi(e.target.value)} placeholder="Server, App name…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Incident Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending || !title}>
              {mutation.isPending ? "Creating…" : "Create Incident"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IncidentsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: incidents, isLoading } = useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: () => api.get("/incidents"),
  });

  const filtered = (incidents ?? []).filter((inc) => {
    const matchSearch = !search || inc.title.toLowerCase().includes(search.toLowerCase()) || inc.incidentNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inc.status === statusFilter;
    const matchPriority = priorityFilter === "all" || inc.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" /> Incidents
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{incidents?.length ?? 0} total incidents</p>
        </div>
        <CreateIncidentDialog>
          <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> New Incident</Button>
        </CreateIncidentDialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or INC number…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-lg bg-muted/20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No incidents found</p>
          <p className="text-sm mt-1">Try adjusting your filters or create a new incident.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 hover:border-primary/40 cursor-pointer transition-colors"
              onClick={() => setLocation(`/incidents/${inc.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {inc.incidentNumber && (
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{inc.incidentNumber}</span>
                  )}
                  <span className="font-medium text-sm truncate">{inc.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {inc.category && <span>{inc.category}</span>}
                  {inc.incidentDate && <span>{inc.incidentDate}</span>}
                  {inc.assignedTo && <span>→ {inc.assignedTo}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <PriorityBadge priority={inc.priority} />
                <StatusBadge status={inc.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
