export const inputBase =
  "w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-[#8b6f47] focus:border-transparent resize-none";
const inputCreate = "text-gray-900 placeholder-gray-400";
const inputEdit = "text-[#5d4e37]";
const labelCreate = "text-gray-700";
const labelEdit = "text-[#5d4e37]";

export type PlaceFormVariant = "create" | "edit";

export function getPlaceFormClasses(variant: PlaceFormVariant) {
  const isEdit = variant === "edit";
  return {
    labelCls: isEdit ? labelEdit : labelCreate,
    inputCls: `${inputBase} ${isEdit ? inputEdit : inputCreate}`,
  };
}
