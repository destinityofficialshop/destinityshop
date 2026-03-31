export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  badge: string;
  stock: number;
};

export const seedProducts: Product[] = [
  {
    id: "nebula-speaker",
    name: "Nebula Speaker",
    category: "Audio",
    description: "Altavoz premium para escritorio con presencia limpia y sonido amplio.",
    price: 129,
    badge: "Best seller",
    stock: 8
  },
  {
    id: "halo-lamp",
    name: "Halo Lamp",
    category: "Living",
    description: "Lampara ambiental de luz calida pensada para setups y espacios creativos.",
    price: 89,
    badge: "Nuevo",
    stock: 12
  },
  {
    id: "orbit-stand",
    name: "Orbit Stand",
    category: "Workspace",
    description: "Soporte metalico para auriculares y accesorios con tacto premium.",
    price: 59,
    badge: "Top rated",
    stock: 15
  }
];

export const products = seedProducts;
