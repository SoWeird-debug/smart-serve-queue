import { useState } from "react";
import {
  Stethoscope, Baby, Syringe, Smile, TestTube, ShieldPlus,
  Bell, Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2,
  Home, User, ListChecks, MapPin, Phone, ArrowRight, Sparkles, LogIn, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  services, appointments, patients, notifications, helpers, medicalRecords,
} from "@/data/mockData";
import { LocationPickerMap, type PinnedLocation } from "@/components/LocationPickerMap";

const iconMap = { Stethoscope, Baby, Syringe, Smile, TestTube, ShieldPlus };

type Screen = "login" | "home" | "services" | "schedule" | "confirm" | "myAppts" | "records" | "notif";

export function PatientApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate() + 1);
  const [selectedLocation, setSelectedLocation] = useState<PinnedLocation | null>(null);
  const me = patients[0];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center max-w-xl">
        <Badge variant="secondary" className="mb-2 bg-primary-soft text-primary border-0">Patient Mobile App</Badge>
        <h2 className="text-2xl md:text-3xl font-display font-bold">Book, queue, and track visits — from your phone</h2>
        <p className="text-muted-foreground text-sm mt-1">A walkthrough of the patient-facing experience.</p>
      </div>

      <div className="phone-frame">
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/90 rounded-b-2xl z-20" />
        <div className="h-full overflow-y-auto pb-24 bg-background">
          {screen === "login"   && <LoginScreen   onLogin={() => setScreen("home")} />}
          {screen === "home"    && <HomeScreen    me={me} onBook={() => setScreen("services")} onView={() => setScreen("myAppts")} onNotif={() => setScreen("notif")} />}
          {screen === "services"&& <ServicesScreen onBack={() => setScreen("home")} onPick={(id) => { setSelectedService(id); setSelectedLocation(null); setScreen("schedule"); }} />}
          {screen === "schedule"&& <ScheduleScreen serviceId={selectedService!} date={selectedDate} location={selectedLocation} onDate={setSelectedDate} onLocation={setSelectedLocation} onBack={() => setScreen("services")} onConfirm={() => setScreen("confirm")} />}
          {screen === "confirm" && <ConfirmScreen serviceId={selectedService!} date={selectedDate} location={selectedLocation!} onDone={() => setScreen("myAppts")} />}
          {screen === "myAppts" && <MyAppointmentsScreen onBack={() => setScreen("home")} />}
          {screen === "records" && <MedicalRecordsScreen onBack={() => setScreen("home")} />}
          {screen === "notif"   && <NotifScreen onBack={() => setScreen("home")} />}
        </div>

        {screen !== "login" && (
          <BottomNav screen={screen} setScreen={setScreen} />
        )}
      </div>
    </div>
  );
}

