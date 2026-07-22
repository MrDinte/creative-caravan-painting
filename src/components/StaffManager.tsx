"use client";

import { useActionState, useState } from "react";
import { Badge, Button, Field, inputClass } from "./ui";
import {
  createStaffAction,
  deactivateStaffAction,
  setStaffLoginAction,
  setStaffPayrollAction,
  updateStaffAction,
  type FormState,
} from "@/app/actions";
import { ACCESS_LEVEL_LABELS, formatAud } from "@/lib/types";
import type { AccessLevel, Staff } from "@/lib/types";

const initialState: FormState = { ok: false, message: "" };

export function StaffManager({ staff }: { staff: Staff[] }) {
  const [editing, setEditing] = useState<Staff | null>(null);

  const [addState, addAction, adding] = useActionState(
    createStaffAction,
    initialState
  );
  const [editState, editAction, saving] = useActionState(
    updateStaffAction,
    initialState
  );
  const [loginState, loginAction, savingLogin] = useActionState(
    setStaffLoginAction,
    initialState
  );
  const [payState, payAction, savingPay] = useActionState(
    setStaffPayrollAction,
    initialState
  );

  // A successful edit closes the edit form, which would unmount the message
  // rendered inside it — so the latest result is held here and shown above
  // both forms instead.
  const [notice, setNotice] = useState<FormState | null>(null);

  const [lastEdit, setLastEdit] = useState(editState);
  if (editState !== lastEdit) {
    setLastEdit(editState);
    if (editState.message) setNotice(editState);
    if (editState.ok && editing) setEditing(null);
  }

  const [lastAdd, setLastAdd] = useState(addState);
  if (addState !== lastAdd) {
    setLastAdd(addState);
    if (addState.message) setNotice(addState);
  }

  const [lastLogin, setLastLogin] = useState(loginState);
  if (loginState !== lastLogin) {
    setLastLogin(loginState);
    if (loginState.message) setNotice(loginState);
  }

  const [lastPay, setLastPay] = useState(payState);
  if (payState !== lastPay) {
    setLastPay(payState);
    if (payState.message) setNotice(payState);
  }

  const active = staff.filter((s) => s.active);
  const inactive = staff.filter((s) => !s.active);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900">
          Team ({active.length} active)
        </h2>

        <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {staff.length === 0 && (
            <li className="p-5 text-slate-600">
              No staff yet — add your first team member.
            </li>
          )}
          {staff.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
              data-testid={`staff-row-${s.name}`}
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {s.name}{" "}
                  {!s.active && <Badge tone="slate">Inactive</Badge>}{" "}
                  {s.accessLevel === "admin" && s.hasLogin && (
                    <Badge tone="brand">Full access</Badge>
                  )}
                </p>
                <p className="text-sm text-slate-500">{s.role || "—"}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {s.hasLogin ? (
                    <>
                      Login <code className="font-mono">{s.username}</code>
                    </>
                  ) : (
                    <span className="text-amber-700">No login yet</span>
                  )}
                  {" · "}
                  {s.hourlyRateCents > 0
                    ? `${formatAud(s.hourlyRateCents)}/h, OT ×${s.overtimeMultiplier} after ${s.overtimeAfterHours} h`
                    : "No pay rate set"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(s)}
                  className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand"
                  data-testid={`edit-staff-${s.name}`}
                >
                  Edit
                </button>
                {s.active && (
                  <form action={deactivateStaffAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="min-h-[40px] rounded-lg px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      aria-label={`Deactivate ${s.name}`}
                    >
                      Deactivate
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>

        {inactive.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Inactive staff stay on past jobs and tasks, but no longer appear in
            allocation dropdowns.
          </p>
        )}
      </div>

      <div>
        <div className="sticky top-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {editing ? `Edit ${editing.name}` : "Add a team member"}
          </h2>

          {notice?.message && (
            <p
              role="status"
              className={`mt-3 rounded-lg px-4 py-2 text-sm ${
                notice.ok
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-rose-50 text-rose-800"
              }`}
            >
              {notice.message}
            </p>
          )}

          {editing ? (
            <form
              action={editAction}
              className="mt-4 space-y-4"
              key={editing.id}
              data-testid="staff-edit-form"
            >
              <input type="hidden" name="id" value={editing.id} />
              <Field label="Name" required>
                <input
                  name="name"
                  required
                  defaultValue={editing.name}
                  className={inputClass}
                />
              </Field>
              <Field label="Role">
                <input
                  name="role"
                  defaultValue={editing.role}
                  className={inputClass}
                  placeholder="Panel & Prep"
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editing.active}
                  className="h-5 w-5 rounded border-slate-300 accent-teal-700"
                />
                Active — show in allocation dropdowns
              </label>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="!min-h-[44px] flex-1 !py-2"
                  data-testid="save-staff-submit"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="!min-h-[44px] !py-2"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          {editing && (
            <>
              <hr className="my-5 border-slate-200" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Login
              </h3>
              <form
                action={loginAction}
                className="mt-3 space-y-3"
                key={`login-${editing.id}`}
                data-testid="staff-login-form"
              >
                <input type="hidden" name="id" value={editing.id} />
                <Field label="Username" required>
                  <input
                    name="username"
                    required
                    defaultValue={editing.username}
                    className={`${inputClass} font-mono`}
                    placeholder="jake"
                    autoComplete="off"
                  />
                </Field>
                <Field
                  label="Password"
                  hint={
                    editing.hasLogin
                      ? "Leave blank to keep the current password"
                      : "At least 8 characters"
                  }
                  required={!editing.hasLogin}
                >
                  <input
                    name="password"
                    type="password"
                    className={inputClass}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Access level">
                  <select
                    name="accessLevel"
                    className={inputClass}
                    defaultValue={editing.accessLevel}
                  >
                    {(Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[]).map(
                      (lvl) => (
                        <option key={lvl} value={lvl}>
                          {ACCESS_LEVEL_LABELS[lvl]}
                        </option>
                      )
                    )}
                  </select>
                </Field>
                <Button
                  type="submit"
                  disabled={savingLogin}
                  className="w-full !min-h-[44px] !py-2"
                  data-testid="save-login-submit"
                >
                  {savingLogin ? "Saving…" : "Save login"}
                </Button>
              </form>

              <hr className="my-5 border-slate-200" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Pay
              </h3>
              <form
                action={payAction}
                className="mt-3 space-y-3"
                key={`pay-${editing.id}`}
                data-testid="staff-pay-form"
              >
                <input type="hidden" name="id" value={editing.id} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Hourly rate" required>
                    <input
                      name="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={(editing.hourlyRateCents / 100).toFixed(2)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Overtime ×" required hint="e.g. 2.5">
                    <input
                      name="overtimeMultiplier"
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      defaultValue={editing.overtimeMultiplier}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="OT after (h/week)" required>
                    <input
                      name="overtimeAfterHours"
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      defaultValue={editing.overtimeAfterHours}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Unpaid break (min)" required>
                    <input
                      name="defaultBreakMinutes"
                      type="number"
                      step="5"
                      min="0"
                      required
                      defaultValue={editing.defaultBreakMinutes}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Button
                  type="submit"
                  disabled={savingPay}
                  className="w-full !min-h-[44px] !py-2"
                  data-testid="save-pay-submit"
                >
                  {savingPay ? "Saving…" : "Save pay settings"}
                </Button>
              </form>
            </>
          )}

          {!editing && (
            <form
              action={addAction}
              className="mt-4 space-y-4"
              key={addState.ok ? "added" : "new"}
              data-testid="staff-add-form"
            >
              <Field label="Name" required>
                <input
                  name="name"
                  required
                  className={inputClass}
                  placeholder="Sam Rivers"
                />
              </Field>
              <Field label="Role">
                <input
                  name="role"
                  className={inputClass}
                  placeholder="Panel & Prep"
                />
              </Field>

              <Button
                type="submit"
                disabled={adding}
                className="w-full !min-h-[44px] !py-2"
                data-testid="add-staff-submit"
              >
                {adding ? "Adding…" : "Add to team"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
