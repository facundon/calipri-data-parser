export type Fleet = {
  id: string,
  fleet: string,
  profiles: string[]
  reference: string,
  module: string,
}

export const FLEETS_TEMPLATE: Fleet[] = [
  {
    id: "1",
    fleet: "CNR",
    profiles: ["ORE"],
    reference: "R",
    module: "2",
  },
  {
    id: "2",
    fleet: "FIAT",
    profiles: ["ORE", "CDE"],
    reference: "C",
    module: "2",
  }
]