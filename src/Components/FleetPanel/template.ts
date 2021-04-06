export type Dimension = {
  id: string,
  name: string,
  maxVal: number | "-" | null,
  minVal: number | "-" | null,
  status: "EDIT" | null,
  children: Dimension[],
  _parent?: Dimension,
}

export const TEMPLATE: Dimension[] = [
  {
    id: "1",
    name: "Alto",
    maxVal: 34.0,
    minVal: 26.0,
    status: null,
    children: [],
  },
  {
    id: "2",
    name: "Ancho",
    maxVal: 33.0,
    minVal: 26.0,
    status: null,
    children: [],
  },
  {
    id: "3",
    name: "qR",
    maxVal: 15.0,
    minVal: 6.5,
    status: null,
    children: [],
  },
  {
    id: "4",
    name: "Diametro",
    maxVal: null,
    minVal: null,
    status: null,
    children: [
      {
        id: "4-1",
        name: "Alstom100",
        maxVal: "-",
        minVal: 776.0,
        status: null,
        children: [],
      },
      {
        id: "4-2",
        name: "Alstom300",
        maxVal: "-",
        minVal: 779.0,
        status: null,
        children: [],
      },
      {
        id: "4-3",
        name: "CNR",
        maxVal: "-",
        minVal: 790.0,
        status: null,
        children: [],
      },
      {
        id: "4-4",
        name: "FIAT",
        maxVal: "-",
        minVal: 776.0,
        status: null,
        children: [],
      },
      {
        id: "4-5",
        name: "GEE",
        maxVal: "-",
        minVal: 830.0,
        status: null,
        children: [],
      },
      {
        id: "4-6",
        name: "Mitsubishi",
        maxVal: "-",
        minVal: 790.0,
        status: null,
        children: [],
      },
      {
        id: "4-7",
        name: "CAF6000",
        maxVal: "-",
        minVal: 790.0,
        status: null,
        children: [],
      }
    ]
  },
  {
    id: "5",
    name: "Trocha",
    maxVal: 1363.0,
    minVal: 1358.0,
    status: null,
    children: [],
  },
  {
    id: "6",
    name: "Dif. Ancho de Pestaña",
    maxVal: 5.0,
    minVal: "-",
    status: null,
    children: [],
  },
  {
    id: "7",
    name: "Dif. de Diametro Rueda - Mismo Eje",
    maxVal: 3.0,
    minVal: "-",
    status: null,
    children: [],
  },
  {
    id: "8",
    name: "Dif. de Diametro Rueda - Mismo Bogie",
    maxVal: null,
    minVal: null,
    status: null,
    children: [
      {
        id: "8-1",
        name: "Alstom100",
        maxVal: 5.0,
        minVal: "-",
        status: null,
        children: [],
      },
      {
        id: "8-2",
        name: "Alstom300",
        maxVal: 5.0,
        minVal: "-",
        status: null,
        children: [],
      },
      {
        id: "8-3",
        name: "CNR",
        maxVal: 5.0,
        minVal: "-",
        status: null,
        children: [],
      },
      {
        id: "8-4",
        name: "FIAT",
        maxVal: 3.0,
        minVal: "-",
        status: null,
        children: [],
      },
      {
        id: "8-5",
        name: "GEE",
        maxVal: 10.0,
        minVal: "-",
        status: null,
        children: [],
      },
      {
        id: "8-6",
        name: "Mitsubishi",
        maxVal: 10.0,
        minVal: "-",
        status: null,
        children: [],
      },
      {
        id: "8-7",
        name: "CAF6000",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "8-7-1",
            name: "Motriz",
            maxVal: 8.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "8-7-2",
            name: "Remolque",
            maxVal: 15.0,
            minVal: "-",
            status: null,
            children: [],
          }
        ]
      }
    ]
  },
  {
    id: "9",
    name: "Dif. de Diametro Rueda - Mismo Coche",
    maxVal: null,
    minVal: null,
    status: null,
    children: [
      {
        id: "9-1",
        name: "Alstom100",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "9-1-1",
            name: "Motriz",
            maxVal: 10.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "9-1-2",
            name: "Remolque",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "9-2",
        name: "Alstom300",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "9-2-1",
            name: "Motriz",
            maxVal: 10.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "9-2-2",
            name: "Remolque",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "9-3",
        name: "CNR",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "9-3-1",
            name: "Motriz",
            maxVal: 10.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "9-3-2",
            name: "Remolque",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "9-4",
        name: "FIAT",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "9-4-1",
            name: "Motriz",
            maxVal: 5.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "9-4-2",
            name: "Remolque",
            maxVal: 10.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "9-5",
        name: "GEE",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "9-5-1",
            name: "Motriz",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "9-5-2",
            name: "Remolque",
            maxVal: 18.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "9-6",
        name: "Mitsubishi",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "9-6-1",
            name: "Motriz",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "9-7",
        name: "CAF6000",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "9-7-1",
            name: "Motriz",
            maxVal: 10.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "9-7-2",
            name: "Remolque",
            maxVal: 15.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
    ]
  },
  {
    id: "10",
    name: "Dif. de Diametro Rueda - Mismo Modulo",
    maxVal: null,
    minVal: null,
    status: null,
    children: [
      {
        id: "10-1",
        name: "Alstom100",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "10-1-1",
            name: "Motriz",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "10-1-2",
            name: "Motriz - Remolque",
            maxVal: 18.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "10-2",
        name: "Alstom300",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "10-2-1",
            name: "Motriz",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "10-2-2",
            name: "Motriz - Remolque",
            maxVal: 18.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "10-3",
        name: "CNR",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "10-3-1",
            name: "Motriz",
            maxVal: 13.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "10-3-2",
            name: "Motriz - Remolque",
            maxVal: 18.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "10-4",
        name: "FIAT",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "10-4-1",
            name: "Motriz",
            maxVal: 10.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "10-4-2",
            name: "Motriz - Remolque",
            maxVal: 18.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "10-5",
        name: "GEE",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "10-5-1",
            name: "Motriz",
            maxVal: 18.0,
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "10-5-2",
            name: "Motriz - Remolque",
            maxVal: 22.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "10-6",
        name: "Mitsubishi",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "10-6-1",
            name: "Motriz",
            maxVal: 30.0,
            minVal: "-",
            status: null,
            children: [],
          },
        ]
      },
      {
        id: "10-7",
        name: "CAF6000",
        maxVal: null,
        minVal: null,
        status: null,
        children: [
          {
            id: "10-7-1",
            name: "Motriz",
            maxVal: "-",
            minVal: "-",
            status: null,
            children: [],
          },
          {
            id: "10-7-2",
            name: "Remolque",
            maxVal: "-",
            minVal: "-",
            status: null,
            children: [],
          }
        ]
      },
    ]
  }
]
