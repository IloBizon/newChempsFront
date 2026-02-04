import React, { useState, useEffect } from 'react';

const Registration = () => {
    const [step, setStep] = useState(1);
    const [timer, setTimer] = useState(0);
    const [generatedCode, setGeneratedCode] = useState('');
    const [error, setError] = useState('');
    const [diseases, setDiseases] = useState([]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        code: ['', '', '', '', '', ''],
        disease: '',
        height: '',
        weight: ''
    });

    useEffect(() => {
        fetch('http://127.0.0.1:8000/diseases')
            .then(res => res.json())
            .then(data => setDiseases(Array.isArray(data) ? data : data.results || []))
            .catch(() => setError('Ошибка загрузки списка заболеваний'));
    }, []);

    useEffect(() => {
        let interval;
        if (timer > 0) interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const validatePassword = (pass) => {
        return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{12,}$/.test(pass);
    };

    const sendCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setTimer(10);
        alert(`Код подтверждения: ${code}`);
        setStep(2);
    };

    const handleNextStep = () => {
        setError('');
        if (step === 1) {
            if (!formData.email.includes('@')) return setError('Некорректный email');
            if (!validatePassword(formData.password)) return setError('Пароль: 12+ симв., цифра и спецсимвол');
            if (formData.password !== formData.confirmPassword) return setError('Пароли не совпадают');
            sendCode();
        } else if (step === 2) {
            if (formData.code.join('') !== generatedCode) return setError('Неверный код');
            setStep(3);
        }
    };

    const handleFinish = async () => {
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    username: formData.email,
                    password: formData.password,
                    disease: parseInt(formData.disease),
                    height: parseInt(formData.height),
                    weight: parseInt(formData.weight)
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || JSON.stringify(data));

            localStorage.setItem('token', data.token);
            localStorage.setItem('refresh', data.refresh);
            alert('Регистрация завершена');
            window.location.href = '/';
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                <h2 style={s.title}>Регистрация ({step}/3)</h2>
                {error && <p style={s.error}>{error}</p>}

                {step === 1 && (
                    <div style={s.col}>
                        <input type="email" placeholder="Электронная почта" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={s.input} />
                        <input type="password" placeholder="Создать пароль" onChange={e => setFormData({ ...formData, password: e.target.value })} style={s.input} />
                        <input type="password" placeholder="Подтвердить пароль" onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} style={s.input} />
                        <label style={s.label}><input type="checkbox" required /> Согласие на обработку данных</label>
                        <button onClick={handleNextStep} style={s.btn}>Продолжить</button>
                    </div>
                )}

                {step === 2 && (
                    <div style={s.col}>
                        <p style={s.centerText}>Код отправлен на почту</p>
                        <div style={s.row}>
                            {formData.code.map((num, i) => (
                                <input key={i} maxLength="1" style={s.codeInput} value={num}
                                    onChange={e => {
                                        let newCode = [...formData.code];
                                        newCode[i] = e.target.value;
                                        setFormData({ ...formData, code: newCode });
                                        if (e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                                    }}
                                />
                            ))}
                        </div>
                        <button onClick={handleNextStep} style={s.btn}>Проверить</button>
                        <button disabled={timer > 0} onClick={sendCode} style={s.flatBtn}>
                            {timer > 0 ? `Повтор через ${timer}` : 'Отправить код повторно'}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div style={s.col}>
                        <select value={formData.disease} onChange={e => setFormData({ ...formData, disease: e.target.value })} style={s.input}>
                            <option value="">Основное заболевание</option>
                            {diseases.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <input type="number" placeholder="Рост (100-250 см)" onChange={e => setFormData({ ...formData, height: e.target.value })} style={s.input} />
                        <input type="number" placeholder="Вес (30-300 кг)" onChange={e => setFormData({ ...formData, weight: e.target.value })} style={s.input} />
                        <div style={s.colLeft}>
                            <label style={s.label}><input type="checkbox" /> Гипертония</label>
                            <label style={s.label}><input type="checkbox" /> Диабет</label>
                            <label style={s.label}><input type="checkbox" /> Астма</label>
                        </div>
                        <button onClick={handleFinish} style={s.btn}>Завершить</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const s = {
    page: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: '#fff', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
    card: { width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '20px' },
    title: { textAlign: 'center', color: '#000', margin: '0' },
    col: { display: 'flex', flexDirection: 'column', gap: '15px' },
    colLeft: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' },
    row: { display: 'flex', gap: '8px', justifyContent: 'center' },
    input: { width: '100%', padding: '12px', border: '1px solid #000', borderRadius: '0', boxSizing: 'border-box', fontSize: '16px' },
    codeInput: { width: '40px', height: '50px', textAlign: 'center', border: '1px solid #000', fontSize: '18px' },
    btn: { width: '100%', padding: '15px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' },
    flatBtn: { background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', color: '#000' },
    error: { color: 'red', fontSize: '13px', textAlign: 'center', margin: '0' },
    label: { fontSize: '13px', color: '#000' },
    centerText: { textAlign: 'center', margin: '0', fontSize: '14px' }
};

export default Registration;
