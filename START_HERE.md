# SmartServe: first-use walkthrough

This local prototype starts with **no patient, appointment, consultation, triage, or audit records**. Medicine catalog items remain as clinic setup data so pharmacy can receive stock and doctors can view availability.

## Explore the complete workflow

1. **Patient — create an account**
   - Open **Patient Mobile App**.
   - Choose **Register**, complete name, birth date, barangay, address, mobile number, and password.
   - The account is stored only in this browser's local storage. Sign in again using the same mobile number and password.

2. **Patient — make an online reservation**
   - Choose **Book**, select a service and date, pin the residence location, then confirm.
   - The booking is `Scheduled`; it has no queue number yet.

3. **Staff — check in scheduled patient**
   - Open **Staff / Queue → Scheduled Check-in**.
   - Verify the patient privately and enter the issued physical number from `001` to `100`.
   - The patient moves to `Waiting for Triage`.

4. **Staff — register a new walk-in**
   - Open **Onsite Intake & Triage → Register new patient**.
   - Enter the complete profile and address. The address is automatically pinned on the map; verify or correct it.
   - Save the profile, then open **Add registered walk-in**.

5. **Staff — add a registered walk-in**
   - Search by name, Patient ID, mobile number, or birth date.
   - Select service, enter visit reason and the issued queue number `001–100`.
   - The patient joins `Waiting for Triage`.

6. **Staff — triage and call**
   - In **Vitals & triage handoff**, record vitals, allergies, complaint, and priority; send to doctor.
   - In **Queue Control**, call the next number. The TV board displays numbers only.
   - Confirm the patient has arrived at the doctor.

7. **Doctor — complete consultation**
   - Open **Doctor**, select the handed-off patient, review triage, write the consultation record, and complete it.
   - Doctor medicine availability is read-only.

8. **Pharmacy — receive stock or dispense**
   - Use **Search & update medicine stock** to select a medicine and add the received quantity.
   - The Doctor screen immediately reflects the new stock.
   - For a completed consultation, verify the patient and record actual quantity dispensed.

9. **Admin — review after the flow**
   - Open **Admin** to review workload, appointments, records, inventory, and disease trends. Current dashboard charts are illustrative until the admin pages are fully connected to local prototype records.

## Queue-number policy

- Enter `001` through `100`.
- A number cannot be assigned while active in triage, doctor queue, called, or consultation.
- A completed, cancelled, or no-show number can be reused.
- The public monitor never displays patient names.

## Current local-only limits

- Patient passwords are local prototype data, not production authentication.
- Data exists only in this browser/device and can be removed through browser local-storage controls.
- Address search uses a public map lookup with an estimated fallback pin; production needs a managed geocoding service.
- Do not enter real patient data until secure backend, encryption, proper authentication, access controls, audit immutability, and privacy compliance are complete.
