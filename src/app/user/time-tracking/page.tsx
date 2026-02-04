"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProjects,
  getTimeEntries,
  getTimeTrackingSummary,
  createProject,
  createTimeEntry,
  deleteProject,
  deleteTimeEntry,
  updateProject,
} from "@/actions/time-tracking";
import { getClients } from "@/actions/queries";
import { exportTimeEntriesToCSV } from "@/actions/export";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton, CardSkeleton } from "@/components/skeletons";
import { formatCurrency } from "@/lib/financial";
import { currencies } from "@/lib/currencies";
import { toast } from "sonner";
import {
  Plus,
  Download,
  Trash2,
  Clock,
  FolderOpen,
  Timer,
  Pencil,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const projectStatusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export default function TimeTrackingPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("entries");

  useEffect(() => {
    fetchData();
  }, [projectFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const [projectsData, entriesData, summaryData, clientsData] = await Promise.all([
        getProjects(),
        getTimeEntries(projectFilter !== "ALL" ? { projectId: projectFilter } : undefined),
        getTimeTrackingSummary(),
        getClients(),
      ]);
      setProjects(projectsData);
      setEntries(entriesData);
      setSummary(summaryData);
      setClients(clientsData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createProject({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
        clientId: (formData.get("clientId") as string) || undefined,
        hourlyRate: Number.parseFloat(formData.get("hourlyRate") as string),
        budget: Number.parseFloat(formData.get("budget") as string) || undefined,
        currency: formData.get("currency") as string,
      });
      toast.success("Project created");
      setProjectDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to create project");
    }
  }

  async function handleCreateEntry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createTimeEntry({
        projectId: formData.get("projectId") as string,
        description: (formData.get("description") as string) || undefined,
        date: formData.get("date") as string,
        hours: Number.parseFloat(formData.get("hours") as string),
        isBillable: formData.get("isBillable") === "on",
      });
      toast.success("Time entry logged");
      setEntryDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to log time");
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm("Delete this project and all its time entries?")) return;
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      await deleteTimeEntry(id);
      toast.success("Entry deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleProjectStatusChange(id: string, status: string) {
    try {
      await updateProject(id, { status });
      toast.success("Project updated");
      fetchData();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleExport() {
    try {
      const csv = await exportTimeEntriesToCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `time-entries-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported");
    } catch {
      toast.error("Export failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
            <p className="text-muted-foreground">Track project hours and billable time</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={`skel-${i}`} />
          ))}
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" {...fadeIn} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">Track project hours and billable time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>

          <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client</Label>
                    <Select name="clientId">
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select name="currency" defaultValue="INR">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                    <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (optional)</Label>
                    <Input id="budget" name="budget" type="number" step="0.01" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Project</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Timer className="mr-2 h-4 w-4" /> Log Time
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Time Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project *</Label>
                  <Select name="projectId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects
                        .filter((p) => p.status === "ACTIVE")
                        .map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-description">Description</Label>
                  <Input id="entry-description" name="description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours *</Label>
                    <Input id="hours" name="hours" type="number" step="0.25" min="0.25" required />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isBillable" name="isBillable" defaultChecked />
                  <Label htmlFor="isBillable">Billable</Label>
                </div>
                <DialogFooter>
                  <Button type="submit">Log Time</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{summary.totalProjects}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{summary.activeProjects}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{summary.totalHours.toFixed(1)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Billable Hours</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{summary.billableHours.toFixed(1)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{summary.thisMonthHours.toFixed(1)}h</p></CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Time Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Projects</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Time Entries ({entries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-screen text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium">No time entries</p>
                  <p className="text-sm text-muted-foreground">Log your first time entry to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Billable</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {entries.map((entry) => (
                          <motion.tr
                            key={entry.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{entry.projectName}</TableCell>
                            <TableCell className="max-w-50 truncate text-muted-foreground">
                              {entry.description || "—"}
                            </TableCell>
                            <TableCell>{entry.userName}</TableCell>
                            <TableCell className="text-right font-mono">{Number(entry.hours).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(Number(entry.hourlyRate), entry.projectCurrency)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(Number(entry.amount), entry.projectCurrency)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={entry.isBillable ? "default" : "secondary"}>
                                {entry.isBillable ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Projects ({projects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-screen text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium">No projects</p>
                  <p className="text-sm text-muted-foreground">Create your first project</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Billable</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {projects.map((project) => (
                          <motion.tr
                            key={project.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">{project.name}</div>
                                {project.description && (
                                  <div className="text-xs text-muted-foreground truncate max-w-50">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{project.clientName || "—"}</TableCell>
                            <TableCell>
                              <Select
                                value={project.status}
                                onValueChange={(v) => handleProjectStatusChange(project.id, v)}
                              >
                                <SelectTrigger className="w-30 h-8">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusColors[project.status]}`}>
                                    {project.status}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ACTIVE">Active</SelectItem>
                                  <SelectItem value="COMPLETED">Completed</SelectItem>
                                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(Number(project.hourlyRate), project.currency)}/hr
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {project.budget
                                ? formatCurrency(Number(project.budget), project.currency)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono">{project.totalHours.toFixed(1)}</TableCell>
                            <TableCell className="text-right font-mono">{project.billableHours.toFixed(1)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
