export const SIZE_GUIDE: Record<string, { label: string; columns: string[]; rows: { size: string; values: string[] }[] }> = {
  tops: {
    label: "상의",
    columns: ["총장", "어깨", "가슴", "소매"],
    rows: [
      { size: "S", values: ["65", "43", "96", "60"] },
      { size: "M", values: ["67", "45", "100", "61"] },
      { size: "L", values: ["69", "47", "104", "62"] },
      { size: "XL", values: ["71", "49", "108", "63"] },
      { size: "XXL", values: ["73", "51", "112", "64"] },
    ],
  },
  outer: {
    label: "아우터",
    columns: ["총장", "어깨", "가슴", "소매"],
    rows: [
      { size: "S", values: ["68", "44", "100", "62"] },
      { size: "M", values: ["70", "46", "104", "63"] },
      { size: "L", values: ["72", "48", "108", "64"] },
      { size: "XL", values: ["74", "50", "112", "65"] },
    ],
  },
  pants: {
    label: "바지",
    columns: ["총장", "허리", "엉덩이", "허벅지"],
    rows: [
      { size: "S", values: ["98", "72", "94", "56"] },
      { size: "M", values: ["100", "76", "98", "58"] },
      { size: "L", values: ["102", "80", "102", "60"] },
      { size: "XL", values: ["104", "84", "106", "62"] },
    ],
  },
  shoes: {
    label: "신발",
    columns: ["한국(mm)", "US", "UK", "EU"],
    rows: [
      { size: "250", values: ["250", "7", "6.5", "40"] },
      { size: "255", values: ["255", "7.5", "7", "40.5"] },
      { size: "260", values: ["260", "8", "7.5", "41"] },
      { size: "265", values: ["265", "8.5", "8", "42"] },
      { size: "270", values: ["270", "9", "8.5", "42.5"] },
      { size: "275", values: ["275", "9.5", "9", "43"] },
      { size: "280", values: ["280", "10", "9.5", "44"] },
    ],
  },
  default: {
    label: "일반",
    columns: ["총장", "어깨/가슴", "허리", "기타"],
    rows: [
      { size: "S", values: ["65", "96", "72", "-"] },
      { size: "M", values: ["67", "100", "76", "-"] },
      { size: "L", values: ["69", "104", "80", "-"] },
      { size: "XL", values: ["71", "108", "84", "-"] },
    ],
  },
};
