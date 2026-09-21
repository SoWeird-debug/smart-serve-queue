import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { networkInterfaces } from "node:os";
import type { IncomingMessage } from "node:http";
import { componentTagger } from "lovable-tagger";

type PublicQueueItem = {
  id: string;
  queueNumber: string;
  queueStatus: "Waiting for Triage" | "Triage" | "Waiting for Doctor" | "Called" | "In Consultation";
  room: string;
  queueArea: "General Clinic" | "Animal Bite Center";
  triagePriority: "Normal" | "Priority" | "Urgent" | "Emergency";
  queueEnteredAt: string;
  createdAt: string;
};
type PublicQueueDoctor = {
  id: string;
  fullName: string;
  doctorStatus: "Available" | "With patient" | "On break" | "Off duty" | "On leave";
  queueArea: "General Clinic" | "Animal Bite Center";
};
type PublicQueueState = {
  appointments: PublicQueueItem[];
  doctors: PublicQueueDoctor[];
  updatedAt: string;
};

let publicQueueState: PublicQueueState = {
  appointments: [],
  doctors: [],
  updatedAt: "",
};
const queueStatuses = new Set<PublicQueueItem["queueStatus"]>([
  "Waiting for Triage",
  "Triage",
  "Waiting for Doctor",
  "Called",
  "In Consultation",
]);
const queuePriorities = new Set<PublicQueueItem["triagePriority"]>([
  "Normal",
  "Priority",
  "Urgent",
  "Emergency",
]);
const doctorStatuses = new Set<PublicQueueDoctor["doctorStatus"]>([
  "Available",
  "With patient",
  "On break",
  "Off duty",
  "On leave",
]);
const isLoopbackRequest = (address?: string) =>
  Boolean(address && (address === "::1" || address === "127.0.0.1" || address.startsWith("::ffff:127.")));
const readJsonBody = (request: IncomingMessage) =>
  new Promise<unknown>((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      body += chunk;
      if (body.length > 24000) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
const sanitizeQueueState = (
  input: unknown,
  area?: PublicQueueItem["queueArea"],
): PublicQueueState => {
  const source = input as { appointments?: unknown; doctors?: unknown };
  const appointments = Array.isArray(source?.appointments)
    ? source.appointments
        .map((entry) => {
          const item = entry as Record<string, unknown>;
          const number = String(item.queueNumber || "").replace(/\D/g, "");
          const numericQueue = Number(number);
          const queueStatus = String(item.queueStatus || "") as PublicQueueItem["queueStatus"];
          if (
            !item.id ||
            !Number.isInteger(numericQueue) ||
            numericQueue < 1 ||
            numericQueue > 100 ||
            !queueStatuses.has(queueStatus)
          )
            return null;
          const priority = String(item.triagePriority || "Normal") as PublicQueueItem["triagePriority"];
          const queueArea = area || (item.queueArea === "Animal Bite Center"
            ? "Animal Bite Center"
            : "General Clinic");
          return {
            id: String(item.id).slice(0, 128),
            queueNumber: number.padStart(3, "0"),
            queueStatus,
            room: String(item.room || "assigned room").slice(0, 80),
            queueArea,
            triagePriority: queuePriorities.has(priority) ? priority : "Normal",
            queueEnteredAt: String(item.queueEnteredAt || "").slice(0, 40),
            createdAt: String(item.createdAt || "").slice(0, 40),
          };
        })
        .filter((item): item is PublicQueueItem => Boolean(item))
        .slice(0, 100)
    : [];
  const doctors = Array.isArray(source?.doctors)
    ? source.doctors
        .map((entry) => {
          const doctor = entry as Record<string, unknown>;
          const doctorStatus = String(doctor.doctorStatus || "Available") as PublicQueueDoctor["doctorStatus"];
          const queueArea = area || (doctor.queueArea === "Animal Bite Center" ? "Animal Bite Center" : "General Clinic");
          if (!doctor.id || !String(doctor.fullName || "").trim() || !doctorStatuses.has(doctorStatus)) return null;
          return {
            id: String(doctor.id).slice(0, 128),
            fullName: String(doctor.fullName).trim().slice(0, 100),
            doctorStatus,
            queueArea,
          };
        })
        .filter((doctor): doctor is PublicQueueDoctor => Boolean(doctor))
        .slice(0, 12)
    : [];
  return { appointments, doctors, updatedAt: new Date().toISOString() };
};
const isQueueArea = (value: unknown): value is PublicQueueItem["queueArea"] =>
  value === "General Clinic" || value === "Animal Bite Center";
const lanIpv4Addresses = () =>
  Object.values(networkInterfaces())
    .flat()
    .filter(
      (network): network is NonNullable<typeof network> =>
        Boolean(network) && network.family === "IPv4" && !network.internal,
    )
    .map((network) => network.address);
const sendJson = (response: any, payload: unknown, statusCode = 200) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
};

function localQueueDisplay(): Plugin {
  return {
    name: "smartserve-local-queue-display",
    configureServer(server) {
      server.middlewares.use("/api/queue-display", async (request, response) => {
        if (request.method === "GET") {
          sendJson(response, publicQueueState);
          return;
        }
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end();
          return;
        }
        if (!isLoopbackRequest(request.socket.remoteAddress)) {
          sendJson(response, { error: "Only the local staff workspace may publish the public queue." }, 403);
          return;
        }
        try {
          const payload = await readJsonBody(request) as { area?: unknown };
          if (!isQueueArea(payload.area)) {
            sendJson(response, { error: "A valid queue area is required." }, 400);
            return;
          }
          const publishedArea = payload.area;
          const areaState = sanitizeQueueState(payload, publishedArea);
          publicQueueState = {
            appointments: [
              ...publicQueueState.appointments.filter(
                (appointment) => appointment.queueArea !== publishedArea,
              ),
              ...areaState.appointments,
            ],
            doctors: [
              ...publicQueueState.doctors.filter(
                (doctor) => doctor.queueArea !== publishedArea,
              ),
              ...areaState.doctors,
            ],
            updatedAt: areaState.updatedAt,
          };
          response.statusCode = 204;
          response.end();
        } catch {
          sendJson(response, { error: "Queue update could not be read." }, 400);
        }
      });
      server.middlewares.use("/api/smart-tv-link", (request, response) => {
        if (request.method !== "GET") {
          response.statusCode = 405;
          response.end();
          return;
        }
        const port = request.headers.host?.match(/:(\d+)$/)?.[1] || "8080";
        const urls = lanIpv4Addresses().map(
          (address) => `http://${address}:${port}/queue/general-clinic`,
        );
        sendJson(response, { urls });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Laravel owns public/.htaccess, favicon and robots.txt. Application images
  // are imported by React and emitted into assets/, so no Vite public copy is
  // needed during an integrated Laravel build.
  publicDir: false,
  // Production output is placed beside Laravel's public/index.php. On
  // Hostinger the domain web root must point to backend/public, so the React
  // app and /api/v1 Laravel API share one HTTPS origin.
  build: {
    outDir: "backend/public",
    emptyOutDir: false,
  },
  server: {
    host: "::",
    port: 8080,
    // Required when the dev server is accessed through an ngrok HTTPS tunnel.
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/v1": {
        target: process.env.VITE_LARAVEL_URL || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    localQueueDisplay(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
