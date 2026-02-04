import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);

    const correctOrder = ["Измерить давление", "Принять таблетку", "Запить водой", "Зафиксировать результат"];
    const [captchaItems, setCaptchaItems] = useState([
        "Принять таблетку", "Зафиксировать результат", "Запить водой", "Измерить давление"
    ]);

    useEffect(() => {
        if (secondsLeft > 0) {
            const timer = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else {
            setIsBlocked(false);
            setAttempts(0);
        }
    }, [secondsLeft]);

    const moveToEnd = (index) => {
        const newItems = [...captchaItems];
        const item = newItems.splice(index, 1)[0];
        newItems.push(item);
        setCaptchaItems(newItems);
    };

    const handleLogin = async () => {
        if (isBlocked) return;
        setError('');

        if (!email.includes('@')) return setError("Введите корректный email");
        if (password.length < 12) return setError("Пароль слишком короткий");
        if (JSON.stringify(captchaItems) !== JSON.stringify(correctOrder)) {
            return setError("Неверный порядок действий в капче");
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('refresh', data.refresh);
                window.location.href = '/dashboard';
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= 2) {
                    setIsBlocked(true);
                    setSecondsLeft(60);
                    setError("Вход заблокирован на 1 минуту");
                } else {
                    setError("Неверный логин или пароль");
                }
            }
        } catch (err) {
            setError("Ошибка сервера");
        }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                <h2 style={s.title}>Вход в кабинет</h2>
                
                {error && <p style={s.error}>{error}</p>}

                <div style={s.col}>
                    <input type="email" placeholder="Электронная почта" style={s.input} onChange={e => setEmail(e.target.value)} />
                    
                    <div style={s.row}>
                        <input type={showPassword ? "text" : "password"} placeholder="Пароль" style={{...s.input, flex: 1}} onChange={e => setPassword(e.target.value)} />
                        <button onClick={() => setShowPassword(!showPassword)} style={s.sideBtn}>
                            {showPassword ? "Скрыть" : "Показать"}
                        </button>
                    </div>

                    <div style={s.captcha}>
                        <p style={s.text}>Нажимайте на пункты, чтобы выстроить их по порядку:</p>
                        {captchaItems.map((item, i) => (
                            <div key={item} onClick={() => moveToEnd(i)} style={s.item}>
                                {i + 1}. {item}
                            </div>
                        ))}
                    </div>

                    <button onClick={handleLogin} disabled={isBlocked} style={isBlocked ? s.btnOff : s.btn}>
                        {isBlocked ? `Ждите ${secondsLeft} сек.` : "Войти"}
                    </button>

                    <div style={s.footer}>
                        <Link to="/register" style={s.link}>Регистрация</Link>
                        <span style={s.link}>Забыли пароль?</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const s = {
    page: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', boxSizing: 'border-box' },
    card: { width: '100%', maxWidth: '350px', textAlign: 'center' },
    title: { marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' },
    col: { display: 'flex', flexDirection: 'column', gap: '10px' },
    row: { display: 'flex', gap: '5px' },
    input: { padding: '12px', border: '1px solid #000', outline: 'none', fontSize: '16px' },
    sideBtn: { background: '#000', color: '#fff', border: 'none', padding: '0 10px', cursor: 'pointer', fontSize: '12px' },
    captcha: { border: '1px solid #000', padding: '10px', marginTop: '10px' },
    text: { fontSize: '12px', marginBottom: '10px' },
    item: { padding: '10px', border: '1px solid #eee', marginBottom: '5px', cursor: 'pointer', fontSize: '14px', background: '#f9f9f9' },
    btn: { padding: '15px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
    btnOff: { padding: '15px', background: '#eee', color: '#999', border: 'none' },
    error: { color: 'red', fontSize: '13px', marginBottom: '10px' },
    footer: { display: 'flex', justifyContent: 'space-between', marginTop: '10px' },
    link: { fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', color: '#000' }
};

export default Login;
