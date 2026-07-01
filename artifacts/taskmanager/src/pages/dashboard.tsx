import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, Clock, CheckCircle2, AlertCircle,
  Ticket, NotebookPen, ArrowRight, Plus, Users
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Summary {
  today: { incidents: number; serviceRequests: number; workNotes: number; resolutions: number };
  all: { incidents: number; serviceRequests: number; workNotes: number; resolutions: number };
  incidentsByStatus: { open: number; in_progress: number; resolved: number; closed: number };
  requestsByStatus: { open: number; in_progress: number; resolved: number; closed: number };
}

interface FeedItem {
  type: "incident" | "service_request" | "work_note" | "resolution";
  id: number;
  number: string | null;
  title: string;
  status: string | null;
  priority: string | null;
  date: string | null;
  createdAt: string;
  createdBy: number | null;
}

function QuickIncidentDialog({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/incidents", data),
    onSuccess: (res) => {
      toast({ title: "Incident created", description: res.incidentNumber });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["incidents"] });
      setOpen(false);
      setTitle(""); setCategory("");
      setLocation(`/incidents/${res.id}`);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log New Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title) return; mutation.mutate({ title, priority, category: category || undefined, status: "open" }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Short Description *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the incident…" autoFocus />
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
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Network, Hardware…" />
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

function QuickRequestDialog({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/service-requests", data),
    onSuccess: (res) => {
      toast({ title: "Request created", description: res.requestNumber });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["service-requests"] });
      setOpen(false);
      setTitle(""); setCategory("");
      setLocation(`/service-requests/${res.id}`);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log New Service Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title) return; mutation.mutate({ title, priority, category: category || undefined, status: "open" }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Request Summary *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is being requested?…" autoFocus />
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
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Access, Hardware…" />
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

function QuickWorkNoteDialog({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedNumber, setRelatedNumber] = useState("");
  const [hoursSpent, setHoursSpent] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/work-notes", data),
    onSuccess: (res) => {
      toast({ title: "Work Note logged" });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["work-notes"] });
      setOpen(false);
      setTitle(""); setContent(""); setRelatedNumber(""); setHoursSpent("");
      setLocation(`/work-notes/${res.id}`);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Work Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title || !content) return; mutation.mutate({ title, content, relatedNumber: relatedNumber || undefined, hoursSpent: hoursSpent || undefined, relatedType: relatedNumber ? "general" : "general" }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did you work on?…" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Work Note *</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe the work performed, steps taken, observations…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Related Ticket #</Label>
              <Input value={relatedNumber} onChange={(e) => setRelatedNumber(e.target.value)} placeholder="INC0001234 or RITM…" />
            </div>
            <div className="space-y-2">
              <Label>Hours Spent</Label>
              <Input value={hoursSpent} onChange={(e) => setHoursSpent(e.target.value)} placeholder="e.g. 2.5" />
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

function StatCard({ title, value, today, subtitle, icon: Icon, accent }: {
  title: string; value: number; today: number; subtitle: React.ReactNode;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <Card className={accent ? `border-${accent}-500/20` : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{today}</div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        {value !== today && (
          <div className="text-xs text-muted-foreground/50 mt-0.5">{value} total all time</div>
        )}
      </CardContent>
    </Card>
  );
}

const feedIcons = {
  incident: AlertCircle,
  service_request: Ticket,
  work_note: NotebookPen,
  resolution: CheckCircle2,
};
const feedColors = {
  incident: "bg-red-500/10 text-red-400 border-red-500/20",
  service_request: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  work_note: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  resolution: "bg-green-500/10 text-green-400 border-green-500/20",
};
const feedLabels = { incident: "Incident", service_request: "Req", work_note: "Work Note", resolution: "Resolution" };
const feedRoutes = { incident: "/incidents", service_request: "/service-requests", work_note: "/work-notes", resolution: "/resolutions" };

function FeedItem({ item }: { item: FeedItem }) {
  const [, setLocation] = useLocation();
  const Icon = feedIcons[item.type] ?? Activity;
  const color = feedColors[item.type] ?? feedColors.work_note;
  const label = feedLabels[item.type] ?? item.type;
  const route = `${feedRoutes[item.type]}/${item.id}`;

  return (
    <div className="flex items-start gap-3 group">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div
        className="flex-1 min-w-0 bg-card border rounded-lg px-3 py-2.5 hover:border-primary/40 cursor-pointer transition-colors"
        onClick={() => setLocation(route)}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
          {item.number && <span className="text-[10px] font-mono text-muted-foreground/60">{item.number}</span>}
          <span className="ml-auto text-[10px] text-muted-foreground/40 flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5" />{formatDate(item.createdAt, true)}
          </span>
        </div>
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex gap-1.5 mt-1.5">
          {item.priority && <PriorityBadge priority={item.priority} />}
          {item.status && <StatusBadge status={item.status} />}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: summary, isLoading: loadingSummary } = useQuery<Summary>({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api.get("/dashboard/summary"),
  });

  const { data: feed, isLoading: loadingFeed } = useQuery<FeedItem[]>({
    queryKey: ["dashboard", "activity"],
    queryFn: () => api.get("/dashboard/activity"),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user?.role === "manager" ? "Operations Overview" : "My Daily Work"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), "EEEE, MMMM d, yyyy")} · {user?.displayName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickIncidentDialog>
            <Button size="sm" variant="outline">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Log Incident
            </Button>
          </QuickIncidentDialog>
          <QuickRequestDialog>
            <Button size="sm" variant="outline">
              <Ticket className="w-3.5 h-3.5 mr-1.5" /> Log Request
            </Button>
          </QuickRequestDialog>
          <QuickWorkNoteDialog>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Work Note
            </Button>
          </QuickWorkNoteDialog>
        </div>
      </div>

      {/* Today's stat cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <Card key={i} className="h-28 bg-muted/20" />)}
        </div>
      ) : summary ? (
        <>
          <div className="mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today — {format(new Date(), "MMM d")}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Incidents" value={summary.all.incidents} today={summary.today.incidents}
              subtitle={<span>{summary.incidentsByStatus.open} open · {summary.incidentsByStatus.in_progress} active</span>}
              icon={AlertCircle} accent={summary.incidentsByStatus.open > 0 ? "red" : undefined} />
            <StatCard title="Service Requests" value={summary.all.serviceRequests} today={summary.today.serviceRequests}
              subtitle={<span>{summary.requestsByStatus.open} open · {summary.requestsByStatus.in_progress} active</span>}
              icon={Ticket} />
            <StatCard title="Work Notes" value={summary.all.workNotes} today={summary.today.workNotes}
              subtitle="Logged today" icon={NotebookPen} />
            <StatCard title="Resolutions" value={summary.all.resolutions} today={summary.today.resolutions}
              subtitle="Closed today" icon={CheckCircle2} />
          </div>
        </>
      ) : null}

      {/* Manager shortcut */}
      {user?.role === "manager" && (
        <Card className="border-amber-500/20 bg-amber-500/5 cursor-pointer hover:border-amber-500/40 transition-colors" onClick={() => setLocation("/team")}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Team Overview</p>
              <p className="text-xs text-muted-foreground">View each team member's work individually</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Feed + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" /> Recent Activity
            </CardTitle>
            <CardDescription>Your latest work across incidents, requests, and notes</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFeed ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-lg bg-muted/20" />)}
              </div>
            ) : feed && feed.length > 0 ? (
              <div className="space-y-3">
                {feed.map((item, i) => <FeedItem key={`${item.type}-${item.id}-${i}`} item={item} />)}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                <NotebookPen className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No activity yet today.</p>
                <p className="text-xs mt-1 opacity-60">Log your first item using the buttons above.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start h-11 text-sm" onClick={() => setLocation("/incidents")}>
              <AlertCircle className="w-4 h-4 mr-3 text-muted-foreground" />
              All Incidents <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-40" />
            </Button>
            <Button variant="outline" className="w-full justify-start h-11 text-sm" onClick={() => setLocation("/service-requests")}>
              <Ticket className="w-4 h-4 mr-3 text-muted-foreground" />
              All Requests <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-40" />
            </Button>
            <Button variant="outline" className="w-full justify-start h-11 text-sm" onClick={() => setLocation("/work-notes")}>
              <NotebookPen className="w-4 h-4 mr-3 text-muted-foreground" />
              All Work Notes <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-40" />
            </Button>
            <Button variant="outline" className="w-full justify-start h-11 text-sm" onClick={() => setLocation("/resolutions")}>
              <CheckCircle2 className="w-4 h-4 mr-3 text-muted-foreground" />
              All Resolutions <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-40" />
            </Button>

            <div className="pt-3 space-y-2 border-t mt-2">
              <QuickIncidentDialog>
                <Button className="w-full justify-start h-10 text-sm">
                  <Plus className="w-3.5 h-3.5 mr-2" /> New Incident
                </Button>
              </QuickIncidentDialog>
              <QuickWorkNoteDialog>
                <Button variant="secondary" className="w-full justify-start h-10 text-sm">
                  <Plus className="w-3.5 h-3.5 mr-2" /> New Work Note
                </Button>
              </QuickWorkNoteDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
