/* ============================================================
   TODO EL CONTENIDO DEL PORTAFOLIO VIVE AQUÍ.
   Edita solo este archivo para cambiar textos, proyectos, etc.
   Los valores marcados con [ ] son placeholders — reemplázalos.
   ============================================================ */

export const identity = {
  nombre: 'Yair',
  apellido: '[Apellido]',
  rol: 'Desarrollador de Software',
  especialidad: 'Full-Stack',
  handle: '@yair.dev',
  descripcion:
    'Construyo productos digitales rápidos, escalables y cuidados al detalle. Me interesa el punto exacto donde el código limpio y el buen diseño se encuentran.',
  disponible: 'Disponible para proyectos',
  cv: '#', // ruta a tu CV en /public, ej: '/cv-yair.pdf'
  foto: '/foto.png',
  stackHero: ['React', 'TypeScript', 'Laravel', 'Node.js', 'MySQL', 'Three.js'],
}

export const zones = [
  { id: 'z01', code: 'Z-01', name: 'Recepción' },
  { id: 'z02', code: 'Z-02', name: 'Perfil' },
  { id: 'z03', code: 'Z-03', name: 'Capacidades' },
  { id: 'z04', code: 'Z-04', name: 'Trayectoria' },
  { id: 'z05', code: 'Z-05', name: 'Expedientes' },
  { id: 'z06', code: 'Z-06', name: 'Fuera de horario' },
  { id: 'z07', code: 'Z-07', name: 'Contacto' },
]

export const perfil = {
  titulo: 'Detrás de la credencial',
  parrafos: [
    'Soy un desarrollador apasionado por crear soluciones que resuelven problemas reales. Empecé por curiosidad y me quedé por el oficio: entender un problema, desarmarlo y construir algo que funcione de verdad.',
    'Me muevo con la misma comodidad en una consulta SQL que en una animación de entrada. Creo que el detalle no es un lujo — es lo que separa un producto usable de uno que la gente disfruta usar.',
  ],
  stats: [
    { n: '+3', l: 'Años construyendo' },
    { n: '20+', l: 'Proyectos entregados' },
    { n: '100%', l: 'Compromiso' },
    { n: '∞', l: 'Por aprender' },
  ],
}

export const capacidades = [
  { titulo: 'Frontend', nivel: 92, items: ['React', 'TypeScript', 'JavaScript', 'Tailwind', 'HTML5', 'CSS3'] },
  { titulo: 'Backend', nivel: 85, items: ['Laravel', 'PHP', 'Node.js', 'Python', 'REST'] },
  { titulo: 'Datos', nivel: 80, items: ['MySQL', 'PostgreSQL', 'Prisma', 'Modelado'] },
  { titulo: 'Infraestructura', nivel: 70, items: ['Git', 'Docker', 'Vercel', 'CI/CD'] },
  { titulo: 'Interfaz', nivel: 78, items: ['Figma', 'UI/UX', 'Responsive', 'Accesibilidad'] },
  { titulo: 'Movimiento', nivel: 74, items: ['GSAP', 'Framer Motion', 'Three.js', 'Lenis'] },
]

export const trayectoria = [
  {
    cuando: '2024 — Presente',
    cargo: 'Desarrollador Full-Stack',
    donde: '[Nombre de la empresa]',
    texto: 'Desarrollo y mantenimiento de aplicaciones web completas, desde el modelado de datos hasta la interfaz final.',
    tags: ['Laravel', 'React', 'MySQL'],
  },
  {
    cuando: '2023 — 2024',
    cargo: 'Desarrollador Frontend',
    donde: '[Nombre de la empresa]',
    texto: 'Construcción de interfaces, integración con APIs y optimización de rendimiento y accesibilidad.',
    tags: ['React', 'TypeScript', 'Tailwind'],
  },
  {
    cuando: '2022 — 2023',
    cargo: 'Practicante de Desarrollo',
    donde: '[Nombre de la institución]',
    texto: 'Primeros módulos en producción, control de versiones en equipo y bases sólidas de backend.',
    tags: ['PHP', 'MySQL', 'Git'],
  },
  {
    cuando: '2021 — 2022',
    cargo: 'Formación técnica',
    donde: '[Nombre de la institución]',
    texto: 'Fundamentos de programación, estructuras de datos y bases de datos relacionales.',
    tags: ['Algoritmos', 'SQL', 'POO'],
  },
]

