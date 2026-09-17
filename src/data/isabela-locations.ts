/** Guided residence choices for the Isabela-focused clinic prototype. */
export const isabelaMunicipalities = [
  "Alicia", "Angadanan", "Aurora", "Benito Soliven", "Burgos", "Cabagan",
  "Cabatuan", "Cauayan City", "Cordon", "Delfin Albano", "Dinapigue",
  "Divilacan", "Echague", "Gamu", "Ilagan City", "Jones", "Luna",
  "Maconacon", "Mallig", "Naguilian", "Palanan", "Quezon", "Quirino",
  "Ramon", "Reina Mercedes", "Roxas", "San Agustin", "San Guillermo",
  "San Isidro", "San Manuel", "San Mariano", "San Mateo", "San Pablo",
  "Santa Maria", "Santiago City", "Santo Tomas", "Tumauini",
] as const;

// The prototype's verified directory can be extended without changing the form.
// Existing records and address-search results remain valid even when a new
// barangay has not yet been added here.
export const isabelaBarangays: Record<string, string[]> = {
  Jones: [
    "Abulan", "Addalam", "Arubub", "Bannawag", "Bantay", "Barangay I",
    "Barangay II", "Barangcuag", "Dalibubon", "Daligan", "Diarao", "Dibuluan",
    "Dicamay I", "Dicamay II", "Dipangit", "Disimpit", "Divinan", "Dumawing",
    "Fugu", "Lacab", "Linamanan", "Linomot", "Malannit", "Minuri", "Namnama",
    "Napaliong", "Palagao", "Papan Este", "Papan Weste", "Payac", "Pungpongan",
    "San Antonio", "San Isidro", "San Jose", "San Roque", "San Sebastian",
    "San Vicente", "Santa Isabel", "Santo Domingo", "Tupax", "Usol", "Villa Bello",
  ],
  "Santiago City": [
    "Abra", "Ambalatungan", "Balintocatoc", "Baluarte", "Bannawag Norte", "Batal",
    "Buenavista", "Cabulay", "Calao East", "Calao West", "Calaocan", "Villa Gonzaga",
    "Centro East", "Centro West", "Divisoria", "Dubinan East", "Dubinan West", "Luna",
    "Mabini", "Malvar", "Nabbuan", "Naggasican", "Patul", "Plaridel", "Rizal",
    "Rosario", "Sagana", "Salvador", "San Andres", "San Isidro", "San Jose", "Sinili",
    "Sinsayon", "Santa Rosa", "Victory Norte", "Victory Sur", "Villasis",
  ],
};

export const barangaysForMunicipality = (municipality: string) =>
  isabelaBarangays[municipality] || [];

/** Loads the selected municipality's current PSGC barangays when it is not
 * already in the local clinic directory. The local list remains an offline
 * fallback for the clinic's most-used areas. */
export const fetchPsgcBarangays = async (municipality: string) => {
  const local = barangaysForMunicipality(municipality);
  if (local.length) return local;
  const psgcLocalityName = {
    "Santiago City": "City of Santiago",
    "Cauayan City": "City of Cauayan",
    "Ilagan City": "City of Ilagan",
  }[municipality] || municipality;
  const response = await fetch(
    `https://psgc.cloud/api/v2/regions/Region%20II%20(Cagayan%20Valley)/provinces/Isabela/cities-municipalities/${encodeURIComponent(psgcLocalityName)}/barangays`,
  );
  if (!response.ok) throw new Error("Barangay directory unavailable");
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record.name || record.description || record.barangay || "");
      }
      return "";
    })
    .map((name) => name.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};
