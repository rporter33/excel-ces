"use client";

import { useActionState } from "react";
import { updateProjectForm } from "@/lib/actions";
import { Loader2 } from "lucide-react";

interface User { id: string; name: string; role: string }

interface Props {
  projectId: string;
  users: User[];
  initial: {
    customerName: string;
    address: string;
    city: string;
    zip: string;
    phonePrimary: string;
    phoneSecondary: string;
    email: string;
    poNumber: string;
    insuranceProvider: string;
    claimNumber: string;
    extendedWarranty: boolean;
    notes: string;
    pmId: string;
  };
}

export function EditForm({ projectId, users, initial }: Props) {
  const [errors, formAction, pending] = useActionState(updateProjectForm, null);

  return (
    <>
      {errors?._form && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors._form.join(" ")}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={projectId} />

        {/* Customer Info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Customer Information
          </h2>

          <div>
            <label htmlFor="customerName" className="label">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              required
              autoCapitalize="words"
              defaultValue={initial.customerName}
              className="input-field"
            />
            {errors?.customerName && (
              <p className="mt-1 text-xs text-red-600">{errors.customerName.join(", ")}</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className="label">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              defaultValue={initial.address}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="city" className="label">City</label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={initial.city}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="zip" className="label">Zip</label>
              <input
                id="zip"
                name="zip"
                type="text"
                inputMode="numeric"
                defaultValue={initial.zip}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phonePrimary" className="label">Primary Phone</label>
            <input
              id="phonePrimary"
              name="phonePrimary"
              type="tel"
              defaultValue={initial.phonePrimary}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="phoneSecondary" className="label">Secondary Phone</label>
            <input
              id="phoneSecondary"
              name="phoneSecondary"
              type="tel"
              defaultValue={initial.phoneSecondary}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={initial.email}
              className="input-field"
            />
            {errors?.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.join(", ")}</p>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Job Details
          </h2>

          <div>
            <label htmlFor="pmId" className="label">Project Manager</label>
            <select id="pmId" name="pmId" defaultValue={initial.pmId} className="input-field">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="poNumber" className="label">PO Number</label>
            <input
              id="poNumber"
              name="poNumber"
              type="text"
              defaultValue={initial.poNumber}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="insuranceProvider" className="label">
              Insurance Provider &amp; Claim #
            </label>
            <input
              id="insuranceProvider"
              name="insuranceProvider"
              type="text"
              defaultValue={initial.insuranceProvider}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="extendedWarranty"
              name="extendedWarranty"
              type="checkbox"
              defaultChecked={initial.extendedWarranty}
              className="h-5 w-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
            />
            <label htmlFor="extendedWarranty" className="text-sm text-gray-700">
              Extended Warranty
            </label>
          </div>

          <div>
            <label htmlFor="notes" className="label">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initial.notes}
              className="input-field"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full text-base disabled:opacity-60"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </>
  );
}