/* Los 3 primeros aparecen destacados en la home. Todos aparecen en /expedientes */
export const expedientes = [
  {
    slug: 'sistema-escolar',
    nombre: 'Sistema Escolar',
    anio: '2024',
    estado: 'live',
    categoria: 'Plataforma',
    resumen: 'Gestión académica completa con roles, evaluaciones, asistencia y reportes en tiempo real.',
    stack: ['Laravel', 'MySQL', 'Vue.js'],
    tono: ['#3B1D8F', '#7C3AED'],
    demo: '#',
    repo: '#',
    arquitectura: [
      'Backend monolítico en Laravel con capas de servicio',
      'Autenticación por roles y permisos granulares',
      'Reportes generados en cola con jobs asíncronos',
    ],
    aprendizajes: [
      'Modelar permisos sin acoplar la lógica de negocio',
      'Optimizar consultas N+1 en listados grandes',
      'Diseñar para usuarios no técnicos',
    ],
  },
  {
    slug: 'vetwilling',
    nombre: 'VetWilling',
    anio: '2024',
    estado: 'live',
    categoria: 'Plataforma',
    resumen: 'Sistema veterinario para pacientes, citas, historias clínicas e inventario de insumos.',
    stack: ['Laravel', 'MySQL', 'Alpine.js'],
    tono: ['#0E3B4C', '#22D3EE'],
    demo: '#',
    repo: '#',
    arquitectura: [
      'Historias clínicas versionadas por consulta',
      'Agenda con validación de solapamiento de citas',
      'Módulo de inventario con alertas de stock',
    ],
    aprendizajes: [
      'Estructurar datos médicos sin perder trazabilidad',
      'Validaciones de negocio complejas en el servidor',
    ],
  },
  {
    slug: 'bordados-web',
    nombre: 'Bordados Web',
    anio: '2023',
    estado: 'live',
    categoria: 'E-commerce',
    resumen: 'Tienda en línea para venta de productos personalizados con configurador de bordado.',
    stack: ['PHP', 'MySQL', 'JavaScript'],
    tono: ['#4A1060', '#DB2777'],
    demo: '#',
    repo: '#',
    arquitectura: [
      'Carrito persistente en sesión y base de datos',
      'Configurador de personalización con vista previa',
      'Panel de administración de pedidos',
    ],
    aprendizajes: ['Manejo de estado de carrito sin framework', 'Flujos de pago y estados de pedido'],
  },
  {
    slug: 'gestor-tareas',
    nombre: 'Gestor de Tareas',
    anio: '2023',
    estado: 'arch',
    categoria: 'Herramienta',
    resumen: 'Aplicación de organización personal con recordatorios, etiquetas y estadísticas de hábitos.',
    stack: ['React', 'Node.js', 'PostgreSQL'],
    tono: ['#101A3A', '#8B5CF6'],
    demo: '#',
    repo: '#',
    arquitectura: ['API REST con Express', 'Estado global en cliente', 'Notificaciones programadas'],
    aprendizajes: ['Diseño de API pensando en el cliente', 'Manejo de zonas horarias'],
  },
  {
    slug: 'portafolio-3d',
    nombre: 'Este portafolio',
    anio: '2026',
    estado: 'live',
    categoria: 'Experimento',
    resumen: 'Experiencia 3D con física real, scroll cinematográfico y un concepto de credencial de acceso.',
    stack: ['React', 'Three.js', 'GSAP'],
    tono: ['#1B1140', '#C4B5FD'],
    demo: '#',
    repo: '#',
    arquitectura: [
      'Física de cuerpo rígido con Rapier para el carné',
      'Scroll suavizado con Lenis sincronizado con GSAP',
      'Texturas generadas en runtime, sin assets externos',
    ],
    aprendizajes: [
      'Presupuesto de rendimiento en escenas 3D',
      'Degradación elegante en dispositivos limitados',
    ],
  },
]

export const fueraDeHorario = [
  { k: 'H-01', t: 'Videojuegos', d: 'Estrategia y mundos abiertos. Buena parte de mi interés por los sistemas empezó ahí.' },
  { k: 'H-02', t: 'Música', d: 'Casi nunca programo en silencio. La playlist cambia según lo que esté construyendo.' },
  { k: 'H-03', t: 'Lectura', d: 'Tecnología, ciencia ficción y libros sobre cómo se construyen las cosas.' },
  { k: 'H-04', t: 'Deporte', d: 'Salir a moverme es lo que desbloquea los problemas que no salen frente a la pantalla.' },
  { k: 'H-05', t: 'Viajar', d: 'Cambiar de contexto siempre me devuelve ideas que no aparecen en el escritorio.' },
  { k: 'H-06', t: 'Trastear', d: 'Proyectos pequeños sin objetivo comercial, solo por ver si funcionan.' },
]

export const contacto = {
  email: '[tucorreo@ejemplo.com]',
  telefono: '[+00 000 000 0000]',
  ubicacion: '[Tu ciudad, País]',
  redes: [
    { n: 'GitHub', u: '#' },
    { n: 'LinkedIn', u: '#' },
    { n: 'Instagram', u: '#' },
  ],
}
