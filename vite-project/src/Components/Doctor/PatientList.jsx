import React, { useState, useEffect } from 'react';

const PatientList = ({ onSelectPatient }) => {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/users/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setPatients(Array.isArray(data) ? data : data.results || []);
            } catch (e) {
                console.error("Ошибка загрузки списка");
            }
        };
        fetchPatients();
    }, [token]);

    const getRiskLevel = (p) => {
        const history = p.healthstatistics_set;
        if (!history || history.length === 0) return 'none';
        const last = history[history.length - 1];

        if (last.systolic_pressure > 160 || last.glucose > 10) return 'critical';
        if (last.systolic_pressure > 140 || last.glucose > 7) return 'warning';
        return 'stable';
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.email.toLowerCase().includes(searchTerm.toLowerCase());
        const risk = getRiskLevel(p);
        if (filterStatus === 'critical') return matchesSearch && risk === 'critical';
        if (filterStatus === 'warning') return matchesSearch && risk === 'warning';
        return matchesSearch;
    });

    const getRowStyle = (risk) => {
        if (risk === 'critical') return { background: '#fff0f0', borderLeft: '5px solid red' };
        if (risk === 'warning') return { background: '#fff9f0', borderLeft: '5px solid orange' };
        return { borderLeft: '5px solid #eee' };
    };

    return (
        <div style={s.container}>
            <div style={s.searchBar}>
                <input
                    type="text"
                    placeholder="Поиск по Email или ID..."
                    style={s.input}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <select style={s.select} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">Все статусы</option>
                    <option value="critical">Высокий риск</option>
                    <option value="warning">Внимание</option>
                </select>
            </div>

            <table style={s.table}>
                <thead>
                    <tr style={s.thead}>
                        <th style={s.th}>Пациент (Email)</th>
                        <th style={s.th}>Параметры</th>
                        <th style={s.th}>Статус</th>
                        <th style={s.th}>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPatients.map(p => {
                        const risk = getRiskLevel(p);
                        const last = p.healthstatistics_set?.[p.healthstatistics_set.length - 1];
                        return (
                            <tr key={p.id} style={{ ...s.tr, ...getRowStyle(risk) }}>
                                <td style={s.td}>
                                    <b>{p.email}</b>
                                    <div style={{ fontSize: '10px' }}>Рост: {p.height} | Вес: {p.weight}</div>
                                </td>
                                <td style={s.td}>
                                    {last ? `АД: ${last.systolic_pressure}/${last.diastolic_pressure} | Гл: ${last.glucose}` : 'Нет данных'}
                                </td>
                                <td style={s.td}>
                                    <span style={risk === 'critical' ? s.badgeRed : risk === 'warning' ? s.badgeOrange : s.badgeGrey}>
                                        {risk === 'critical' ? 'КРИТИЧЕСКИЙ' : risk === 'warning' ? 'ВНИМАНИЕ' : 'СТАБИЛЕН'}
                                    </span>
                                </td>
                                <td style={s.td}>
                                    <button 
                                        style={s.actionBtn} 
                                        onClick={() => onSelectPatient(p.id)}
                                    >
                                        ОТКРЫТЬ КАРТУ
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const s = {
    container: { display: 'flex', flexDirection: 'column', gap: '20px' },
    searchBar: { display: 'flex', gap: '10px' },
    input: { flex: 1, padding: '10px', border: '2px solid #000', outline: 'none', fontFamily: 'monospace' },
    select: { padding: '10px', border: '2px solid #000', background: '#fff', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
    thead: { background: '#eee', textAlign: 'left' },
    th: { padding: '12px', border: '1px solid #000', fontSize: '12px', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #ddd' },
    td: { padding: '12px', border: '1px solid #eee', fontSize: '13px' },
    badgeRed: { background: 'red', color: '#fff', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold' },
    badgeOrange: { background: 'orange', color: '#000', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold' },
    badgeGrey: { background: '#eee', color: '#666', padding: '3px 8px', fontSize: '10px' },
    actionBtn: { background: '#000', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }
};

export default PatientList;
