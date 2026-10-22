
export const SCHOOL_CLASSES = [
  { value: "Pre-Nursery", label: "Pre-Nursery" },
  { value: "Nursery", label: "Nursery" },
  { value: "LKG", label: "LKG" },
  { value: "UKG", label: "UKG" },
  ...Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: `Class ${index + 1}`,
  })),
] as const;

export const VALID_CLASS_NAMES = SCHOOL_CLASSES.map(
  (schoolClass) => schoolClass.value
);

export function isValidSchoolClass(value: string): boolean {
  return VALID_CLASS_NAMES.some(
    (className) => className === value
  );
}
