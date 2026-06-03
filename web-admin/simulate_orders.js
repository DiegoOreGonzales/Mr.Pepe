/**
 * Script de Simulación de Pedidos en Tiempo Real - Mr. Pepe
 * 
 * Este script inyecta pedidos aleatorios directamente en Firestore para validar
 * el rendimiento, la estabilidad y la usabilidad de las pantallas de cocina (KDS)
 * y el aplicativo móvil de Mr. Pepe.
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

// 2. Inicializar Firebase Client SDK utilizando el modo Compatibilidad (CJS)
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

// 3. Productos del Menú Oficial de Mr. Pepe
const menuItems = [
  { productId: "prod_1", nombre: "1 Pollo a la Brasa completo + Papas + Ensalada", precio: 68.00 },
  { productId: "prod_2", nombre: "1/2 Pollo a la Brasa + Papas + Ensalada", precio: 38.00 },
  { productId: "prod_3", nombre: "1/4 Pollo a la Brasa + Papas + Ensalada", precio: 22.00 },
  { productId: "prod_4", nombre: "Papas Fritas Familiares XL", precio: 15.00 },
  { productId: "prod_5", nombre: "Ensalada Familiar Premium", precio: 12.00 },
  { productId: "prod_6", nombre: "Jarra de Chicha Morada 1L", precio: 10.00 },
  { productId: "prod_7", nombre: "Inca Kola Familiar 1.5L", precio: 9.00 },
  { productId: "prod_8", nombre: "Porción de Anticuchos Mr. Pepe (3 palos)", precio: 25.00 },
  { productId: "prod_9", nombre: "Salchipapa Clásica Mr. Pepe", precio: 18.00 }
];

const notasOpcionales = [
  "Bien cocido por favor",
  "Papas bien crocantes",
  "Sin ensalada",
  "Sin cremas",
  "Con bastante ají de la casa",
  "Llevar platos adicionales",
  null,
  null
];

// 4. Parámetros de simulación
const maxOrders = parseInt(process.argv[2]) || 12; // Número de pedidos a inyectar
const intervalMs = parseInt(process.argv[3]) || 4000; // Frecuencia de inyección (ms)
let orderCount = 0;

console.log(`🤖 Configurando simulación: se inyectarán ${maxOrders} pedidos cada ${intervalMs / 1000}s.`);

// 5. Iniciar Sesión de Administración
console.log('👤 Intentando autenticación silenciosa...');
auth.signInWithEmailAndPassword('admin@elbrasero.com', 'admin123456')
  .then((userCredential) => {
    console.log('✅ Autenticado con éxito como:', userCredential.user.email);
    console.log('🚀 Iniciando inyección de pedidos simultáneos...\n');
    
    const intervalId = setInterval(async () => {
      if (orderCount >= maxOrders) {
        clearInterval(intervalId);
        console.log(`\n🎉 Simulación completada con éxito. Se inyectaron ${orderCount} pedidos.`);
        console.log('👋 Desconectando de la base de datos...');
        process.exit(0);
      }
      
      try {
        orderCount++;
        
        // Generar un pedido aleatorio
        const mesa = Math.floor(Math.random() * 10) + 1; // Mesas 1 a 10
        const itemsCount = Math.floor(Math.random() * 3) + 1; // 1 a 3 productos distintos
        
        const items = [];
        let total = 0;
        
        // Seleccionar productos sin repetir en el mismo pedido
        const selectedProducts = [...menuItems].sort(() => 0.5 - Math.random()).slice(0, itemsCount);
        
        selectedProducts.forEach(prod => {
          const cantidad = Math.floor(Math.random() * 2) + 1; // Cantidad 1 o 2
          const nota = notasOpcionales[Math.floor(Math.random() * notasOpcionales.length)];
          
          items.push({
            productId: prod.productId,
            nombre: prod.nombre,
            cantidad: cantidad,
            precio: prod.precio,
            notas: nota
          });
          
          total += prod.precio * cantidad;
        });
        
        // Crear documento del pedido en Firestore
        const orderData = {
          mesaNumero: mesa,
          items: items,
          status: "pendiente",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          total: total
        };
        
        const docRef = await db.collection('orders').add(orderData);
        
        console.log(`📥 [Pedido #${orderCount}/${maxOrders}] Inyectado con éxito en Firestore!`);
        console.log(`   └─ ID: ${docRef.id}`);
        console.log(`   └─ Mesa: ${mesa}`);
        console.log(`   └─ Total: S/ ${total.toFixed(2)}`);
        console.log(`   └─ Items: ${items.map(i => `${i.cantidad}x ${i.nombre}${i.notas ? ` (${i.notas})` : ''}`).join(', ')}\n`);
        
      } catch (err) {
        console.error('❌ Error al inyectar pedido:', err.message);
      }
    }, intervalMs);
  })
  .catch((err) => {
    console.error('❌ Error crítico en autenticación:', err.message);
    process.exit(1);
  });
