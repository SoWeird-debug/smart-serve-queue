# Public queue-board URLs

The board paths are permanent and privacy-safe: they display queue numbers,
queue state, and the queue location, never patient names or clinical details.

## After deployment to Hostinger

Replace `your-domain.example` with the real domain:

- General Clinic: `https://your-domain.example/queue/general-clinic`
- Animal Bite Center: `https://your-domain.example/queue/animal-bite`

## Local clinic network fallback

When the clinic computer runs SmartServe on the LAN, use its IP address with
the same stable paths:

- General Clinic: `http://192.168.68.67:8080/queue/general-clinic`
- Animal Bite Center: `http://192.168.68.67:8080/queue/animal-bite`

The existing legacy General Clinic URL continues to work:
`http://192.168.68.67:8080/?display=queue-tv`

The LAN route can work without internet, but the clinic computer, its local
server, and the TV must remain connected to the same local network.

## Important deployment behavior

The public Hostinger URLs read their queue data from the Laravel/MySQL API.
They are ready as stable display routes, but will show a live queue only after
the staff check-in and triage screens are connected to that API. Until then,
the local Vite server remains the working offline board source on the clinic
LAN.
