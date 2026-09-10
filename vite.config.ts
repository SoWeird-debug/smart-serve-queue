import { defineConfig } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import mdns from "multicast-dns";
import { networkInterfaces } from "node:os";
import type { IncomingMessage } from "node:http";
import { componentTagger } from "lovable-tagger";

type MdnsRecord = {
  name?: string;
  type?: string;
  data?: unknown;
};

type LanCastDevice = {
  id: string;
  displayName: string;
  model: string;
  address: string;
  port: number;
  host: string;
};
type PublicQueueItem = {
  id: string;
  queueNumber: string;
  queueStatus: "Waiting for Triage" | "Waiting for Doctor" | "Called";
  room: string;
  triagePriority: "Normal" | "Priority" | "Urgent" | "Emergency";
  queueEnteredAt: string;
  createdAt: string;
};
type PublicQueueState = {
  appointments: PublicQueueItem[];
  updatedAt: string;
};

const castServiceName = "_googlecast._tcp.local";
const normalizedName = (value: unknown) =>
  String(value || "").trim().replace(/\.$/, "").toLowerCase();
const recordText = (value: unknown) => {
  if (Buffer.isBuffer(value)) return value.toString();
  if (value instanceof Uint8Array) return Buffer.from(value).toString();
  return String(value || "");
};
const txtValues = (value: unknown) => {
  const values = Array.isArray(value) ? value : [value];
  return values.reduce<Record<string, string>>((result, entry) => {
    const [key, ...rest] = recordText(entry).split("=");
    if (key && rest.length) result[key.toLowerCase()] = rest.join("=");
    return result;
  }, {});
};

const scanChromecasts = (timeoutMs = 1800) =>
  new Promise<LanCastDevice[]>((resolve) => {
    const records: MdnsRecord[] = [];
    const responseAddresses = new Map<string, string>();
    let finished = false;
    const scanner = mdns({ reuseAddr: true });
    const finish = () => {
      if (finished) return;
      finished = true;
      scanner.destroy();
      const serviceInstances = new Set<string>();
      records.forEach((record) => {
        if (
          record.type === "PTR" &&
          normalizedName(record.name) === castServiceName
        )
          serviceInstances.add(normalizedName(record.data));
        if (
          record.type === "SRV" &&
          normalizedName(record.name).endsWith(`.${castServiceName}`)
        )
          serviceInstances.add(normalizedName(record.name));
      });
      const devices = Array.from(serviceInstances)
        .map((service) => {
          const srv = records.find(
            (record) =>
              record.type === "SRV" && normalizedName(record.name) === service,
          );
          const srvData = srv?.data as { target?: string; port?: number } | undefined;
          const host = normalizedName(srvData?.target);
          const txt = records.find(
            (record) =>
              record.type === "TXT" && normalizedName(record.name) === service,
          );
          const metadata = txtValues(txt?.data);
          const addressRecord = records.find(
            (record) =>
              record.type === "A" && normalizedName(record.name) === host,
          );
          const address = recordText(addressRecord?.data) || responseAddresses.get(service) || "Unknown LAN address";
          const fallbackName = service.split("._googlecast")[0]?.replace(/\\032/g, " ") || "Chromecast";
          return {
            id: metadata.id || service,
            displayName: metadata.fn || fallbackName,
            model: metadata.md || "Google Cast device",
            address,
            port: Number(srvData?.port) || 8009,
            host: host || "Unknown host",
          };
        })
        .filter((device, index, list) => list.findIndex((item) => item.id === device.id) === index)
        .sort((left, right) => left.displayName.localeCompare(right.displayName));
      resolve(devices);
    };
    const timer = setTimeout(finish, timeoutMs);
    scanner.on("response", (packet: any, remote: { address?: string }) => {
      const packetRecords = [
        ...(Array.isArray(packet.answers) ? packet.answers : []),
        ...(Array.isArray(packet.additionals) ? packet.additionals : []),
      ] as MdnsRecord[];
      records.push(...packetRecords);
      packetRecords.forEach((record) => {
        if (record.name && remote.address)
          responseAddresses.set(normalizedName(record.name), remote.address);
      });
    });
    scanner.on("error", () => {
      clearTimeout(timer);
      finish();
    });
    scanner.once("ready", () => {
      scanner.query({
        questions: [{ name: castServiceName, type: "PTR" }],
      });
    });
  });

let publicQueueState: PublicQueueState = {
  appointments: [],
  updatedAt: "",
};
const queueStatuses = new Set<PublicQueueItem["queueStatus"]>([
  "Waiting for Triage",
  "Waiting for Doctor",
  "Called",
]);
const queuePriorities = new Set<PublicQueueItem["triagePriority"]>([
  "Normal",
  "Priority",
  "Urgent",
  "Emergency",
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
const sanitizeQueueState = (input: unknown): PublicQueueState => {
  const source = input as { appointments?: unknown };
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
          return {
            id: String(item.id).slice(0, 128),
            queueNumber: number.padStart(3, "0"),
            queueStatus,
            room: String(item.room || "assigned room").slice(0, 80),
            triagePriority: queuePriorities.has(priority) ? priority : "Normal",
            queueEnteredAt: String(item.queueEnteredAt || "").slice(0, 40),
            createdAt: String(item.createdAt || "").slice(0, 40),
          };
        })
        .filter((item): item is PublicQueueItem => Boolean(item))
        .slice(0, 100)
    : [];
  return { appointments, updatedAt: new Date().toISOString() };
};
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

function localCastDiscovery(): Plugin {
  return {
    name: "smartserve-local-cast-discovery",
    configureServer(server) {
      server.middlewares.use("/api/cast/discover", async (request, response) => {
        if (request.method !== "GET") {
          response.statusCode = 405;
          response.end();
          return;
        }
        const devices = await scanChromecasts();
        sendJson(response, {
          devices,
          scannedAt: new Date().toISOString(),
          hint: devices.length
            ? "Select a device below, then confirm the same device in Chrome’s Cast picker."
            : "No Google Cast device responded. Confirm the device is on the same LAN/VLAN and that mDNS multicast is not blocked.",
        });
      });
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
          publicQueueState = sanitizeQueueState(await readJsonBody(request));
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
          (address) => `http://${address}:${port}/?display=queue-tv`,
        );
        sendJson(response, { urls });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Required when the dev server is accessed through an ngrok HTTPS tunnel.
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    localCastDiscovery(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
