import { getRoleLabel, formatCurrency } from "../../../lib/helpers";

export default function RoleSelector({ filteredRoles, role, setRole, errors, setErrors, catering }) {
  return (
    <div>
      <label className="label">Select Role</label>
      <div className="flex flex-col gap-2">
        {filteredRoles.map((r) => {
          const slot = catering.slots.find((s) => s.role === r && s.day === 0);
          const isSelected = role === r;
          return (
            <button
              key={r}
              onClick={() => { setRole(r); if(errors.role) setErrors(e=>({...e, role:""})); }}
              className={`flex justify-between items-center px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                isSelected
                  ? "bg-stone-800 border-stone-800 shadow-md text-cream-50"
                  : "bg-white border-cream-200 hover:border-stone-300 text-stone-800"
              }`}
            >
              <span className="font-semibold text-[15px]">{getRoleLabel(r)}</span>
              {slot && <span className={`text-[14px] font-bold ${isSelected ? "text-cream-200" : "text-stone-500"}`}>{formatCurrency(slot.pay)}</span>}
            </button>
          );
        })}
        {filteredRoles.length === 0 && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
            <p className="text-[14px] font-medium text-red-600">
              No roles available for your profile.
            </p>
          </div>
        )}
        {errors.role && <p className="text-[12.5px] text-red-600 font-medium mt-1 ml-1">{errors.role}</p>}
      </div>
    </div>
  );
}
