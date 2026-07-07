/**
 * Script para sembrar la carta oficial de Mister Pepe II en Firestore
 */

const fs = require('fs');
const path = require('path');

// 1. Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: No se encontró el archivo .env.local en la carpeta web-admin.');
  process.exit(1);
}

console.log('📖 Cargando variables de entorno desde .env.local...');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    config[key] = value.trim();
  }
});

// 2. Inicializar Firebase
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
require('firebase/compat/firestore');

const firebaseConfig = {
  apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: config.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('🔥 Inicializando Firebase con el proyecto:', firebaseConfig.projectId);
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Lista oficial de platos de la carta de Mister Pepe II
const officialProducts = [
  // --- POLLO A LA BRASA ---
  {
    id_ref: 'p1',
    nombre: '1/4 Pollo a la Brasa',
    descripcion: 'Con papas fritas, ensalada clásica y cremas',
    precio: 13.50,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
    isDestacado: true
  },
  {
    id_ref: 'p2',
    nombre: '1/4 Pollo a la Brasa + Chaufa',
    descripcion: 'Con papas fritas, ensalada, cremas y chaufa',
    precio: 15.50,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p3',
    nombre: '1/8 Pollo a la Brasa (Solo)',
    descripcion: 'Con papas fritas, ensalada clásica y cremas',
    precio: 9.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p4',
    nombre: '1/4 Pollo a la Brasa a lo Pobre',
    descripcion: 'Con papas, ensalada, huevo frito, plátano frito y cremas',
    precio: 22.50,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p5',
    nombre: 'Caja China con Chaufa',
    descripcion: 'Porción de caja china crujiente con chaufa, papas y ensalada',
    precio: 18.50,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p6',
    nombre: 'Caja China 4 Presas',
    descripcion: 'Caja china dorada y crujiente (4 presas) con acompañamiento',
    precio: 15.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p7',
    nombre: 'Caja China 6 Presas',
    descripcion: 'Caja china dorada y crujiente (6 presas) con acompañamiento',
    precio: 20.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },

  // --- POLLO BROASTER ---
  {
    id_ref: 'p8',
    nombre: '1/4 Pollo Broaster',
    descripcion: 'Con papas fritas, ensalada clásica y cremas',
    precio: 16.00,
    categoria: 'parrillas', // we keep in parrillas for web interface categories
    imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
    isDestacado: true
  },
  {
    id_ref: 'p9',
    nombre: '1/4 Pollo Broaster + Chaufa',
    descripcion: 'Con papas fritas, ensalada, cremas y chaufa',
    precio: 18.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p10',
    nombre: '1 Piernita Broaster',
    descripcion: 'Con papas fritas, ensalada clásica y cremas',
    precio: 11.50,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p11',
    nombre: '1 Piernita/Entrepiernita + Chaufa',
    descripcion: 'Con papas fritas, ensalada, cremas y chaufa',
    precio: 14.50,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },

  // --- ALITAS (piqueos) ---
  {
    id_ref: 'p12',
    nombre: 'Alitas Broaster',
    descripcion: 'Porción de alitas crujientes con papas y cremas',
    precio: 15.00,
    categoria: 'piqueos',
    imagen: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p13',
    nombre: 'Alitas a la BBQ',
    descripcion: 'Con papas fritas, cremas y salsa dulce barbacoa',
    precio: 16.00,
    categoria: 'piqueos',
    imagen: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p14',
    nombre: 'Alitas Acevichadas',
    descripcion: 'Con papas fritas, cremas y salsa acevichada especial',
    precio: 16.00,
    categoria: 'piqueos',
    imagen: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p15',
    nombre: 'Chaufa con Alitas Acevichadas',
    descripcion: 'Arroz chaufa con porción de alitas acevichadas',
    precio: 21.00,
    categoria: 'piqueos',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p16',
    nombre: 'Chaufa con Alitas a la BBQ',
    descripcion: 'Arroz chaufa con alitas en salsa BBQ dulce',
    precio: 21.00,
    categoria: 'piqueos',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p17',
    nombre: 'Chaufa con Alitas',
    descripcion: 'Arroz chaufa clásico con alitas broaster',
    precio: 17.00,
    categoria: 'piqueos',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },

  // --- EXTRAS ---
  {
    id_ref: 'p18',
    nombre: 'Chaufón',
    descripcion: 'Porción de arroz chaufa familiar',
    precio: 12.00,
    categoria: 'guarniciones',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p19',
    nombre: 'Super Chaufón',
    descripcion: 'Con chorizo, huevo frito y abundante sabor',
    precio: 14.00,
    categoria: 'guarniciones',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p20',
    nombre: 'Tallarín Saltado',
    descripcion: 'Salteado criollo al wok con carne o pollo',
    precio: 13.00,
    categoria: 'guarniciones',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p21',
    nombre: 'Lomo Saltado',
    descripcion: 'Jugoso lomo saltado con papas fritas y arroz',
    precio: 13.00,
    categoria: 'guarniciones',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p22',
    nombre: 'Chaufa con Lomo',
    descripcion: 'Fusión de arroz chaufa y lomo saltado jugoso',
    precio: 17.00,
    categoria: 'guarniciones',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p23',
    nombre: 'Pollo a la Plancha',
    descripcion: 'Pechuga de pollo a la plancha con papas y ensalada',
    precio: 15.00,
    categoria: 'guarniciones',
    imagen: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },

  // --- COMBOS ---
  {
    id_ref: 'p24',
    nombre: 'Combo 1: Pollo Entero Brasa',
    descripcion: '1 pollo entero a la brasa + papas + chaufón + ensalada + gaseosa/chicha 1.5L',
    precio: 67.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p25',
    nombre: 'Combo 2: 4/4 Pollo Broaster',
    descripcion: '4/4 de pollo broaster + papas + chaufón + ensalada + gaseosa/chicha 1.5L',
    precio: 72.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p26',
    nombre: 'Combo 3: 1/4 Broaster + Chaufa',
    descripcion: '1/4 de pollo broaster + chaufita + gaseosa personal',
    precio: 20.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p27',
    nombre: 'Combo 4: 1/4 Brasa + Chaufa',
    descripcion: '1/4 de pollo a la brasa + chaufita + gaseosa personal',
    precio: 18.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p28',
    nombre: 'Combo 5: Piernita Broaster + Chaufa',
    descripcion: '1 piernita broaster + chaufita + gaseosa personal',
    precio: 16.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p29',
    nombre: 'Combo 6: 1/8 Brasa + Chaufa',
    descripcion: '1/8 de pollo a la brasa + chaufita + gaseosa personal',
    precio: 14.50,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p30',
    nombre: 'Combo Pepsi: Pollo Entero + Pepsi 1.5L',
    descripcion: 'Pollo entero a la brasa + papas + ensalada + cremas + Pepsi 1.5L',
    precio: 52.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p31',
    nombre: 'Combo Pepsi: Pollo Entero + Pepsi 1L',
    descripcion: 'Pollo entero a la brasa + papas + ensalada + cremas + Pepsi 1L',
    precio: 46.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p32',
    nombre: 'Combo Pepsi: 1/2 Pollo + Pepsi 1L',
    descripcion: 'Medio pollo a la brasa + papas + ensalada + cremas + Pepsi 1L',
    precio: 30.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p33',
    nombre: 'Combo Pepsi: 1/2 Pollo (Económico)',
    descripcion: 'Medio pollo + papas + ensalada + Pepsi 1L',
    precio: 28.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p34',
    nombre: 'Combo Pepsi: 4/4 Broaster + Chaufa',
    descripcion: '4/4 pollo broaster + papas + chaufa + Pepsi 1.5L',
    precio: 60.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p35',
    nombre: 'Combo Pepsi: 4/4 Broaster + Ensalada',
    descripcion: '4/4 pollo broaster + papas + ensalada + Pepsi 1.5L',
    precio: 56.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p36',
    nombre: 'Combo Pepsi: 2/4 Broaster + Chaufa',
    descripcion: '2/4 pollo broaster + papas + chaufa + Pepsi 1L',
    precio: 31.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p37',
    nombre: 'Combo Pepsi: 2/4 Broaster + Ensalada',
    descripcion: '2/4 pollo broaster + papas + ensalada + Pepsi 1L',
    precio: 29.00,
    categoria: 'parrillas',
    imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },

  // --- BEBIDAS ---
  {
    id_ref: 'p38',
    nombre: 'Chicha Morada Jarra',
    descripcion: 'Bebida natural de maíz morado, piña y limón',
    precio: 5.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p39',
    nombre: 'Maracuyá Jarra',
    descripcion: 'Refrescante jugo natural de maracuyá',
    precio: 5.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p40',
    nombre: 'Limonada Frozen',
    descripcion: 'Limonada helada estilo frozen batida al instante',
    precio: 9.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p41',
    nombre: 'Limonada Tibia',
    descripcion: 'Limonada tibia ideal para acompañar',
    precio: 6.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p42',
    nombre: 'Jarra de Mate',
    descripcion: 'Mate caliente de hierbas seleccionadas',
    precio: 6.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p43',
    nombre: 'Taza Mate o Café',
    descripcion: 'Una taza de mate o café caliente',
    precio: 2.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p44',
    nombre: 'Gaseosa Personal',
    descripcion: 'Inca Cola / Coca Cola / Pepsi personal',
    precio: 2.50,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p45',
    nombre: 'Gaseosa 600ml',
    descripcion: 'Inca Cola / Coca Cola / Pepsi de 600ml',
    precio: 3.50,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p46',
    nombre: 'Gaseosa 1L',
    descripcion: 'Inca Cola / Coca Cola / Pepsi de 1L',
    precio: 6.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p47',
    nombre: 'Gaseosa 1.5L',
    descripcion: 'Inca Cola / Coca Cola / Pepsi de 1.5L',
    precio: 9.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p48',
    nombre: 'Gaseosa 2.25L',
    descripcion: 'Coca Cola 2.25L helada',
    precio: 12.50,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p49',
    nombre: 'Pepsi 500ml',
    descripcion: 'Pepsi de 500ml helada',
    precio: 2.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p50',
    nombre: 'Pepsi 1L',
    descripcion: 'Pepsi de 1L helada',
    precio: 3.50,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p51',
    nombre: 'Pepsi 1.5L',
    descripcion: 'Pepsi de 1.5L helada',
    precio: 5.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p52',
    nombre: 'Big Cola 500ml',
    descripcion: 'Big Cola personal',
    precio: 2.50,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p53',
    nombre: 'Big Cola 1L',
    descripcion: 'Big Cola de 1L',
    precio: 3.50,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p54',
    nombre: 'Big Cola 1.5L',
    descripcion: 'Big Cola de 1.5L',
    precio: 5.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p55',
    nombre: 'Big Cola 3L',
    descripcion: 'Big Cola de 3L familiar',
    precio: 9.00,
    categoria: 'bebidas',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },

  // --- POSTRES ---
  {
    id_ref: 'p56',
    nombre: 'Gelatina',
    descripcion: 'Delicioso vasito de gelatina de fresa/piña',
    precio: 2.00,
    categoria: 'postres',
    imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p57',
    nombre: 'Flan',
    descripcion: 'Flan casero con caramelo',
    precio: 3.00,
    categoria: 'postres',
    imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  },
  {
    id_ref: 'p58',
    nombre: 'Marquesa',
    descripcion: 'Postre frío de chocolate y galletas maría',
    precio: 5.00,
    categoria: 'postres',
    imagen: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=200',
    isDestacado: false
  }
];

// Iniciar sesión para poder escribir en Firestore
console.log('👤 Iniciando sesión para sembrar datos...');
auth.signInWithEmailAndPassword('admin@elbrasero.com', 'admin123456')
  .then(async (userCredential) => {
    console.log('✅ Autenticado como:', userCredential.user.email);
    console.log('🌱 Sembrando platos oficiales en Firestore...');

    const collectionRef = db.collection('products');
    
    // Primero, limpiar la colección actual de productos
    console.log('🗑️  Limpiando productos existentes...');
    const snapshot = await collectionRef.get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✅ ${snapshot.size} productos eliminados.`);

    // Agregar los nuevos platos oficiales
    console.log('📥 Insertando platos oficiales de la carta...');
    for (const prod of officialProducts) {
      const docData = {
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        precio: prod.precio,
        categoria: prod.categoria,
        imagen: prod.imagen,
        isDestacado: prod.isDestacado,
        cantidad: 999, // Stock inicial por defecto alto
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Usar id_ref como el ID del documento para sincronía perfecta
      await collectionRef.doc(prod.id_ref).set(docData);
    }

    console.log('🎉 ¡Carta sembrada exitosamente en Firestore!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error durante la siembra de la carta:', error);
    process.exit(1);
  });
