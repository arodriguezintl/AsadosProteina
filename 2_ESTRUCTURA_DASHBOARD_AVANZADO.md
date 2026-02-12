## Layout Principal (Grid System)
```html
<div class="flex min-h-screen bg-asados-bg">
  <!-- Sidebar -->
  <aside class="w-64 bg-asados-dark text-white flex flex-col p-6 fixed h-full">
    <div class="text-2xl font-bold text-asados-lime mb-10">Asados P.</div>
    <nav class="space-y-4 flex-1">
      <a href="#" class="flex items-center gap-3 p-3 bg-white/10 rounded-xl text-asados-lime italic">Dashboard</a>
      <a href="#" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition">Pedidos</a>
      <a href="#" class="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition">Inventario</a>
    </nav>
    <div class="bg-asados-lime/10 p-4 rounded-2xl border border-asados-lime/20 mt-auto">
      <p class="text-xs text-asados-lime font-bold uppercase">Plan Pro</p>
      <button class="w-full mt-2 text-xs bg-asados-lime text-asados-dark py-2 rounded-lg font-bold">MEJORAR</button>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="ml-64 flex-1 p-8">
    <!-- Top Row: KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-asados-surface p-6 rounded-3xl shadow-soft">
        <p class="text-asados-muted text-sm">Ventas Hoy</p>
        <h3 class="text-2xl font-bold text-asados-dark">$1,240.00</h3>
      </div>
      <!-- Repetir para: Pedidos Activos, Clientes Nuevos, Ticket Promedio -->
    </div>

    <!-- Middle Row: Charts & Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-asados-surface p-8 rounded-4xl shadow-soft">
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-bold text-lg">Rendimiento Semanal</h2>
        </div>
        <!-- Chart Placeholder -->
        <div class="h-64 bg-asados-bg rounded-2xl border-2 border-dashed flex items-center justify-center">
          [Componente de Gráfica de Barras - Color #C1FF72]
        </div>
      </div>
      
      <div class="bg-asados-surface p-8 rounded-4xl shadow-soft">
        <h2 class="font-bold text-lg mb-6">Actividad Reciente</h2>
        <!-- Transaction List -->
        <div class="space-y-4">
          <div class="flex justify-between items-center py-2 border-b border-asados-bg">
            <div>
              <p class="font-bold text-sm">#AP-2930</p>
              <p class="text-xs text-asados-muted">Hace 5 min</p>
            </div>
            <span class="text-asados-dark font-bold">+$45.00</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>