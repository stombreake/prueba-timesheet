import React, { useState } from 'react';
import {
    FileText,
    Search,
    Filter,
    Calendar,
    Users as UsersIcon,
    Download,
    Trash2,
    Eye,
    ChevronRight,
    MapPin,
    Briefcase,
    Clock,
    Layers,
    Edit2,
    X,
    Save,
    AlertCircle,
    Truck
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function RecordsPage() {
    const [timesheets, setTimesheets] = useLocalStorage('timesheets', []);
    const [crews] = useLocalStorage('crews', []);
    const [globalPricePerMile] = useLocalStorage('globalPricePerMile', 0);
    const [filterCrew, setFilterCrew] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [collapsedGroups, setCollapsedGroups] = useState([]);
    const [editingSheet, setEditingSheet] = useState(null);

    const exportToExcel = async (specificDate = null) => {
        const recordsToExport = specificDate
            ? timesheets.filter(s => s.weekEnding === specificDate)
            : timesheets;

        if (recordsToExport.length === 0) {
            alert('No hay registros para exportar.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const groups = recordsToExport.reduce((acc, sheet) => {
            const crewName = sheet.crewName || 'Sin Cuadrilla';
            if (!acc[crewName]) acc[crewName] = [];
            acc[crewName].push(sheet);
            return acc;
        }, {});

        const summarySheet = workbook.addWorksheet('Summary');
        const headers = ['CREW', 'EMPLOYEE FILE', 'EMPLOYEE NAME', 'CLASSIFICATION', 'PAY RATE', 'OT RATE', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'STRAIGHT', 'OVER TIME', 'TOTAL', 'STRAIGHT TIME COST', 'OVER TIME COST', 'PERDIEM COST', 'EMPLOYEE COST', 'CREW COST'];
        const headerRow = summarySheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 9 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        let globalStats = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, st: 0, ot: 0, total: 0, stCost: 0, otCost: 0, totalCost: 0 };
        Object.keys(groups).forEach(crewName => {
            let crewTotalCost = 0;
            const crewEntries = groups[crewName];
            crewEntries.forEach((s, idx) => {
                const stC = (parseFloat(s.stRate) || 0) * (parseFloat(s.stHours) || 0);
                const otC = (parseFloat(s.otRate) || 0) * (parseFloat(s.otHours) || 0);
                const empC = stC + otC;
                crewTotalCost += empC;
                globalStats.sun += (s.dailyHours?.[0] || 0); globalStats.mon += (s.dailyHours?.[1] || 0); globalStats.tue += (s.dailyHours?.[2] || 0); globalStats.wed += (s.dailyHours?.[3] || 0); globalStats.thu += (s.dailyHours?.[4] || 0); globalStats.fri += (s.dailyHours?.[5] || 0); globalStats.sat += (s.dailyHours?.[6] || 0);
                globalStats.st += (parseFloat(s.stHours) || 0); globalStats.ot += (parseFloat(s.otHours) || 0); globalStats.total += (parseFloat(s.totalHours) || 0);
                globalStats.stCost += stC; globalStats.otCost += otC; globalStats.totalCost += empC;
                const row = summarySheet.addRow([idx === 0 ? crewName : '', s.employeeNumber || '---', s.userName, s.position || '---', parseFloat(s.stRate) || 0, parseFloat(s.otRate) || 0, s.dailyHours?.[0] || 0, s.dailyHours?.[1] || 0, s.dailyHours?.[2] || 0, s.dailyHours?.[3] || 0, s.dailyHours?.[4] || 0, s.dailyHours?.[5] || 0, s.dailyHours?.[6] || 0, s.stHours || 0, s.otHours || 0, s.totalHours || 0, stC, otC, 0, empC, idx === crewEntries.length - 1 ? crewTotalCost : '']);
                row.eachCell((cell, colNumber) => {
                    cell.font = { size: 8 };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                    if (colNumber === 5 || colNumber === 6) cell.numFmt = '"$"#,##0.00';
                    if (colNumber >= 7 && colNumber <= 16) cell.numFmt = '#,##0.00';
                    if (colNumber >= 17 && colNumber <= 21) {
                        if (cell.value !== '') cell.numFmt = '"$"#,##0.00';
                    }

                    if (colNumber === 7) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
                    if (colNumber >= 8 && colNumber <= 12) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } };
                    if (colNumber === 13) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
                    if (colNumber >= 14 && colNumber <= 16) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
                    if (colNumber >= 17 && colNumber <= 20) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2F0D9' } };
                    if (colNumber === 21 && cell.value !== '') { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F75B5' } }; cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; }
                });
            });
            summarySheet.addRow([]);
        });
        const totalRow = summarySheet.addRow(['GRAND TOTALS', '', '', '', '', '', globalStats.sun, globalStats.mon, globalStats.tue, globalStats.wed, globalStats.thu, globalStats.fri, globalStats.sat, globalStats.st, globalStats.ot, globalStats.total, globalStats.stCost, globalStats.otCost, 0, globalStats.totalCost, globalStats.totalCost]);
        totalRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
            if (colNumber >= 7 && colNumber <= 16) cell.numFmt = '#,##0.00';
            if (colNumber >= 17 && colNumber <= 21) cell.numFmt = '"$"#,##0.00';
        });
        summarySheet.addRow([]);
        const firstRecord = recordsToExport[0];
        const circuitName = firstRecord?.circuitName || 'N/A';
        const milesCompleted = parseFloat(firstRecord?.milesCompleted) || 0;
        const totalRevenue = milesCompleted * parseFloat(globalPricePerMile);
        const profitLoss = totalRevenue - globalStats.totalCost;

        const boxLabelRow = summarySheet.addRow(['', 'Circuit #', '', 'TOTAL CREW COST', '', 'PRICE PER', '', 'MILES COMPLET', '', 'Gain / Loss']);
        boxLabelRow.eachCell(c => { if (c.value) { c.font = { bold: true }; c.alignment = { horizontal: 'center' }; c.border = { top: { style: 'medium' } }; } });

        const boxValueRow = summarySheet.addRow(['', circuitName, '', globalStats.totalCost, '', parseFloat(globalPricePerMile), '', milesCompleted, '', profitLoss]);

        boxValueRow.getCell(4).font = { bold: true, size: 12 };
        boxValueRow.getCell(4).numFmt = '"$"#,##0.00';

        boxValueRow.getCell(6).numFmt = '"$"#,##0.00';
        boxValueRow.getCell(6).alignment = { horizontal: 'center' };

        boxValueRow.getCell(8).alignment = { horizontal: 'center' };

        boxValueRow.getCell(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: profitLoss >= 0 ? 'FFE2F0D9' : 'FFFFC7CE' } };
        boxValueRow.getCell(10).font = { color: { argb: profitLoss >= 0 ? 'FF38761D' : 'FF9C0006' }, bold: true };
        boxValueRow.getCell(10).numFmt = '"$"#,##0.00';

        summarySheet.columns.forEach(column => { column.width = 15; });
        Object.keys(groups).forEach(crewName => {
            const ws = workbook.addWorksheet(crewName.substring(0, 31));
            const hRow = ws.addRow(['Empleado', '# Empleado', 'Cargo', 'Fecha Cierre', 'Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'ST', 'OT', 'Total', 'Costo']);
            hRow.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }; c.font = { color: { argb: 'FFFFFFFF' }, bold: true }; });
            groups[crewName].forEach(s => {
                const row = ws.addRow([s.userName, s.employeeNumber, s.position, new Date(s.weekEnding).toLocaleDateString(), s.dailyHours?.[0] || 0, s.dailyHours?.[1] || 0, s.dailyHours?.[2] || 0, s.dailyHours?.[3] || 0, s.dailyHours?.[4] || 0, s.dailyHours?.[5] || 0, s.dailyHours?.[6] || 0, s.stHours || 0, s.otHours || 0, s.totalHours || 0, parseFloat(s.totalCost) || 0]);
                row.eachCell((cell, colNumber) => {
                    if (colNumber >= 5 && colNumber <= 14) cell.numFmt = '#,##0.00';
                    if (colNumber === 15) cell.numFmt = '"$"#,##0.00';
                });
            });

            // Add Equipment Section
            const firstCrewRecord = groups[crewName][0];
            if (firstCrewRecord && firstCrewRecord.equipment && firstCrewRecord.equipment.length > 0) {
                ws.addRow([]); // Blank row spacer
                const eqHeader = ws.addRow(['EQUIPMENT USED', 'EQUIPMENT ID', '', '', 'DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']);
                eqHeader.eachCell(c => {
                    if (c.value) { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } }; }
                });

                firstCrewRecord.equipment.forEach(eq => {
                    const eqRow = ws.addRow([eq.name, eq.id, '', '', '', '', '', '', '', '', '']);
                    // For now, equipment hours are not tracked daily in the timesheet entry form, 
                    // so we just list the equipment. 
                    eqRow.eachCell((cell, colNumber) => {
                        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
                    });
                });
            }

            ws.columns.forEach(c => c.width = 12);
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const fileNameDate = specificDate ? specificDate : new Date().toISOString().split('T')[0];
        saveAs(new Blob([buffer]), `Reporte_Timesheets_${fileNameDate}.xlsx`);
    };

    const toggleGroupCollapse = (key) => {
        setCollapsedGroups(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const filteredSheets = timesheets.filter(sheet => {
        const matchesCrew = filterCrew === 'all' || sheet.crewName === filterCrew;
        const matchesSearch = (sheet.userName || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCrew && matchesSearch;
    });

    // Multi-level grouping: Date -> Crew
    const groupedData = filteredSheets.reduce((acc, sheet) => {
        const date = sheet.weekEnding || 'Sin Fecha';
        const crew = sheet.crewName || 'Sin Cuadrilla';
        if (!acc[date]) acc[date] = {};
        if (!acc[date][crew]) acc[date][crew] = [];
        acc[date][crew].push(sheet);
        return acc;
    }, {});

    // Sort dates descending
    const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));

    const deleteRecord = (id) => {
        if (confirm('¿Deseas eliminar este registro permanentemente?')) {
            setTimesheets(timesheets.filter(s => s.id !== id));
        }
    };

    const deleteCrewBatch = (date, crewName) => {
        if (confirm(`¿Eliminar TODOS los registros de "${crewName}" para el fin de semana ${new Date(date).toLocaleDateString()}?`)) {
            setTimesheets(timesheets.filter(s => !(s.weekEnding === date && s.crewName === crewName)));
        }
    };

    const deleteDateBatch = (date) => {
        if (confirm(`¿Eliminar TODOS los registros del fin de semana ${new Date(date).toLocaleDateString()}?`)) {
            setTimesheets(timesheets.filter(s => s.weekEnding !== date));
        }
    };

    const updateEditedHours = (dayIdx, val) => {
        const newDaily = [...editingSheet.dailyHours];
        newDaily[dayIdx] = Number(val);
        const totalW = newDaily.reduce((a, b) => a + b, 0);
        const st = Math.min(totalW, 40);
        const ot = Math.max(0, totalW - 40);
        const cost = (st * (editingSheet.stRate || 0)) + (ot * (editingSheet.otRate || 0));
        setEditingSheet({ ...editingSheet, dailyHours: newDaily, totalHours: totalW, stHours: st, otHours: ot, totalCost: cost });
    };

    const saveEdit = () => {
        setTimesheets(timesheets.map(s => s.id === editingSheet.id ? editingSheet : s));
        setEditingSheet(null);
    };

    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
    const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="mb-2 text-white italic tracking-tighter uppercase font-black">Historial de Registros</h1>
                    <p className="text-slate-400">Consulta los timesheets agrupados por fecha y cuadrilla.</p>
                </div>
                <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 border border-emerald-500/20">
                    <Download size={18} /> Exportar Excel
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#020617]/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Buscar empleado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                </div>
                <div>
                    <select value={filterCrew} onChange={e => setFilterCrew(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                        <option value="all">Todas las Cuadrillas</option>
                        {crews.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <button className="bg-blue-600/10 text-blue-400 font-black py-2.5 rounded-xl border border-blue-500/20 uppercase tracking-widest text-[10px]">Filtrar</button>
            </div>

            <div className="space-y-12">
                {sortedDates.length === 0 ? (
                    <div className="glass-card p-20 flex flex-col items-center gap-4 text-slate-700 border-2 border-dashed border-slate-800/50">
                        <FileText size={64} className="opacity-10" />
                        <p className="font-black uppercase tracking-[0.2em] text-sm italic">No hay registros</p>
                    </div>
                ) : sortedDates.map(date => (
                    <div key={date} className="space-y-6">
                        {/* Date Header */}
                        <div
                            onClick={() => toggleGroupCollapse(date)}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b-2 border-white/5 mx-2 cursor-pointer group/date"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg border transition-all ${collapsedGroups.includes(date) ? 'bg-slate-800 text-slate-500 border-white/5' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter">Fin de Semana: {new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</h2>
                                        <ChevronRight size={22} className={`text-slate-500 transition-transform duration-300 hidden md:block ${collapsedGroups.includes(date) ? '' : 'rotate-90'}`} />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        {Object.keys(groupedData[date]).length} Cuadrillas {collapsedGroups.includes(date) ? '(Ocultas)' : 'registradas'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 self-end md:self-auto">
                                <button
                                    onClick={(e) => { e.stopPropagation(); exportToExcel(date); }}
                                    className="text-emerald-500 hover:text-emerald-400 p-2 transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                                    title="Exportar semana a Excel"
                                >
                                    <Download size={18} />
                                    <span className="hidden md:inline">Exportar</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteDateBatch(date); }}
                                    className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Crew Groups inside Date */}
                        {!collapsedGroups.includes(date) && (
                            <div className="space-y-6 pl-4 md:pl-8 animate-fade-in">
                                {Object.keys(groupedData[date]).map(crewName => {
                                    const groupKey = `${date}-${crewName}`;
                                    const isCollapsed = collapsedGroups.includes(groupKey);
                                    return (
                                        <div key={crewName} className="space-y-4">
                                            <div className="flex items-center justify-between group/header">
                                                <div onClick={() => toggleGroupCollapse(groupKey)} className="flex items-center gap-4 cursor-pointer flex-grow">
                                                    <div className={`p-1.5 rounded-lg border transition-all ${isCollapsed ? 'bg-slate-800 text-slate-500 border-white/5' : 'bg-blue-600/10 text-blue-400 border-blue-500/20'}`}><Layers size={14} /></div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-lg font-black text-slate-300 uppercase tracking-tight italic group-hover:text-white transition-colors">{crewName}</h3>
                                                            {groupedData[date][crewName][0]?.circuitName && (
                                                                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                                    <MapPin size={10} />
                                                                    {groupedData[date][crewName][0].circuitName} ({groupedData[date][crewName][0].milesCompleted} mi) - Cobrado: ${(groupedData[date][crewName][0].milesCompleted * globalPricePerMile).toFixed(2)}
                                                                </span>
                                                            )}
                                                            <ChevronRight size={16} className={`text-slate-600 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteCrewBatch(date, crewName)} className="opacity-0 group-hover/header:opacity-100 text-red-500/50 hover:text-red-500 text-[9px] font-black uppercase transition-all px-3 py-1 border border-transparent hover:border-red-500/20 rounded-lg flex items-center gap-1"><Trash2 size={12} /> Borrar Cuadrilla</button>
                                            </div>

                                            {!isCollapsed && (
                                                <div className="glass-card overflow-x-auto border border-white/5 animate-fade-in">
                                                    <table className="w-full text-left min-w-[600px]">
                                                        <thead>
                                                            <tr className="bg-slate-900/50 text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-white/5">
                                                                <th className="p-6">Empleado</th>
                                                                <th className="p-6 text-center">Horas</th>
                                                                <th className="p-6 text-right">Costo</th>
                                                                <th className="p-6 text-right">Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {groupedData[date][crewName].map(sheet => (
                                                                <React.Fragment key={sheet.id}>
                                                                    <tr className={`group hover:bg-white/[0.02] transition-colors ${expandedId === sheet.id ? 'bg-blue-600/5' : ''}`}>
                                                                        <td className="p-6">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">{sheet.userName?.charAt(0)}</div>
                                                                                <div>
                                                                                    <p className="font-black text-white text-sm uppercase">{sheet.userName}</p>
                                                                                    <span className="text-[9px] text-slate-500 font-black uppercase">ID: {sheet.employeeNumber || '---'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-6 text-center text-xs font-black text-slate-300">{sheet.totalHours} hrs</td>
                                                                        <td className="p-6 text-right text-emerald-400 font-mono font-black">${sheet.totalCost?.toFixed(2)}</td>
                                                                        <td className="p-6">
                                                                            <div className="flex justify-end gap-2">
                                                                                <button onClick={() => setEditingSheet({ ...sheet })} className="p-2 text-slate-500 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                                                                                <button onClick={() => toggleExpand(sheet.id)} className={`p-2 transition-all ${expandedId === sheet.id ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}><Eye size={16} /></button>
                                                                                <button onClick={() => deleteRecord(sheet.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    {expandedId === sheet.id && (
                                                                        <tr className="bg-slate-950/40">
                                                                            <td colSpan="4" className="p-4 md:p-8">
                                                                                <div className="overflow-x-auto">
                                                                                    <div className="grid grid-cols-7 gap-2 min-w-[400px]">
                                                                                        {days.map((day, dIdx) => (
                                                                                            <div key={day} className="bg-slate-900/50 rounded-xl p-3 border border-white/5 text-center">
                                                                                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{day}</p>
                                                                                                <p className="text-lg font-black text-white">{sheet.dailyHours?.[dIdx] || 0}</p>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>

                                                    {/* Crew Equipment Display */}
                                                    {groupedData[date][crewName][0]?.equipment && groupedData[date][crewName][0].equipment.length > 0 && (
                                                        <div className="p-6 border-t border-white/5 bg-slate-900/40">
                                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <Truck size={12} />
                                                                Equipo Asignado a la Cuadrilla
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {groupedData[date][crewName][0].equipment.map((eq, eIdx) => (
                                                                    <div key={eIdx} className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                                                                        <span className="text-xs font-black text-amber-500 uppercase">{eq.name}</span>
                                                                        <span className="text-[10px] font-black text-amber-400/60 uppercase tracking-widest">{eq.id}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingSheet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
                    <div className="glass-card w-full max-w-2xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-6 md:space-y-8 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center">
                            <div><h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter">Editar Registro</h2><p className="text-slate-400 text-xs md:text-sm">{editingSheet.userName} - #{editingSheet.employeeNumber}</p></div>
                            <button onClick={() => setEditingSheet(null)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                            {days.map((day, idx) => (
                                <div key={day} className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-500 text-center uppercase">{day}</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 md:py-3 text-center font-mono font-bold text-white outline-none" value={editingSheet.dailyHours[idx]} onChange={(e) => updateEditedHours(idx, e.target.value)} />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card p-4 md:p-6 bg-blue-600/5"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total</p><p className="text-2xl md:text-3xl font-black text-white">{editingSheet.totalHours} hrs</p></div>
                            <div className="glass-card p-4 md:p-6 bg-emerald-600/5 text-right"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">Costo</p><p className="text-2xl md:text-3xl font-black text-emerald-400">${editingSheet.totalCost.toFixed(2)}</p></div>
                        </div>
                        <div className="flex gap-4"><button onClick={() => setEditingSheet(null)} className="flex-1 py-3 md:py-4 bg-slate-900 text-slate-400 font-black uppercase text-xs rounded-2xl">Cancelar</button><button onClick={saveEdit} className="flex-1 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2"><Save size={18} /> Guardar</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
