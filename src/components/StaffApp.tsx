import { useEffect, useState } from "react";
import {
  Activity, CheckCircle2, Clock, MonitorPlay, RefreshCw, Users,
  UserCheck, SkipForward, Phone, ChevronRight, DoorOpen, ClipboardPlus, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { appointments as initial, helpers } from "@/data/mockData";
import type { Appointment } from "@/data/mockData";

type Tab = "tv" | "attendance" | "triage" | "control";

export function StaffApp() {
  const [tab, setTab] = useState<Tab>("tv");
  const [appts, setAppts] = useState<Appointment[]>(initial);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const update = (id: string, patch: Partial<Appointment>) =>
    setAppts((arr) => arr.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="secondary" className="mb-2 bg-secondary-soft text-secondary border-0">Onsite Workplace</Badge>
        <h2 className="text-2xl md:text-3xl font-display font-bold">Tablet & TV queueing tools</h2>
        <p className="text-muted-foreground text-sm mt-1">Cast the queue board to a TV, manage attendance and call patients in real time.</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-muted rounded-2xl">
          {[
            { id: "tv" as Tab,         label: "TV Queue Board", icon: MonitorPlay },
            { id: "attendance" as Tab, label: "Check-in",       icon: UserCheck   },
            { id: "triage" as Tab,     label: "Triage",         icon: ClipboardPlus },
            { id: "control" as Tab,    label: "Queue Control",  icon: Activity    },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-smooth",
                  active ? "bg-card text-primary shadow-soft" : "text-muted-foreground")}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "tv" && <TVBoard appts={appts} now={now} />}
      {tab === "attendance" && <AttendanceScreen appts={appts} update={update} />}
      {tab === "triage" && <TriageScreen />}
      {tab === "control" && <QueueControl appts={appts} update={update} />}
    </div>
  );
}

function TriageScreen() {
  const [saved, setSaved] = useState(false);
  return <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-5 shadow-soft"><div className="flex items-center gap-2 mb-5"><ClipboardPlus className="w-5 h-5 text-primary" /><div><h3 className="font-display font-bold text-lg">Triage & vital signs</h3><p className="text-sm text-muted-foreground">Complete this before the patient is sent to the doctor.</p></div></div><div className="grid md:grid-cols-2 gap-4"><div><Label>Patient</Label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{initial.slice(0, 5).map((a) => <option key={a.id}>{helpers.getPatient(a.patientId).fullName} · {a.queueNumber}</option>)}</select></div><div><Label>Triage priority</Label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Normal</option><option>Priority</option><option>Urgent</option><option>Emergency</option></select></div><div><Label>Blood pressure</Label><Input className="mt-1" placeholder="120 / 80 mmHg" /></div><div><Label>Temperature</Label><Input className="mt-1" placeholder="36.8 °C" /></div><div><Label>Pulse / respiratory rate</Label><Input className="mt-1" placeholder="72 bpm / 16 rpm" /></div><div><Label>Known allergies</Label><Input className="mt-1" placeholder="None known" /></div></div><div className="mt-4"><Label>Chief complaint / initial assessment</Label><Textarea className="mt-1" placeholder="Patient's reason for visit and observations" /></div><div className="flex flex-wrap gap-3 mt-5"><Button onClick={() => setSaved(true)}><ClipboardPlus className="w-4 h-4 mr-2" />Complete triage</Button><Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />Register walk-in</Button></div>{saved && <p className="text-sm text-secondary mt-3">Triage recorded in this prototype. Patient status is ready for the doctor queue; emergencies require immediate care or referral.</p>}</div>;
}

/* ---------------- TV BOARD ---------------- */

