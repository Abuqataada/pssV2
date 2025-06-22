export const INVESTMENT_CATEGORIES = {
  bronze: {
    name: "Bronze",
    commission: 5,
    color: "amber",
    packages: [500, 1000, 2000],
    description: "Entry Level",
  },
  silver: {
    name: "Silver", 
    commission: 7,
    color: "gray",
    packages: [5000, 10000],
    description: "Growth",
  },
  gold: {
    name: "Gold",
    commission: 9,
    color: "yellow",
    packages: [20000, 50000],
    description: "Professional",
  },
  platinum: {
    name: "Platinum",
    commission: 10,
    color: "indigo",
    packages: [100000, 250000, 500000],
    description: "Executive",
  },
  diamond: {
    name: "Diamond", 
    commission: 11,
    color: "purple",
    packages: [1000000, 2000000, 5000000],
    description: "Premium",
  },
  elite: {
    name: "Elite",
    commission: 12.5,
    color: "red",
    packages: [10000000, 20000000, 30000000, 50000000],
    description: "Ultimate",
  },
} as const;

export const BANKS = [
  { value: "access", label: "Access Bank" },
  { value: "gtb", label: "GTBank" },
  { value: "firstbank", label: "First Bank" },
  { value: "zenith", label: "Zenith Bank" },
  { value: "uba", label: "UBA" },
  { value: "fidelity", label: "Fidelity Bank" },
  { value: "sterling", label: "Sterling Bank" },
  { value: "union", label: "Union Bank" },
  { value: "stanbic", label: "Stanbic IBTC" },
  { value: "fcmb", label: "FCMB" },
] as const;

export const ROI_RATE = 0.1; // 10% monthly ROI
