
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

const ROMAN_CLASS_NUMBERS: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
  xi: 11,
  xii: 12,
};

function classSortKey(value: string): [number, number, string] {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "");
  const classMatch = normalized.match(/^(?:class)?(\d+|i{1,3}|iv|v|vi{0,3}|ix|x|xi|xii)$/);
  if (classMatch) {
    const classNumber =
      Number(classMatch[1]) || ROMAN_CLASS_NUMBERS[classMatch[1]];
    if (classNumber >= 1 && classNumber <= 12) {
      return [0, classNumber, ""];
    }
  }

  const earlyYears = ["prenursery", "nursery", "lkg", "ukg"];
  const earlyYearIndex = earlyYears.indexOf(normalized);
  if (earlyYearIndex !== -1) return [1, earlyYearIndex, ""];

  return [2, 0, normalized];
}

export function compareSchoolClasses(left: string, right: string): number {
  const leftKey = classSortKey(left);
  const rightKey = classSortKey(right);

  return (
    leftKey[0] - rightKey[0] ||
    leftKey[1] - rightKey[1] ||
    leftKey[2].localeCompare(rightKey[2], undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
}