/* ---------------- screens ---------------- */

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <div className="min-h-full bg-gradient-hero p-6 pt-12 text-primary-foreground flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-card/20 backdrop-blur flex items-center justify-center mb-4 shadow-glow">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="font-display text-3xl font-bold">SmartServe</h1>
        <p className="text-primary-foreground/80 text-sm mt-1 mb-8">Super Health Center · Jones, Isabela</p>

        <div className="w-full bg-card text-card-foreground rounded-3xl p-6 shadow-card">
          <div className="flex p-1 bg-muted rounded-xl mb-5">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={cn("flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-smooth",
                  mode === m ? "bg-card text-primary shadow-soft" : "text-muted-foreground")}>
                {m === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-left">
            {mode === "register" && (
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input placeholder="Juan Dela Cruz" className="rounded-xl" />
              </div>
            )}
            <div>
              <Label className="text-xs">Mobile Number</Label>
              <Input placeholder="+63 9XX XXX XXXX" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <Input type="password" placeholder="••••••••" className="rounded-xl" />
            </div>
            <Button onClick={onLogin} className="w-full rounded-xl bg-gradient-primary border-0 shadow-glow h-11">
              <LogIn className="w-4 h-4 mr-2" />
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">By continuing, you agree to our Privacy Notice (Data Privacy Act).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ me, onBook, onView, onNotif }: any) {
  const next = appointments.find(a => a.patientId === me.id) ?? appointments[3];
  const svc = helpers.getService(next.serviceId);
  return (
    <div className="bg-background">
      <div className="bg-gradient-hero p-5 pt-12 pb-20 text-primary-foreground rounded-b-[2rem]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-primary-foreground/70">Magandang umaga 👋</p>
            <h2 className="font-display font-bold text-xl">{me.fullName.split(" ")[0]}</h2>
          </div>
          <button onClick={onNotif} className="relative w-10 h-10 rounded-full bg-card/20 backdrop-blur flex items-center justify-center">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full" />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-14 space-y-4">
        {/* Next appointment card */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border animate-pop-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Next Appointment</span>
            <Badge className="bg-secondary-soft text-secondary border-0">Confirmed</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{svc.name}</p>
              <p className="text-xs text-muted-foreground">{helpers.formatDate(next.date)} · Clinic hours: 8:00 AM – 5:00 PM</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Booking</p>
              <p className="font-display font-bold text-primary">APT-2026-0098</p>
            </div>
          </div>
          <Button onClick={onView} variant="ghost" size="sm" className="w-full mt-3 text-primary">
            View queue status <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onBook} className="bg-gradient-primary text-primary-foreground rounded-2xl p-4 text-left shadow-soft active:scale-95 transition-smooth">
            <Calendar className="w-6 h-6 mb-3" />
            <p className="font-semibold text-sm">Book a visit</p>
            <p className="text-xs opacity-80">Reserve your slot</p>
          </button>
          <button onClick={onView} className="bg-card border border-border rounded-2xl p-4 text-left shadow-soft active:scale-95 transition-smooth">
            <ListChecks className="w-6 h-6 mb-3 text-secondary" />
            <p className="font-semibold text-sm">My queue</p>
            <p className="text-xs text-muted-foreground">Live status</p>
          </button>
        </div>

        {/* Services preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold">Clinic Services</h3>
            <button onClick={onBook} className="text-xs text-primary font-medium">See all</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {services.slice(0, 4).map((s) => {
              const Icon = (iconMap as any)[s.icon];
              return (
                <button key={s.id} onClick={onBook} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/50">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                    s.color === "primary" && "bg-primary-soft text-primary",
                    s.color === "secondary" && "bg-secondary-soft text-secondary",
                    s.color === "accent" && "bg-accent-soft text-accent",
                    s.color === "info" && "bg-primary-soft text-info",
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-center leading-tight">{s.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Health tip */}
        <div className="bg-secondary-soft border border-secondary/20 rounded-2xl p-4 flex gap-3">
          <ShieldPlus className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-secondary-foreground">Free flu vaccination</p>
            <p className="text-xs text-muted-foreground">Available Mon–Fri, walk-ins accepted.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServicesScreen({ onBack, onPick }: { onBack: () => void; onPick: (id: string) => void }) {
  return (
    <div>
      <ScreenHeader title="Choose a service" onBack={onBack} />
      <div className="p-5 space-y-3">
        {services.map((s) => {
          const Icon = (iconMap as any)[s.icon];
          return (
            <button key={s.id} onClick={() => onPick(s.id)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-3 text-left active:scale-[0.98] transition-smooth shadow-soft">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                s.color === "primary" && "bg-primary-soft text-primary",
                s.color === "secondary" && "bg-secondary-soft text-secondary",
                s.color === "accent" && "bg-accent-soft text-accent",
                s.color === "info" && "bg-primary-soft text-info",
                s.color === "warning" && "bg-warning/15 text-warning",
                s.color === "destructive" && "bg-destructive/15 text-destructive",
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">~{s.duration} min · {s.capacity} slots/day</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleScreen({ serviceId, date, location, onDate, onLocation, onBack, onConfirm }: any) {
  const svc = helpers.getService(serviceId);
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i); return d;
  });
  return (
    <div>
      <ScreenHeader title="Select appointment date" onBack={onBack} />
      <div className="p-5 space-y-5">
        <div className="bg-primary-soft rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-card text-primary flex items-center justify-center"><Stethoscope className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Service</p>
            <p className="font-semibold text-sm">{svc.name}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Select date</p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {days.map((d, index) => {
              const active = d.getDate() === date;
              const holiday = index === 5;
              const full = index === 2;
              const available = 40 - ((index * 7 + 15) % 35);
              return (
                <button key={d.toISOString()} disabled={holiday || full} onClick={() => onDate(d.getDate())}
                  className={cn("min-w-[60px] flex flex-col items-center py-3 rounded-2xl border transition-smooth",
                    active ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow" : "bg-card border-border", (holiday || full) && "opacity-50")}>
                  <span className="text-[10px] uppercase">{d.toLocaleDateString("en", { weekday: "short" })}</span>
                  <span className="font-display font-bold text-lg">{d.getDate()}</span>
                  <span className="text-[10px]">{d.toLocaleDateString("en", { month: "short" })}</span>
                  <span className="text-[9px] mt-1">{holiday ? "Closed" : full ? "Full" : `${available} slots`}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-muted/50 rounded-2xl p-3 text-xs text-muted-foreground">Choose an available date only. Clinic consultation hours are 8:00 AM – 5:00 PM; your queue number is assigned after clinic check-in.</div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Patient location</p>
              <p className="text-[10px] text-muted-foreground">Required for local disease monitoring</p>
            </div>
            {location && <Badge className="border-0 bg-secondary-soft text-secondary">Pinned</Badge>}
          </div>
          <LocationPickerMap value={location} onChange={onLocation} />
          {location && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Saved pin: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
          )}
        </div>

        <Button disabled={!location} onClick={onConfirm} className="w-full h-12 rounded-2xl bg-gradient-primary border-0 shadow-glow">
          Confirm booking <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {!location && <p className="-mt-3 text-center text-[10px] text-warning">Pin the patient location before confirming.</p>}
      </div>
    </div>
  );
}

function ConfirmScreen({ serviceId, date, location, onDone }: any) {
  const svc = helpers.getService(serviceId);
  return (
    <div className="p-6 pt-10 flex flex-col items-center text-center min-h-full bg-background">
      <div className="w-24 h-24 rounded-full bg-secondary-soft flex items-center justify-center mb-4 animate-pop-in">
        <CheckCircle2 className="w-12 h-12 text-secondary" />
      </div>
      <h2 className="font-display font-bold text-xl">Booking confirmed!</h2>
      <p className="text-sm text-muted-foreground mb-6">A reminder will be sent to your phone.</p>

      <div className="w-full bg-gradient-primary text-primary-foreground rounded-3xl p-6 shadow-glow">
        <p className="text-xs uppercase opacity-80">Booking reference</p>
        <p className="font-display font-extrabold text-3xl tracking-tight my-2">APT-2026-0098</p>
        <div className="border-t border-primary-foreground/20 my-3" />
        <div className="grid grid-cols-2 gap-2 text-left text-sm">
          <div>
            <p className="text-[10px] opacity-70 uppercase">Service</p>
            <p className="font-semibold truncate">{svc.name}</p>
          </div>
          <div><p className="text-[10px] opacity-70 uppercase">Date</p><p className="font-semibold">{new Date(new Date().getFullYear(), new Date().getMonth(), date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p></div>
          <div><p className="text-[10px] opacity-70 uppercase">Status</p><p className="font-semibold">Confirmed</p></div>
        </div>
      </div>

      <div className="w-full mt-5 bg-card border border-border rounded-2xl p-4 text-left text-xs space-y-2">
        <div className="flex gap-2"><MapPin className="w-4 h-4 text-primary shrink-0" /><span>Super Health Center, Jones, Isabela</span></div>
        <div className="flex gap-2"><MapPin className="w-4 h-4 text-secondary shrink-0" /><span>Patient location saved ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})</span></div>
        <div className="flex gap-2"><Phone className="w-4 h-4 text-primary shrink-0" /><span>(078) 000-0000</span></div>
        <div className="flex gap-2"><Clock className="w-4 h-4 text-primary shrink-0" /><span>Clinic consultation hours: 8:00 AM – 5:00 PM. Present your booking reference when checking in.</span></div>
      </div>

      <Button onClick={onDone} className="w-full mt-5 h-12 rounded-2xl">View my appointments</Button>
    </div>
  );
}

function MyAppointmentsScreen({ onBack }: { onBack: () => void }) {
  const list = appointments.slice(0, 5);
  return (
    <div>
      <ScreenHeader title="My appointments" onBack={onBack} />
      <div className="p-5 space-y-3">
        {list.map((a, i) => {
          const svc = helpers.getService(a.serviceId);
          const isLive = a.queueStatus === "Now Serving" || a.queueStatus === "Waiting";
          return (
            <div key={a.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-primary">APT-2026-00{a.id.slice(1)}</span>
                <Badge className={cn("border-0",
                  a.queueStatus === "Now Serving" && "bg-secondary text-secondary-foreground",
                  a.queueStatus === "Waiting" && "bg-warning/20 text-warning",
                  a.queueStatus === "Completed" && "bg-muted text-muted-foreground",
                  a.queueStatus === "Scheduled" && "bg-primary-soft text-primary",
                )}>{a.queueStatus}</Badge>
              </div>
              <p className="font-semibold text-sm">{svc.name}</p>
              <p className="text-xs text-muted-foreground">{helpers.formatDate(a.date)} · Appointment {a.queueStatus === "Scheduled" ? "Confirmed" : a.attendanceStatus === "Present" ? "Arrived" : a.queueStatus}</p>
              {a.attendanceStatus === "Present" && <p className="text-xs text-primary mt-2">Queue {a.queueNumber} · {a.queueStatus === "Waiting" ? "Waiting for triage" : a.queueStatus}</p>}
              {isLive && (
                <div className="mt-3 p-2 bg-secondary-soft rounded-xl text-xs text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  {i === 0 ? "You are next!" : `${i} patient(s) ahead · est. wait ${i * 12} min`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MedicalRecordsScreen({ onBack }: { onBack: () => void }) {
  const records = medicalRecords.filter((record) => record.patientId === patients[0].id);
  return (
    <div>
      <ScreenHeader title="My medical records" onBack={onBack} />
      <div className="p-5 space-y-3">
        <div className="bg-primary-soft border border-primary/15 rounded-2xl p-4"><p className="font-semibold text-sm">Your private health history</p><p className="text-xs text-muted-foreground mt-1">This demo shows records approved for the patient portal. In the live system, access requires secure sign-in and consent.</p></div>
        {records.map((record) => <div key={record.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft"><div className="flex justify-between gap-2"><p className="font-semibold text-sm">{record.diagnosis}</p><Badge className="bg-secondary-soft text-secondary border-0">Consultation completed</Badge></div><p className="text-[10px] text-muted-foreground mt-1">{record.date} · {record.clinician}</p><p className="text-xs mt-3">{record.notes}</p><p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">Follow the doctor’s clinic-approved instructions. Pharmacy dispensing history is recorded separately when applicable.</p></div>)}
        <p className="text-[10px] text-muted-foreground text-center">For corrections or older paper records, please contact the clinic records desk.</p>
      </div>
    </div>
  );
}

function NotifScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <ScreenHeader title="Notifications" onBack={onBack} />
      <div className="p-5 space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className={cn("bg-card border rounded-2xl p-4 shadow-soft",
            n.read ? "border-border" : "border-primary/30 bg-primary-soft/40")}>
            <div className="flex items-start gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                n.type === "reminder" && "bg-primary-soft text-primary",
                n.type === "update" && "bg-secondary-soft text-secondary",
                n.type === "alert" && "bg-warning/20 text-warning",
              )}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- shared ---------- */

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-2">
      <button onClick={onBack} className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="font-display font-semibold">{title}</h2>
    </div>
  );
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const items: { id: Screen; icon: typeof Home; label: string }[] = [
    { id: "home",    icon: Home,       label: "Home"    },
    { id: "services",icon: Calendar,   label: "Book"    },
    { id: "myAppts", icon: ListChecks, label: "Queue"   },
    { id: "records", icon: FileText,   label: "Records" },
    { id: "notif",   icon: Bell,       label: "Alerts"  },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-2 py-2 flex justify-around">
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.id;
        return (
          <button key={it.id} onClick={() => setScreen(it.id)}
            className={cn("flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-smooth",
              active ? "text-primary" : "text-muted-foreground")}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
