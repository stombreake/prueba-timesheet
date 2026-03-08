import React, { useState } from 'react';
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
    Activity,
    Calendar,
    ChevronDown,
    ChevronUp
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
    const [globalPricePerMile] = useLocalStorage('globalPricePerMile', 0);
    const [historyCollapsed, setHistoryCollapsed] = useState(true);

    const getNextSaturday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        const daysToSaturday = (6 - dayOfWeek + 7) % 7;
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + daysToSaturday);
        return nextSaturday.toISOString().split('T')[0];
    };

    const calculateTotals = (records) => {
        let cost = 0;
        let revenue = 0;

        // For Revenue (Miles + External Gains), calculate once per batch (Date + Crew)
        const batchGroups = records.reduce((acc, r) => {
            const key = `${r.weekEnding}-${r.crewName}`;
            if (!acc[key]) acc[key] = r;
            return acc;
        }, {});

        Object.values(batchGroups).forEach(batchFirstRecord => {
            revenue += (parseFloat(batchFirstRecord.milesCompleted) || 0) * globalPricePerMile;
            revenue += (batchFirstRecord.externalGains || []).reduce((sum, g) => sum + (parseFloat(g.amount) * parseFloat(g.quantity)), 0);
        });

        // For Cost (Payroll), sum every individual record
        cost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);

        return { cost, revenue, profit: revenue - cost };
    };

    // Get current week only for summary cards
    const latestWeekEnding = timesheets.length > 0
        ? [...timesheets]
            .filter(sh => sh.weekEnding)
            .sort((a, b) => new Date(b.weekEnding) - new Date(a.weekEnding))[0]?.weekEnding
        : null;

    const currentWeekRecords = latestWeekEnding
        ? timesheets.filter(r => r.weekEnding === latestWeekEnding)
        : [];

    const totals = calculateTotals(currentWeekRecords);
    const totalCost = totals.cost;
    const totalBillable = totals.revenue;
    const totalProfit = totals.profit;

    // Aggregated chart data: Group by Date ONLY for general history
    const dateGroups = timesheets.reduce((acc, r) => {
        const date = r.weekEnding || 'N/A';
        if (!acc[date]) acc[date] = { cost: 0, revenue: 0, seenBatches: new Set() };

        acc[date].cost += (r.totalCost || 0);

        const batchKey = `${r.weekEnding}-${r.crewName}`;
        if (!acc[date].seenBatches.has(batchKey)) {
            acc[date].seenBatches.add(batchKey);
            acc[date].revenue += ((parseFloat(r.milesCompleted) || 0) * globalPricePerMile) +
                ((r.externalGains || []).reduce((sum, g) => sum + (parseFloat(g.amount) * (parseFloat(g.quantity) || 1)), 0));
        }
        return acc;
    }, {});

    const fullHistoricalChartData = Object.entries(dateGroups).map(([date, data]) => ({
        name: date !== 'N/A' ? new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : 'N/A',
        fullDate: date,
        Cost: data.cost,
        Earnings: data.revenue
    })).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

    const chartData = fullHistoricalChartData.slice(-7);



    // Circuit Progress
    const circuitProgress = circuits.map(circuit => {
        const circuitTimesheets = timesheets.filter(t => t.circuitId === circuit.id);
        const uniqueSaves = [];
        const seen = new Set();

        circuitTimesheets.forEach(t => {
            const key = `${t.weekEnding}-${t.crewName}`; // Corrected key to avoid duplication across members
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="mb-2 text-white italic tracking-tighter uppercase font-black">Resumen Operativo</h1>
                    <p className="text-slate-400 font-medium">Análisis de ganancias y costos del reporte más reciente.</p>
                </div>
                <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-4 rounded-3xl flex items-center gap-4 hover:border-blue-500/40 transition-all shadow-xl shadow-blue-500/5 min-w-[240px]">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none mb-2">Semana Activa</p>
                        <p className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">
                            {new Date(latestWeekEnding || getNextSaturday()).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Current Week Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-6">
                    <StatCard
                        title="Ganancias (Semana)"
                        value={`$${totalBillable.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        icon={DollarSign}
                        trend={12}
                        color="blue"
                    />

                    {/* Weekly Earnings vs Cost Pie Chart */}
                    <div className="glass-card p-4 h-[220px] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">
                            <Activity size={12} className="text-blue-400" />
                            Relación Ganancia / Costo
                        </h4>

                        <div className="h-full w-full relative z-10">
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Ganancia Neta', value: Math.max(0, totalProfit), color: '#10b981' },
                                            { name: 'Costo Total', value: totalCost, color: '#ef4444' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                                        formatter={(value) => [`$${value.toLocaleString()}`, '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Text */}
                            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Margen</p>
                                <p className="text-xl font-black text-white italic tracking-tighter">
                                    {totalBillable > 0 ? ((totalProfit / totalBillable) * 100).toFixed(0) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <StatCard
                    title="Nómina (Semana)"
                    value={`$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={TrendingDown}
                    trend={-5}
                    color="red"
                />
                <StatCard
                    title="Utilidad (Semana)"
                    value={`$${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={TrendingUp}
                    trend={18}
                    color={(totalCost / (totalBillable || 1)) > 0.45 ? "amber" : "emerald"}
                />
                <StatCard
                    title="Personal Activo"
                    value={users.length}
                    icon={Users}
                    color="cyan"
                />
            </div>

            {/* Historical Stats Grid */}
            <div className="space-y-6">
                <div
                    className="flex items-center justify-between pb-2 border-b border-white/5 opacity-60 cursor-pointer hover:opacity-100 transition-opacity group"
                    onClick={() => setHistoryCollapsed(!historyCollapsed)}
                >
                    <div className="flex items-center gap-3">
                        <Activity size={18} className="text-slate-400" />
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Acumulado Histórico</h2>
                    </div>
                    <button className="p-1 hover:bg-white/5 rounded-lg transition-all text-slate-500 group-hover:text-blue-400">
                        {historyCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                </div>

                {!historyCollapsed && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-80">
                            <StatCard
                                title="Ganancias Totales"
                                value={`$${calculateTotals(timesheets).revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                icon={DollarSign}
                                color="blue"
                            />
                            <StatCard
                                title="Costos Totales"
                                value={`$${calculateTotals(timesheets).cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                icon={TrendingDown}
                                color="red"
                            />
                            <StatCard
                                title="Utilidad Neta"
                                value={`$${calculateTotals(timesheets).profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                icon={TrendingUp}
                                color={(calculateTotals(timesheets).cost / (calculateTotals(timesheets).revenue || 1)) > 0.45 ? "amber" : "emerald"}
                            />
                            <StatCard
                                title="Registros"
                                value={timesheets.length}
                                icon={Activity}
                                color="slate"
                            />
                        </div>

                        {/* Historical Area Chart */}
                        <div className="glass-card p-6 h-[300px] opacity-90 border-blue-500/10">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <TrendingUp size={12} className="text-blue-400" />
                                Progresión Histórica de Ganancias vs Costos
                            </h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={fullHistoricalChartData}>
                                    <defs>
                                        <linearGradient id="colorEarningsHist" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCostHist" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="Earnings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEarningsHist)" name="Ganancia" />
                                    <Area type="monotone" dataKey="Cost" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCostHist)" name="Costo" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


                {/* (Maybe another component or empty space for now) */}
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
