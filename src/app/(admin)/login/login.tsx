"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import styles from "../../../styles/login.module.css";

const defaultFormData = { username: "", password: "" };
const defaultRegisterData = {
    username: "",
    password: "",
    role: "member",
    passphrase: "",
};

export default function Home() {
    const router = useRouter();

    const [formData, setFormData] = useState<typeof defaultFormData>(defaultFormData);
    const [registerData, setRegisterData] = useState<typeof defaultRegisterData>(defaultRegisterData);

    const [visibility, setVisibility] = useState({
        loginPassword: false,
        registerPassword: false,
        passphrase: false,
    });
    const [remember, setRemember] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [status, setStatus] = useState({
        error: null as string | null,
        success: null as string | null,
        loading: false,
    });

    const resetFormStates = useCallback(() => {
        setFormData(defaultFormData);
        setRegisterData(defaultRegisterData);
        setStatus({ error: null, success: null, loading: false });
    }, []);

    const toggleVisibility = (field: keyof typeof visibility) => {
        setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        isRegister = false
    ) => {
        const { name, value } = e.target;

        if (isRegister) {
            setRegisterData((prev: typeof defaultRegisterData) => ({
                ...prev,
                [name]: value,
            }));
        } else {
            setFormData((prev: typeof defaultFormData) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ error: null, success: null, loading: true });

        const res = await signIn("credentials", {
            username: formData.username,
            password: formData.password,
            redirect: false,
            rememberMe: remember.toString(),
        });

        if (res?.error) {
            setStatus({ error: res.error, success: null, loading: false });
        } else {
            resetFormStates();
            router.push("/dashboard");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ error: null, success: null, loading: false });

        try {
            const res = await fetch("/api/useraccounts/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Registration failed.");

            setStatus({
                success: "Account successfully created. Please sign in.",
                error: null,
                loading: false,
            });
            setFormData(defaultFormData);
            setRegisterData(defaultRegisterData);
            setShowRegister(false);
        } catch (err: any) {
            setStatus({ error: err.message, success: null, loading: false });
        }
    };

    const renderEyeIcon = (field: keyof typeof visibility) => (
        <img
            src={`/images/${visibility[field] ? "eye_on" : "eye_off"}.png`}
            alt="Toggle"
            onClick={() => toggleVisibility(field)}
            className={styles.eyeIcon}
        />
    );

    return (
        <div className={styles.container}>
            <div className={styles.loginBox}>
                <div className={styles.logo}>
                    <img src="/images/sfg_logo.png" alt="Logo" />
                    <h2>Synagogue for Jesus</h2>
                </div>

                <form onSubmit={showRegister ? handleRegister : handleLogin} className={styles.form}>
                    {showRegister ? (
                        <>
                            <h3>Create an Account</h3>
                            <input
                                type="text"
                                name="username"
                                value={registerData.username}
                                onChange={(e) => handleInputChange(e, true)}
                                placeholder="Choose a username"
                                required
                                className={styles.textInput}
                            />
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={visibility.registerPassword ? "text" : "password"}
                                    name="password"
                                    value={registerData.password}
                                    onChange={(e) => handleInputChange(e, true)}
                                    placeholder="Create a password"
                                    required
                                    className={styles.textInput}
                                />
                                {renderEyeIcon("registerPassword")}
                            </div>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={visibility.passphrase ? "text" : "password"}
                                    name="passphrase"
                                    value={registerData.passphrase}
                                    onChange={(e) => handleInputChange(e, true)}
                                    placeholder="Passphrase"
                                    required
                                    className={styles.textInput}
                                />
                                {renderEyeIcon("passphrase")}
                            </div>
                            <select
                                name="role"
                                value={registerData.role}
                                onChange={(e) => handleInputChange(e, true)}
                                className={styles.textInput}>
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                            </select>
                            <button type="submit" className={styles.button}>
                                Register
                            </button>
                            <div className={styles.options}>
                                <span>
                                    Already have an account?{" "}
                                    <span
                                        className={styles.linkText}
                                        onClick={() => {
                                            setShowRegister(false);
                                            resetFormStates();
                                        }}>
                                        Sign in
                                    </span>
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3>Nice to see you again</h3>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="Username"
                                required
                                className={styles.textInput}
                            />
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={visibility.loginPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter password"
                                    required
                                    className={styles.textInput}
                                />
                                {renderEyeIcon("loginPassword")}
                            </div>
                            <div className={styles.options}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                    />{" "}
                                    Remember me
                                </label>
                            </div>
                            <button type="submit" className={styles.button}>
                                Sign in
                            </button>
                            <div className={styles.options}>
                                <span>
                                    Don&apos;t have an account?{" "}
                                    <span
                                        className={styles.linkText}
                                        onClick={() => {
                                            setShowRegister(true);
                                            resetFormStates();
                                        }}>
                                        Register
                                    </span>
                                </span>
                            </div>
                            {status.loading && (
                                <div className={`${styles.message} ${styles.loggingInMessage}`}>
                                    Logging in...
                                </div>
                            )}
                        </>
                    )}
                    {(status.error || status.success) && (
                        <div className={styles.messageWrapper}>
                            {status.error && (
                                <div className={`${styles.message} ${styles.errorMessage}`}>
                                    {status.error}
                                </div>
                            )}
                            {status.success && (
                                <div className={`${styles.message} ${styles.successMessage}`}>
                                    {status.success}
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
