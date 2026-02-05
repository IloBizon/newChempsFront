import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientCard = ({ patientId, onBack }) => {
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('Обзор');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/users/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setPatient(data);
            } catch (e) { console.error("Ошибка загрузки"); }
        };
        fetchDetail();
    }, [patientId, token]);

    if (!patient) return <div style={s.loader}>Загрузка медицинской карты...</div>;

    const stats = patient.healthstatistics_set || [];
    const prescriptions = patient.drugprescription_set || [];
    const diary = patient.healthdiary_set || [];

    const handleQuickAction = (actionName) => {
        alert(`Действие: "${actionName}" инициировано (Заглушка)`);
    };

    return (
        <div style={s.container}>
            <header style={s.header}>
                <button onClick={onBack} style={s.backBtn}>← Назад</button>
                <div>
                    <h2 style={s.name}>{patient.email}</h2>
                    <span style={s.idTag}>Медицинская карта №{patient.id}</span>
                </div>
                
                <div style={s.quickActions}>
                    <button style={s.actionBtn} onClick={() => handleQuickAction('Новое назначение')}>Новое назначение</button>
                    <button style={s.actionBtn} onClick={() => handleQuickAction('Записать на прием')}>Записать на прием</button>
                    <button style={s.actionBtn} onClick={() => handleQuickAction('Добавить исследование')}>Добавить исследование</button>
                    <button style={s.actionBtn} onClick={() => handleQuickAction('Создать эпикриз')}>Создать эпикриз</button>
                </div>
            </header>

            <nav style={s.tabs}>
                {['Обзор', 'История болезни', 'Назначения', 'Исследования', 'Визуализация', 'Документы'].map(tab => (
                    <button key={tab} 
                            onClick={() => setActiveTab(tab)}
                            style={activeTab === tab ? s.tabActive : s.tab}>
                        {tab}
                    </button>
                ))}
            </nav>

            <div style={s.content}>
                {activeTab === 'Обзор' && (
                    <div style={s.grid}>
                        <div style={s.infoCard}>
                            <h4>Сводная информация</h4>
                            <p>Рост/Вес: {patient.height}см / {patient.weight}кг</p>
                            <p>Группа крови: {patient.blood_group || 'н/д'} ({patient.rh_factor ? 'Rh+' : 'Rh-'})</p>
                            <p>Основной диагноз: {patient.disease || 'Не установлен'}</p>
                        </div>
                        <div style={s.infoCard}>
                            <h4>Ключевые показатели</h4>
                            {stats.length > 0 ? (
                                <>
                                    <p>АД: {stats[stats.length-1].systolic_pressure}/{stats[stats.length-1].diastolic_pressure}</p>
                                    <p>Глюкоза: {stats[stats.length-1].glucose} ммоль/л</p>
                                    <p>Пульс: {stats[stats.length-1].pulse} уд/мин</p>
                                </>
                            ) : <p>Данные отсутствуют</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'История болезни' && (
                    <div style={s.timeline}>
                        {diary.map(item => (
                            <div key={item.id} style={s.logItem}>
                                <b>{new Date(item.date).toLocaleDateString()}</b>
                                <p>{item.text}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Назначения' && (
                    <div style={s.list}>
                        {prescriptions.map(p => (
                            <div key={p.id} style={s.listItem}>
                                <span>{p.drug?.title || 'Препарат'} — {p.drug?.dose || 0}мг</span>
                                <span style={p.was_taken ? {color:'green'} : {color:'red'}}>{p.was_taken ? 'Принято' : 'Пропущено'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Исследования' && (
                    <div style={s.placeholder}>
                        <p>Раздел лабораторных и инструментальных данных</p>
                    </div>
                )}

                {activeTab === 'Визуализация' && (
                    <div style={s.chartBox}>
                        <div style={{height: 250}}>
                            <ResponsiveContainer>
                                <LineChart data={stats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="id" hide />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="systolic_pressure" stroke="#000" name="АД Сист." />
                                    <Line type="monotone" dataKey="glucose" stroke="#888" name="Глюкоза" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'Документы' && (
                    <div style={s.placeholder}>
                        <p>Электронный медицинский архив документов</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const s = {
    container: { background: '#fff' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '10px' },
    backBtn: { background: '#eee', border: '1px solid #000', cursor: 'pointer', padding: '5px' },
    quickActions: { display: 'flex', gap: '5px' },
    actionBtn: { background: '#000', color: '#fff', border: 'none', padding: '5px 10px', fontSize: '10px', cursor: 'pointer' },
    name: { margin: 0, fontSize: '18px' },
    idTag: { fontSize: '11px', color: '#666' },
    tabs: { display: 'flex', borderBottom: '1px solid #eee', marginTop: '10px' },
    tab: { padding: '10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' },
    tabActive: { padding: '10px', border: 'none', background: 'none', borderBottom: '2px solid #000', fontWeight: 'bold' },
    content: { marginTop: '15px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    infoCard: { border: '1px solid #000', padding: '10px' },
    timeline: { display: 'flex', flexDirection: 'column', gap: '10px' },
    logItem: { borderLeft: '2px solid #000', paddingLeft: '10px' },
    list: { display: 'flex', flexDirection: 'column', gap: '5px' },
    listItem: { display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px' },
    chartBox: { border: '1px solid #eee', padding: '10px' },
    placeholder: { textAlign: 'center', padding: '30px', border: '1px dashed #ccc', fontSize: '12px' },
    loader: { padding: '20px', textAlign: 'center' }
};

export default PatientCard;
