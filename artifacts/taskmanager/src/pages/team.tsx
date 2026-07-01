import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth";
import { format } from "date-fns";
import {
  Users, AlertCircle, Ticket, NotebookPen, CheckCircle2,
  Plus, Trash2, Eye, ChevronRight, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TeamMember {
  user: { id: number; displayName: string; username: string; role: string };
  today: { incidents: number; serviceRequests: number; workNotes: number; resolutions: number };
  total: { incidents: number; serviceRequests: number; workNotes: number; resolutions: number };
  openIncidents: number;
  openRequests: number;
}

interface UserAccount {
  id: number;
  displayName: string;
  username: string;
  email: string | null;
  role: string;
  createdAt: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function CreateUserDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const mutation = useMutation({
    mutationFn: (data: any) => api.post<any>("/users", data),
    onSuccess: () => {
      toast({ title: "Account created", description: `${displayName} can now log in.` });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["team"] });
      setOpen(false);
      setDisplayName(""); setUsername(""); setEmail(""); setPassword(""); setRole("user");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username || !password) return;
    mutation.mutate({ displayName, username, email: email || undefined, password, role });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Team Member Account</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Smith" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jane.smith" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Team Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending || !displayName || !username || !password}>
              {mutation.isPending ? "Creating…" : "Create Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, children }: { user: UserAccount; children: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: (data: any) => api.patch<any>(`/users/${user.id}/password`, data),
    onSuccess: () => {
      toast({ title: "Password updated", description: `${user.displayName}'s password has been reset.` });
      setOpen(false);
      setPassword("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reset Password — {user.displayName}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (password.length < 6) return; mutation.mutate({ password }); }} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>New Password (min 6 characters)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password…" autoFocus />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending || password.length < 6}>
              {mutation.isPending ? "Saving…" : "Reset Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  const todayTotal = member.today.incidents + member.today.serviceRequests + member.today.workNotes + member.today.resolutions;
  return (
    <Card className="hover:border-primary/40 cursor-pointer transition-colors" onClick={onClick}>
      <CardContent className="pt-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-semibold text-sm text-primary shrink-0">
            {getInitials(member.user.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{member.user.displayName}</p>
              {member.user.role === "manager" && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/30 text-amber-400">mgr</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{member.user.username}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "INC today", value: member.today.incidents, icon: AlertCircle, color: "text-red-400" },
            { label: "RITM today", value: member.today.serviceRequests, icon: Ticket, color: "text-blue-400" },
            { label: "Notes today", value: member.today.workNotes, icon: NotebookPen, color: "text-slate-400" },
            { label: "Resolved", value: member.today.resolutions, icon: CheckCircle2, color: "text-green-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-2 bg-muted/20 rounded-md px-2.5 py-2">
              <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
              <div>
                <p className="text-xs font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {(member.openIncidents > 0 || member.openRequests > 0) && (
          <div className="mt-3 pt-3 border-t flex gap-3 text-[11px] text-muted-foreground">
            {member.openIncidents > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertCircle className="w-3 h-3" /> {member.openIncidents} open INC
              </span>
            )}
            {member.openRequests > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <Ticket className="w-3 h-3" /> {member.openRequests} open RITM
              </span>
            )}
          </div>
        )}

        <div className="mt-2 text-[10px] text-muted-foreground/50">
          Total: {member.total.incidents} INC · {member.total.serviceRequests} RITM · {member.total.workNotes} notes
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: team, isLoading: loadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: () => api.get("/dashboard/team"),
  });

  const { data: accounts, isLoading: loadingAccounts } = useQuery<UserAccount[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/users"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast({ title: "Account deleted" });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (user?.role !== "manager") {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Manager access required.</p>
      </div>
    );
  }

  const handleViewMember = (userId: number) => {
    setLocation(`/?userId=${userId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Today — {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <CreateUserDialog>
          <Button size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Team Member
          </Button>
        </CreateUserDialog>
      </div>

      <Tabs defaultValue="work">
        <TabsList>
          <TabsTrigger value="work">Today's Work</TabsTrigger>
          <TabsTrigger value="accounts">Manage Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="work" className="pt-4">
          {loadingTeam ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
              {[1,2,3].map(i => <Card key={i} className="h-52 bg-muted/20" />)}
            </div>
          ) : team && team.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {team.map((member) => (
                <MemberCard
                  key={member.user.id}
                  member={member}
                  onClick={() => {
                    // Navigate to member's individual dashboard view
                    setLocation(`/team`);
                    // For detailed per-user view we show inline expanded — kept simple for now
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No team members yet</p>
              <p className="text-sm mt-1">Create accounts for your team using the button above.</p>
            </div>
          )}

          {/* Per-member breakdown */}
          {team && team.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Individual Work Logs</h2>
              {team.map((member) => (
                <MemberWorkLog key={member.user.id} member={member} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accounts" className="pt-4">
          {loadingAccounts ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/20" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {accounts?.map((account) => (
                <div key={account.id} className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-semibold text-sm text-primary shrink-0">
                    {getInitials(account.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{account.displayName}</p>
                      <Badge variant={account.role === "manager" ? "default" : "secondary"} className="text-[10px] py-0">
                        {account.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">@{account.username}{account.email ? ` · ${account.email}` : ""}</p>
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block shrink-0">
                    Since {format(new Date(account.createdAt), "MMM d, yyyy")}
                  </p>
                  <div className="flex gap-1 ml-2">
                    <ResetPasswordDialog user={account}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                    </ResetPasswordDialog>
                    {account.id !== user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={() => {
                          if (confirm(`Delete account for ${account.displayName}?`)) {
                            deleteMutation.mutate(account.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <CreateUserDialog>
              <Button variant="outline" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Team Member
              </Button>
            </CreateUserDialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MemberWorkLog({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: incidents } = useQuery<any[]>({
    queryKey: ["member-incidents", member.user.id],
    queryFn: () => api.get(`/incidents`),
    enabled: open,
  });

  const { data: notes } = useQuery<any[]>({
    queryKey: ["member-notes", member.user.id],
    queryFn: () => api.get(`/work-notes`),
    enabled: open,
  });

  // Filter to this member's records
  const myIncidents = incidents?.filter((i) => i.createdBy === member.user.id && i.incidentDate === today) ?? [];
  const myNotes = notes?.filter((n) => n.createdBy === member.user.id && n.noteDate === today) ?? [];

  const todayTotal = member.today.incidents + member.today.serviceRequests + member.today.workNotes + member.today.resolutions;

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-semibold text-xs text-primary shrink-0">
          {getInitials(member.user.displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{member.user.displayName}</span>
            <span className="text-xs text-muted-foreground">@{member.user.username}</span>
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
            <span>{member.today.incidents} INC</span>
            <span>{member.today.serviceRequests} RITM</span>
            <span>{member.today.workNotes} notes</span>
            <span>{member.today.resolutions} resolved</span>
          </div>
        </div>
        <Badge variant={todayTotal > 0 ? "default" : "secondary"} className="shrink-0 text-xs">
          {todayTotal} today
        </Badge>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="border-t bg-muted/10 px-4 py-4 space-y-4">
          {todayTotal === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No work logged today.</p>
          ) : (
            <>
              {myIncidents.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Incidents</p>
                  <div className="space-y-2">
                    {myIncidents.map((inc: any) => (
                      <div key={inc.id} className="flex items-center gap-2 text-sm bg-card rounded-lg px-3 py-2 border">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="font-mono text-xs text-muted-foreground shrink-0">{inc.incidentNumber}</span>
                        <span className="truncate flex-1">{inc.title}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{inc.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {myNotes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Work Notes</p>
                  <div className="space-y-2">
                    {myNotes.map((note: any) => (
                      <div key={note.id} className="flex items-center gap-2 text-sm bg-card rounded-lg px-3 py-2 border">
                        <NotebookPen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate flex-1">{note.title}</span>
                        {note.hoursSpent && <span className="text-[11px] text-muted-foreground shrink-0">{note.hoursSpent}h</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {todayTotal > myIncidents.length + myNotes.length && (
                <p className="text-xs text-muted-foreground text-center">
                  + {member.today.serviceRequests} service requests and {member.today.resolutions} resolutions logged today
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
