import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    ArrowUpRight,
    Map,
    Activity
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
                <Icon size={24} />
            </div>
            {trend && (
                <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
            <h2 className="text-3xl font-bold text-white mt-1">{value}</h2>
        </div>
    </div>
);

export default function DashboardPage() {
    const [timesheets] = useLocalStorage('timesheets', []);
    const [users] = useLocalStorage('users', []);
    const [circuits] = useLocalStorage('circuits', []);

    // Process data for charts
    const totalCost = timesheets.reduce((acc, sheet) => acc + (sheet.totalCost || 0), 0);
    const totalBillable = totalCost * 1.35; // Simulating 35% margin for "Earnings"
    const totalProfit = totalBillable - totalCost;

    const chartData = timesheets.slice(-7).map(sheet => ({
        name: sheet.weekEnding ? new Date(sheet.weekEnding).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : 'N/A',
        Cost: sheet.totalCost,
        Earnings: sheet.totalCost * 1.35
    }));

    // Crew specifically
    const crewTotals = timesheets.reduce((acc, sheet) => {
        const crew = sheet.crewName || 'Sin Cuadrilla';
        if (!acc[crew]) acc[crew] = 0;
        acc[crew] += sheet.totalCost;
        return acc;
    }, {});

    const crewChartData = Object.entries(crewTotals).map(([name, cost]) => ({
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        fullName: name,
        Costo: cost
    }));

    // Circuit Progress
    const circuitProgress = circuits.map(circuit => {
        const circuitTimesheets = timesheets.filter(t => t.circuitId === circuit.id);
        const uniqueSaves = [];
        const seen = new Set();

        circuitTimesheets.forEach(t => {
            const key = `${t.weekEnding}-${t.crewName}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueSaves.push(t);
            }
        });

        const completedMiles = uniqueSaves.reduce((sum, t) => sum + (parseFloat(t.milesCompleted) || 0), 0);
        const totalMiles = parseFloat(circuit.miles) || 0;
        const remainingMiles = Math.max(0, totalMiles - completedMiles);

        return {
            ...circuit,
            completedMiles,
            totalMiles,
            remainingMiles,
            percentage: totalMiles > 0 ? ((completedMiles / totalMiles) * 100).toFixed(1) : 0,
            chartData: [
                { name: 'Completadas', value: completedMiles, color: '#10b981' }, // Emerald
                { name: 'Restantes', value: remainingMiles, color: '#1e293b' } // Slate
            ]
        };
    });

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div>
                <h1 className="mb-2 text-white">Resumen Operativo</h1>
                <p className="text-slate-400">Análisis detallado de ganancias, costos y reporte por cuadrilla.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ganancias Totales"
                    value={`$${totalBillable.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={DollarSign}
                    trend={12}
                    color="blue"
                />
                <StatCard
                    title="Costos de Nómina"
                    value={`$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={TrendingDown}
                    trend={-5}
                    color="red"
                />
                <StatCard
                    title="Utilidad Neta"
                    value={`$${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={TrendingUp}
                    trend={18}
                    color="emerald"
                />
                <StatCard
                    title="Personal Activo"
                    value={users.length}
                    icon={Users}
                    color="cyan"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 glass-card p-6 min-h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="text-blue-400" size={18} />
                            Ganancias vs Costos (Histórico)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="Earnings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                                <Area type="monotone" dataKey="Cost" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Crew Costs Chart */}
                <div className="glass-card p-6 flex flex-col gap-6 overflow-hidden">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Users className="text-emerald-400" size={18} />
                        Costos por Cuadrilla
                    </h3>

                    <div className="h-[250px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={crewChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Costo']}
                                />
                                <Bar dataKey="Costo" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-800">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Margen Sugerido</span>
                            <span className="text-emerald-400 font-bold">35%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Circuit Progress Section */}
            {circuits.length > 0 && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
                                <Map className="text-emerald-400" size={20} />
                                Progreso de Circuitos
                            </h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Millas totales vs Completadas</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {circuitProgress.map(circuit => (
                            <div key={circuit.id} className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <h4 className="font-black text-white text-lg truncate mb-1 relative z-10">{circuit.name}</h4>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 relative z-10">
                                    <span>{circuit.percentage}% Completado</span>
                                </div>

                                <div className="h-[140px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={circuit.chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {circuit.chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => [`${value.toFixed(1)} mi`, '']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
                                    <div className="bg-slate-950/50 rounded-xl p-3 text-center border border-emerald-500/20">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Hechas</p>
                                        <p className="text-sm font-bold text-white">{circuit.completedMiles.toFixed(1)}</p>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 text-center border border-white/5">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                                        <p className="text-sm font-bold text-slate-400">{circuit.totalMiles.toFixed(1)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity Table */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-6">Actividad Reciente</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-800 font-black tracking-widest">
                                <th className="pb-4">Empleado / Cuadrilla</th>
                                <th className="pb-4">Fecha</th>
                                <th className="pb-4">Horas</th>
                                <th className="pb-4">Costo</th>
                                <th className="pb-4 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {timesheets.slice(-5).reverse().map(sheet => (
                                <tr key={sheet.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                                    <td className="py-4">
                                        <p className="font-bold text-white group-hover:text-blue-400 transition-colors leading-none">{sheet.userName}</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1.5">{sheet.crewName}</p>
                                    </td>
                                    <td className="py-4 text-slate-400 text-xs">{new Date(sheet.weekEnding).toLocaleDateString()}</td>
                                    <td className="py-4 font-mono text-slate-300">{sheet.totalHours} hrs</td>
                                    <td className="py-4 font-mono text-emerald-400 font-bold">${sheet.totalCost.toFixed(2)}</td>
                                    <td className="py-4 text-right">
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            SAVED
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {timesheets.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-600 italic font-medium">No hay registros recientes para mostrar.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
