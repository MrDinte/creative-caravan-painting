import { Field, inputClass } from "./ui";
import { JOB_LOCATIONS, JOB_LOCATION_LABELS } from "@/lib/types";
import type { Staff } from "@/lib/types";

/** Staff allocation dropdown, shared by the job forms. */
export function AssigneeField({
  staff,
  defaultValue = "",
  label = "Allocated to",
  name = "assignedTo",
}: {
  staff: Staff[];
  defaultValue?: string;
  label?: string;
  name?: string;
}) {
  return (
    <Field label={label} hint={staff.length ? undefined : "Add staff under Admin → Staff first."}>
      <select name={name} className={inputClass} defaultValue={defaultValue}>
        <option value="">Unallocated</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.role ? ` — ${s.role}` : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function LocationField({
  defaultValue = "workshop",
  name = "location",
}: {
  defaultValue?: string;
  name?: string;
}) {
  return (
    <Field label="Location">
      <select name={name} className={inputClass} defaultValue={defaultValue}>
        {JOB_LOCATIONS.map((l) => (
          <option key={l} value={l}>
            {JOB_LOCATION_LABELS[l]}
          </option>
        ))}
      </select>
    </Field>
  );
}