function TVBoard({ appts, now }: { appts: Appointment[]; now: Date }) {
  const nowServing = appts.filter((a) => a.queueStatus === "Now Serving" || a.queueStatus === "Called");
  const waiting    = appts.filter((a) => a.queueStatus === "Waiting" || a.queueStatus === "Waiting for Triage" || a.queueStatus === "Waiting for Doctor");
  const completed  = appts.filter((a) => a.queueStatus === "Completed" || a.queueStatus === "Consultation Completed").length;
  const noShow     = appts.filter((a) => a.queueStatus === "No Show").length;

  return (
    <div className="tv-frame max-w-[1200px]">
      <div className="bg-gradient-tv text-primary-foreground p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <MonitorPlay className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl md:text-2xl">SUPER HEALTH CENTER</h2>
              <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">Jones, Isabela · Live Queue</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-2xl md:text-3xl tabular-nums">
              {now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-xs text-primary-foreground/60">{now.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>

        {/* Now Serving giant cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {nowServing.length === 0 && (
            <div className="md:col-span-2 bg-card/5 border border-card/10 rounded-2xl p-10 text-center text-primary-foreground/60">
              No patient currently being served.
            </div>
          )}
          {nowServing.map((a) => {
            const p = helpers.getPatient(a.patientId);
            const s = helpers.getService(a.serviceId);
            return (
              <div key={a.id} className="bg-gradient-primary rounded-2xl p-6 shadow-glow relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-card/10 rounded-full" />
                <p className="text-xs uppercase opacity-80 font-semibold tracking-wider">Now Serving</p>
                <p className="font-display font-extrabold text-6xl md:text-7xl tracking-tight my-1">{a.queueNumber}</p>
                <p className="text-2xl font-semibold">{p.maskedName}</p>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="bg-card/20 backdrop-blur rounded-full px-3 py-1">{s.name}</span>
                  <span className="flex items-center gap-1.5 font-bold"><DoorOpen className="w-4 h-4" /> {a.room}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Waiting + stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-card/5 border border-card/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg">Up Next</h3>
              <div className="flex items-center gap-1.5 text-xs text-secondary">
                <RefreshCw className="w-3 h-3 animate-spin" /> Live
              </div>
            </div>
            <div className="space-y-2">
              {waiting.length === 0 && <p className="text-primary-foreground/50 text-sm">Queue is clear.</p>}
              {waiting.map((a, i) => {
                const p = helpers.getPatient(a.patientId);
                const s = helpers.getService(a.serviceId);
                return (
                  <div key={a.id} className="flex items-center gap-3 bg-card/5 rounded-xl p-3 hover:bg-card/10 transition-smooth">
                    <span className="font-display font-bold text-2xl text-secondary w-20">{a.queueNumber}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{p.maskedName}</p>
                      <p className="text-xs text-primary-foreground/60">{s.name} · {a.timeSlot}</p>
                    </div>
                    <Badge className="bg-warning/20 text-warning border-0">#{i + 1}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            <StatTile label="Waiting"   value={waiting.length} icon={Clock}        color="text-warning" />
            <StatTile label="Completed" value={completed}      icon={CheckCircle2} color="text-secondary" />
            <StatTile label="No Show"   value={noShow}         icon={SkipForward}  color="text-destructive" />
            <StatTile label="Total"     value={appts.length}   icon={Users}        color="text-accent" />
          </div>
        </div>

        <p className="text-center text-xs text-primary-foreground/50 mt-6">Please listen for your queue number to be called.</p>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-card/5 border border-card/10 rounded-2xl p-4">
      <Icon className={cn("w-5 h-5 mb-2", color)} />
      <p className="font-display font-extrabold text-3xl text-primary-foreground tabular-nums">{value}</p>
      <p className="text-xs text-primary-foreground/60">{label}</p>
    </div>
  );
}

/* ---------------- ATTENDANCE ---------------- */

function AttendanceScreen({ appts, update }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden max-w-5xl mx-auto">
      <div className="p-5 border-b border-border bg-muted/30">
        <h3 className="font-display font-bold text-lg">Patient Check-in</h3>
        <p className="text-sm text-muted-foreground">Mark scheduled patients as present when they arrive.</p>
      </div>
      <div className="divide-y divide-border">
        {appts.map((a: Appointment) => {
          const p = helpers.getPatient(a.patientId);
          const s = helpers.getService(a.serviceId);
          return (
            <div key={a.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-muted/20 transition-smooth">
              <span className="font-display font-bold text-primary text-lg w-20">{a.queueNumber}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{p.fullName}</p>
                <p className="text-xs text-muted-foreground">{s.name} · {a.timeSlot} · {a.room}</p>
              </div>
              <Badge className={cn("border-0",
                a.attendanceStatus === "Present" && "bg-secondary-soft text-secondary",
                a.attendanceStatus === "Pending" && "bg-warning/15 text-warning",
                a.attendanceStatus === "Absent"  && "bg-destructive/15 text-destructive",
              )}>{a.attendanceStatus}</Badge>
              <div className="flex gap-2">
                <Button size="sm" variant={a.attendanceStatus === "Present" ? "default" : "outline"}
                  onClick={() => update(a.id, { attendanceStatus: "Present", queueStatus: a.queueStatus === "Scheduled" ? "Waiting for Triage" : a.queueStatus })}>
                  <UserCheck className="w-4 h-4 mr-1" /> Check in
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => update(a.id, { attendanceStatus: "Absent", queueStatus: "No Show" })}>
                  Absent
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- QUEUE CONTROL ---------------- */

function QueueControl({ appts, update }: any) {
  const waiting = appts.filter((a: Appointment) => a.queueStatus === "Waiting" || a.queueStatus === "Waiting for Triage" || a.queueStatus === "Waiting for Doctor");
  const serving = appts.find((a: Appointment) => a.queueStatus === "Called" || a.queueStatus === "Now Serving");

  const callNext = () => {
    if (waiting[0]) update(waiting[0].id, { queueStatus: "Called" });
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
      <div className="md:col-span-2 space-y-4">
        <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-6 shadow-glow">
          <p className="text-xs uppercase opacity-80">Currently serving</p>
          {serving ? (
            <>
              <p className="font-display font-extrabold text-5xl my-1">{serving.queueNumber}</p>
              <p className="font-semibold">{helpers.getPatient(serving.patientId).fullName}</p>
              <p className="text-sm opacity-80">{helpers.getService(serving.serviceId).name} · {serving.room}</p>
            </>
          ) : (
            <p className="text-2xl font-display font-bold mt-2">— No active patient —</p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={callNext} className="bg-card text-primary hover:bg-card/90 border-0">
              <Phone className="w-4 h-4 mr-2" /> Call next
            </Button>
            {serving && (
              <>
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-card/10"
                  onClick={() => update(serving.id, { queueStatus: "In Consultation" })}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Send to doctor
                </Button>
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-card/10"
                  onClick={() => update(serving.id, { queueStatus: "No Show", attendanceStatus: "Absent" })}>
                  <SkipForward className="w-4 h-4 mr-2" /> No show
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-soft">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-bold">Waiting Queue</h3>
            <span className="text-xs text-muted-foreground">{waiting.length} patient(s)</span>
          </div>
          <div className="divide-y divide-border">
            {waiting.length === 0 && <p className="p-6 text-sm text-muted-foreground text-center">Queue is empty.</p>}
            {waiting.map((a: Appointment, i: number) => {
              const p = helpers.getPatient(a.patientId);
              return (
                <div key={a.id} className="flex items-center gap-3 p-3">
                  <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}</span>
                  <span className="font-display font-bold text-primary w-16">{a.queueNumber}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{a.timeSlot} · {a.room}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {
                    update(a.id, { queueStatus: "Called" });
                  }}>
                    Call <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
          <p className="text-xs text-muted-foreground uppercase">Active Counter</p>
          <p className="font-display font-bold text-2xl">Counter 1</p>
          <p className="text-xs text-muted-foreground">Dr. Reyes · General Consultation</p>
        </div>
        <StatCard label="Total today" value={appts.length} tone="primary" />
        <StatCard label="Served"      value={appts.filter((a:Appointment)=>a.queueStatus==="Completed").length} tone="secondary" />
        <StatCard label="No-shows"    value={appts.filter((a:Appointment)=>a.queueStatus==="No Show").length} tone="destructive" />
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "secondary" | "destructive" }) {
  return (
    <div className={cn("rounded-2xl p-4 border",
      tone === "primary"     && "bg-primary-soft border-primary/20",
      tone === "secondary"   && "bg-secondary-soft border-secondary/20",
      tone === "destructive" && "bg-destructive/10 border-destructive/20",
    )}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-display font-extrabold text-3xl tabular-nums">{value}</p>
    </div>
  );
}
