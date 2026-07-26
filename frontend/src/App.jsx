import React, { useState, useEffect, useRef } from "react";
import { requestAPI } from "./services/api";
import {
  Home,
  UserPlus,
  LogIn,
  LogOut,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Database,
  Sparkles,
  User,
  MapPin,
  Phone,
  FileJson,
  Plus,
  UserCheck,
  Calendar,
  Clock,
  Trash,
  ShieldAlert
} from "lucide-react";

// Formulario de campos de usuario vacíos por defecto
const initialFormState = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  fechaNacimiento: "",
  edad: "",
  genero: "Masculino",
  telefono: "",
  direccion: "",
  localidad: "",
  provincia: "",
  pais: "Argentina",
  codigoPostal: "",
  role: "USER"
};

function App() {
  // Navegación (Pestañas/Desplazamiento)
  const [activeTab, setActiveTab] = useState("login"); // 'login', 'form', 'dashboard'

  // Autenticación
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [currentUserDetails, setCurrentUserDetails] = useState(
    JSON.parse(localStorage.getItem("userDetails")) || null
  );
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Datos y Formulario
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [profileForm, setProfileForm] = useState(initialFormState);
  const [isEditingId, setIsEditingId] = useState(null);

  // Búsqueda / Filtros
  const [filterEmail, setFilterEmail] = useState("");
  const [filterId, setFilterId] = useState("");

  // Consola Terminal de Logs
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const terminalRef = useRef(null);

  // Expandir terminal a medida que llegan logs (máx 340px)
  useEffect(() => {
    if (!terminalRef.current) return;
    const baseHeight = 220;
    const perLog = 28; // px aproximados por línea de log
    const computed = baseHeight + terminalLogs.length * perLog;
    const newHeight = Math.min(computed, 340);
    terminalRef.current.style.height = `${Math.max(newHeight, baseHeight)}px`;
  }, [terminalLogs.length]);

  // Cargar usuarios al iniciar (solo si hay token activo)
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, []);

  // Sincronizar el formulario de edición propia con el usuario logueado
  useEffect(() => {
    if (currentUserDetails) {
      let formattedDate = "";
      if (currentUserDetails.fechaNacimiento) {
        formattedDate = currentUserDetails.fechaNacimiento.substring(0, 10);
      }
      setProfileForm({
        nombre: currentUserDetails.nombre || "",
        apellido: currentUserDetails.apellido || "",
        email: currentUserDetails.email || "",
        password: "",
        fechaNacimiento: formattedDate,
        edad: String(currentUserDetails.edad || ""),
        genero: currentUserDetails.genero || "Masculino",
        telefono: currentUserDetails.telefono || "",
        direccion: currentUserDetails.direccion || "",
        localidad: currentUserDetails.localidad || "",
        provincia: currentUserDetails.provincia || "",
        pais: currentUserDetails.pais || "Argentina",
        codigoPostal: currentUserDetails.codigoPostal || "",
        role: currentUserDetails.role || "USER"
      });
    }
  }, [currentUserDetails]);

  // Agregar log a la consola
  const logToTerminal = (res) => {
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString("es-AR"),
      method: res.method,
      url: res.url.replace("http://localhost:7000", ""),
      status: res.status,
      statusText: res.statusText,
      duration: res.duration,
      data: res.data
    };
    setTerminalLogs((prev) => [newLog, ...prev]);
    setSelectedLog(newLog);
  };

  // 1. INICIAR SESIÓN (LOGIN)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await requestAPI("POST", "/auth/login", {
      email: loginEmail,
      password: loginPassword
    });
    logToTerminal(res);
    setLoading(false);

    if (res.success && res.data && res.data.data) {
      const { token: jwtToken, role: userRole, user: userDetails } = res.data.data;
      setToken(jwtToken);
      setRole(userRole);
      setCurrentUserDetails(userDetails);
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("role", userRole);
      localStorage.setItem("userDetails", JSON.stringify(userDetails));
      setLoginPassword("");
      setActiveTab("dashboard"); // Volver al inicio tras login exitoso
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setCurrentUserDetails(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userDetails");
    
    // Loguear el cierre de sesión en consola de forma simbólica
    setTerminalLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString("es-AR"),
        method: "LOGOUT",
        url: "/auth/logout",
        status: 200,
        statusText: "OK",
        duration: 0,
        data: { message: "Sesión cerrada correctamente por el usuario" }
      },
      ...prev
    ]);
  };

  // Modificar perfil propio (PUT)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUserDetails) return;
    setLoading(true);
    const payload = { ...profileForm };
    payload.edad = parseInt(payload.edad, 10);
    // Eliminar email: no puede modificarse en el backend
    delete payload.email;
    // Eliminar contraseña si no se informó una nueva
    if (!payload.password) {
      delete payload.password;
    }
    // PUT a /users/:id
    const res = await requestAPI("PUT", `/users/${currentUserDetails.id}`, payload, token);
    logToTerminal(res);
    setLoading(false);

    if (res.success && res.data && res.data.data) {
      const updatedUser = res.data.data;
      setCurrentUserDetails(updatedUser);
      localStorage.setItem("userDetails", JSON.stringify(updatedUser));
      alert("¡Tus datos de registración han sido modificados correctamente!");
      fetchUsers();
    } else {
      alert("Error al actualizar perfil: " + (res.data?.message || "Error desconocido"));
    }
  };

  // 2. OBTENER USUARIOS (GET)
  const fetchUsers = async () => {
    setLoading(true);
    let path = "/users";
    const params = [];
    if (filterEmail) params.push(`email=${encodeURIComponent(filterEmail)}`);
    if (filterId) params.push(`id=${encodeURIComponent(filterId)}`);
    if (params.length > 0) {
      path += `?${params.join("&")}`;
    }

    const res = await requestAPI("GET", path, null, token);
    logToTerminal(res);
    setLoading(false);

    if (res.success && res.data && res.data.data) {
      // El backend puede retornar un objeto único (búsqueda por email/id)
      // o un array (listado general). Normalizamos siempre a array.
      const raw = res.data.data;
      setUsers(Array.isArray(raw) ? raw : [raw]);
    } else {
      setUsers([]);
    }
  };

  // 3 & 4. CREAR / ACTUALIZAR USUARIO (POST / PUT)
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...form };
    payload.edad = parseInt(payload.edad, 10);

    let res;
    if (isEditingId) {
      // Eliminar email del payload en PUT (el backend no lo permite)
      delete payload.email;
      res = await requestAPI("PUT", `/users/${isEditingId}`, payload, token);
    } else {
      res = await requestAPI("POST", "/users", payload, token);
    }

    logToTerminal(res);
    setLoading(false);

    if (res.success) {
      resetForm();
      fetchUsers();
      setActiveTab("dashboard");
    }
  };

  // 5. ELIMINAR USUARIO (DELETE)
  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    setLoading(true);
    const res = await requestAPI("DELETE", `/users/${id}`, null, token);
    logToTerminal(res);
    setLoading(false);
    if (res.success) {
      fetchUsers();
    }
  };

  // Generador de datos de prueba aleatorios
  const generateMockData = () => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const nombres = ["Mateo", "Valentina", "Thiago", "Emma", "Santiago", "Sofia", "Joaquin", "Delfina", "Julian", "Catalina"];
    const apellidos = ["Gomez", "Rodriguez", "Fernandez", "Lopez", "Diaz", "Martinez", "Perez", "Romero", "Alvarez", "Gonzalez"];
    const generos = ["Masculino", "Femenino", "Otro"];
    const provincias = ["Buenos Aires", "Cordoba", "Santa Fe", "Mendoza", "Tucuman", "Salta"];
    const localidades = ["CABA", "Rosario", "Cordoba Capital", "Godoy Cruz", "San Miguel", "Salta Capital"];

    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    const genero = generos[Math.floor(Math.random() * generos.length)];
    const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${randomNum}@example.com`;
    const edad = Math.floor(Math.random() * 50) + 18;
    const anioNac = 2026 - edad;
    const mesNac = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const diaNac = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
    const fechaNacimiento = `${anioNac}-${mesNac}-${diaNac}`;

    setForm({
      nombre,
      apellido,
      email,
      password: "password123",
      fechaNacimiento,
      edad: String(edad),
      genero,
      telefono: `+54911${Math.floor(Math.random() * 90000000) + 10000000}`,
      direccion: `Av. Siempre Viva ${Math.floor(Math.random() * 3000) + 1}`,
      localidad: localidades[Math.floor(Math.random() * localidades.length)],
      provincia: provincias[Math.floor(Math.random() * provincias.length)],
      pais: "Argentina",
      codigoPostal: String(Math.floor(Math.random() * 8000) + 1000),
      role: Math.random() > 0.8 ? "ADMIN" : "USER"
    });
  };

  const handleEditClick = (user) => {
    setIsEditingId(user._id);
    let formattedDate = "";
    if (user.fechaNacimiento) {
      formattedDate = user.fechaNacimiento.substring(0, 10);
    }
    setForm({
      nombre: user.nombre || "",
      apellido: user.apellido || "",
      email: user.email || "",
      password: "",
      fechaNacimiento: formattedDate,
      edad: String(user.edad || ""),
      genero: user.genero || "Masculino",
      telefono: user.telefono || "",
      direccion: user.direccion || "",
      localidad: user.localidad || "",
      provincia: user.provincia || "",
      pais: user.pais || "Argentina",
      codigoPostal: user.codigoPostal || "",
      role: user.role || "USER"
    });
    setActiveTab("form");
  };

  const resetForm = () => {
    setIsEditingId(null);
    setForm(initialFormState);
  };

  // Formatear Fecha y Hora en Español
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  // Métricas calculadas para las tarjetas
  const totalUsers = users.length;
  const avgAge = totalUsers > 0 ? Math.round(users.reduce((acc, u) => acc + (u.edad || 0), 0) / totalUsers) : 0;
  const adminsCount = users.filter((u) => u.role === "ADMIN" || u.role === "ROOT").length;

  // Porcentaje de traslado para el Slider (ordenado: login, form, dashboard)
  const getSliderTransform = () => {
    if (activeTab === "login") return "translateX(0%)";
    if (activeTab === "form") return "translateX(-33.3333%)";
    if (activeTab === "dashboard") return "translateX(-66.6666%)";
    return "translateX(0%)";
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* SIDEBAR FLOTANTE DE NAVEGACIÓN */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Database size={26} className="text-white" />
        </div>
        
        <button
          className={`sidebar-btn ${activeTab === "login" ? "active" : ""}`}
          onClick={() => setActiveTab("login")}
          title="Autenticación (Login)"
          style={{ position: "relative" }}
        >
          <LogIn size={22} />
          {token && (
            <span style={{ position: "absolute", bottom: "4px", right: "4px", width: "8px", height: "8px", background: "var(--color-accent-teal)", borderRadius: "50%" }}></span>
          )}
        </button>

        <button
          className={`sidebar-btn ${activeTab === "form" ? "active" : ""}`}
          onClick={() => setActiveTab("form")}
          title={isEditingId ? "Editar Usuario" : "Crear Usuario"}
        >
          <UserPlus size={22} />
        </button>

        <button
          className={`sidebar-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
          title="Panel de Inicio"
        >
          <Home size={22} />
        </button>

        <div className="sidebar-spacer"></div>
      </aside>

      {/* WORKSPACE PRINCIPAL CON SLIDER */}
      <main className="main-workspace">
        
        {/* VIEWPORT CONTENEDOR DEL SLIDER */}
        <div className="slider-viewport">
          <div className="workspace-slider" style={{ transform: getSliderTransform() }}>
            
            {/* PESTAÑA 1: AUTENTICACIÓN / LOGIN */}
            <div className="panel-view">
              <div className="form-panel-container" style={{ maxWidth: "450px", marginTop: "1.5rem" }}>
                <h3 className="greeting-title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                  {token ? "Bienvenido Administrador" : "Iniciar Sesión"}
                </h3>
                <p className="greeting-subtitle" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  {token ? "Ya has iniciado sesión con éxito" : "Ingresa tus credenciales para obtener tu token JWT"}
                </p>

                {token ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: "#f7f6fc", padding: "1rem", borderRadius: "14px", border: "1px solid rgba(80, 62, 189, 0.08)" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)" }}>ROL DE SESIÓN:</span>
                      <span className="badge badge-teal" style={{ alignSelf: "flex-start", padding: "0.4rem 0.8rem" }}>{role}</span>
                      
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.5rem" }}>TOKEN JWT ACTIVO:</span>
                      <div style={{ fontSize: "0.7rem", wordBreak: "break-all", background: "#181824", color: "#00e5ff", padding: "0.5rem", borderRadius: "8px", fontFamily: "monospace" }}>
                        {token}
                      </div>
                    </div>
                    <button className="btn btn-danger" onClick={handleLogout} style={{ width: "100%" }}>
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                      <label>Email de Usuario *</label>
                      <input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contraseña *</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                      <LogIn size={16} />
                      Ingresar y Obtener Token
                    </button>
                  </form>
                )}
              </div>

              {/* PANEL DE EDICIÓN PROPIA (Solo si hay usuario logueado) */}
              {token && currentUserDetails && (
                <div className="form-panel-container" style={{ maxWidth: "600px", marginTop: "1.5rem", animation: "tabFadeIn 0.3s ease-out forwards" }}>
                  <h3 className="greeting-title" style={{ fontSize: "1.2rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Edit2 size={18} className="text-primary" />
                    Mis Datos de Registración (Modificación)
                  </h3>
                  <p className="greeting-subtitle" style={{ marginBottom: "1.25rem" }}>
                    Puedes actualizar tus campos de registro usando el método PUT. El email no es modificable.
                  </p>
                  
                  <form onSubmit={handleUpdateProfile}>
                    <div className="form-grid-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="form-group">
                        <label>Nombre *</label>
                        <input
                          type="text"
                          value={profileForm.nombre}
                          onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Apellido *</label>
                        <input
                          type="text"
                          value={profileForm.apellido}
                          onChange={(e) => setProfileForm({ ...profileForm, apellido: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="form-group">
                        <label>Email (No modificable)</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          disabled
                          style={{ opacity: 0.6, cursor: "not-allowed" }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Nueva Contraseña (Opcional)</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={profileForm.password}
                          onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                      <div className="form-group">
                        <label>Fecha de Nacimiento *</label>
                        <input
                          type="date"
                          value={profileForm.fechaNacimiento}
                          onChange={(e) => setProfileForm({ ...profileForm, fechaNacimiento: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Edad *</label>
                        <input
                          type="number"
                          value={profileForm.edad}
                          onChange={(e) => setProfileForm({ ...profileForm, edad: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Género *</label>
                        <select
                          value={profileForm.genero}
                          onChange={(e) => setProfileForm({ ...profileForm, genero: e.target.value })}
                        >
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-3" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
                      <div className="form-group">
                        <label>Teléfono *</label>
                        <input
                          type="text"
                          value={profileForm.telefono}
                          onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Código Postal *</label>
                        <input
                          type="text"
                          value={profileForm.codigoPostal}
                          onChange={(e) => setProfileForm({ ...profileForm, codigoPostal: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-3">
                      <div className="form-group" style={{ gridColumn: "span 3" }}>
                        <label>Dirección física *</label>
                        <input
                          type="text"
                          value={profileForm.direccion}
                          onChange={(e) => setProfileForm({ ...profileForm, direccion: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="form-group">
                        <label>Localidad *</label>
                        <input
                          type="text"
                          value={profileForm.localidad}
                          onChange={(e) => setProfileForm({ ...profileForm, localidad: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Provincia *</label>
                        <input
                          type="text"
                          value={profileForm.provincia}
                          onChange={(e) => setProfileForm({ ...profileForm, provincia: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.75rem" }} disabled={loading}>
                      <UserCheck size={16} />
                      Modificar Mis Datos (PUT)
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* PESTAÑA 2: FORMULARIO (CREAR / EDITAR) */}
            <div className="panel-view">
              <div className="form-panel-container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div>
                    <h3 className="greeting-title">
                      {isEditingId ? "Editar Perfil de Usuario" : "Crear Nuevo Usuario"}
                    </h3>
                    <p className="greeting-subtitle">Completa los campos para interactuar con la base de datos</p>
                  </div>
                  
                  {!isEditingId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={generateMockData}
                      title="Auto-completa todo el formulario de prueba en 1 clic"
                    >
                      <Sparkles size={16} style={{ color: "var(--color-purple-primary)" }} />
                      Generar Datos de Prueba
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitUser}>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Apellido *</label>
                      <input
                        type="text"
                        value={form.apellido}
                        onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Género *</label>
                      <select
                        value={form.genero}
                        onChange={(e) => setForm({ ...form, genero: e.target.value })}
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contraseña {isEditingId ? "(Opcional)" : "*"}</label>
                      <input
                        type="password"
                        placeholder={isEditingId ? "Dejar vacío si no se modifica" : "Mínimo 6 caracteres"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required={!isEditingId}
                      />
                    </div>
                    <div className="form-group">
                      <label>Rol Asignado</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="ROOT">ROOT</option>
                        <option value="GUEST">GUEST</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Fecha de Nacimiento *</label>
                      <input
                        type="date"
                        value={form.fechaNacimiento}
                        onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Edad *</label>
                      <input
                        type="number"
                        value={form.edad}
                        onChange={(e) => setForm({ ...form, edad: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Teléfono *</label>
                      <input
                        type="text"
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label>Dirección física *</label>
                      <input
                        type="text"
                        value={form.direccion}
                        onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Código Postal *</label>
                      <input
                        type="text"
                        value={form.codigoPostal}
                        onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Localidad *</label>
                      <input
                        type="text"
                        value={form.localidad}
                        onChange={(e) => setForm({ ...form, localidad: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Provincia *</label>
                      <input
                        type="text"
                        value={form.provincia}
                        onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>País *</label>
                      <input
                        type="text"
                        value={form.pais}
                        onChange={(e) => setForm({ ...form, pais: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                      {isEditingId ? "Actualizar Datos (PUT)" : "Guardar en Base de Datos (POST)"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        resetForm();
                        setActiveTab("dashboard");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* PESTAÑA 3: INICIO (DASHBOARD) - 2 COLUMNAS (SECCIÓN CONTACTS ELIMINADA) */}
            <div className="panel-view">
              <div className="home-grid">
                
                {/* COLUMNA 1: PERFIL, TARJETAS DE MOCK Y ESTADÍSTICAS */}
                <div className="dashboard-col">
                  <div className="col-header">
                    <h3 className="greeting-title">
                      ¡Buenas noches {role ? role : "Invitado"}!
                    </h3>
                    <p className="greeting-subtitle">Resumen de tu base de datos</p>
                  </div>

                  {/* Tarjetas de simulación (Estilo Tarjetas de Crédito) */}
                  <div className="card-stack">
                    <div className="visual-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", opacity: 0.9 }}>
                          Colección MongoDB
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>fz-db</div>
                      </div>
                      <div className="card-number">
                        {totalUsers.toString().padStart(4, "0")} USUARIOS
                      </div>
                      <div className="card-footer">
                        <div>
                          <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>ESTADO DE BASE DE DATOS</div>
                          <div style={{ fontWeight: 600 }}>Conectado Activo</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>07/26</div>
                      </div>
                    </div>

                    <div className="visual-card purple">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", opacity: 0.9 }}>
                          Sesión y Token JWT
                        </div>
                        <UserCheck size={18} />
                      </div>
                      <div className="card-number" style={{ fontSize: "0.85rem", letterSpacing: "0" }}>
                        {token ? `CUENTA ${role}` : "SIN AUTENTICACIÓN"}
                      </div>
                      <div className="card-footer">
                        <div>
                          <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>PUERTO DEL SERVIDOR</div>
                          <div style={{ fontWeight: 600 }}>localhost:7000</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>v1.0</div>
                      </div>
                    </div>

                    <div className="add-card-placeholder" onClick={() => { resetForm(); setActiveTab("form"); }}>
                      <Plus size={16} style={{ marginRight: "0.5rem" }} />
                      Agregar Otro Usuario
                    </div>
                  </div>

                  {/* Estadísticas rápidas */}
                  <div className="metrics-grid">
                    <div className="metric-widget">
                      <span className="label">Promedio Edad</span>
                      <span className="value">{avgAge} años</span>
                      <svg className="wave-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M0,10 Q25,20 50,5 T75,18 L100,10 L100,20 L0,20 Z" fill="var(--color-accent-teal)" />
                      </svg>
                    </div>
                    
                    <div className="metric-widget">
                      <span className="label">Total Admins</span>
                      <span className="value">{adminsCount}</span>
                      <svg className="wave-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M0,15 Q25,5 50,15 T75,5 L100,15 L100,20 L0,20 Z" fill="var(--color-purple-primary)" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: TRANSACCIONES (LISTA DE USUARIOS - ANCHO COMPLETO RESTANTE) */}
                <div className="dashboard-col">
                  <div className="col-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 className="greeting-title">Todas las Transacciones</h3>
                      <p className="greeting-subtitle">Lista de usuarios registrados en el sistema</p>
                    </div>
                    {(role === "ROOT" || role === "ADMIN" || role === "USER") && (
                      <button
                        className="action-icon-btn"
                        onClick={fetchUsers}
                        disabled={loading}
                        style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justify: "center", boxShadow: "var(--shadow-card)" }}
                      >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                      </button>
                    )}
                  </div>

                  {(role === "ROOT" || role === "ADMIN" || role === "USER") ? (
                    <>
                      {/* Filtro y Búsqueda */}
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <div className="search-box-container" style={{ flex: 1.2 }}>
                          <input
                            type="text"
                            placeholder="Buscar por Email..."
                            value={filterEmail}
                            onChange={(e) => setFilterEmail(e.target.value)}
                            style={{ background: "#fff", border: "none", boxShadow: "var(--shadow-card)" }}
                          />
                          <Search size={14} className="search-icon" />
                        </div>
                        <div className="search-box-container" style={{ flex: 1 }}>
                          <input
                            type="text"
                            placeholder="Buscar por ID..."
                            value={filterId}
                            onChange={(e) => setFilterId(e.target.value)}
                            style={{ background: "#fff", border: "none", boxShadow: "var(--shadow-card)" }}
                          />
                          <Search size={14} className="search-icon" />
                        </div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => { setFilterEmail(""); setFilterId(""); fetchUsers(); }}
                          style={{ padding: "0.6rem 0.8rem", borderRadius: "14px", flexShrink: 0 }}
                          title="Limpiar filtros"
                        >
                          ×
                        </button>
                        <button className="btn btn-primary" onClick={fetchUsers} style={{ padding: "0.6rem 0.8rem", borderRadius: "14px", flexShrink: 0 }}>
                          Filtrar
                        </button>
                      </div>

                      {/* Listado de Transacciones / Usuarios */}
                      <div className="transaction-list-container">
                        {users.map((user) => (
                          <div className="transaction-item" key={user._id}>
                            <div className="left">
                              <div className="avatar-circle">
                                {user.nombre ? user.nombre[0].toUpperCase() : "U"}
                              </div>
                              <div className="info">
                                <span className="name">{user.nombre} {user.apellido}</span>
                                <span className="sub">{user.email} | Rol: <strong>{user.role}</strong></span>
                                
                                {/* Fecha y Hora de la Transacción */}
                                <span className="timestamp">
                                  <Calendar size={11} />
                                  {formatDateTime(user.createdAt || user.updatedAt)}
                                </span>
                                
                                <span className="sub" style={{ fontSize: "0.7rem", color: "var(--color-purple-primary)", fontWeight: 500, marginTop: "0.15rem" }}>
                                  ID: {user._id}
                                </span>
                              </div>
                            </div>
                            <div className="right">
                              <span className="amount-badge">
                                {user.edad} Años
                              </span>
                              
                              <div style={{ display: "flex", gap: "0.15rem" }}>
                                <button
                                  className="action-icon-btn"
                                  onClick={() => handleEditClick(user)}
                                  title="Editar"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="action-icon-btn delete"
                                  onClick={() => handleDeleteUser(user._id)}
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {users.length === 0 && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 1rem", color: "var(--color-text-muted)", gap: "0.5rem" }}>
                            <Database size={24} style={{ opacity: 0.4 }} />
                            <p style={{ fontSize: "0.85rem" }}>No se encontraron usuarios.</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: "white", padding: "2.5rem 1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", boxShadow: "var(--shadow-card)", textAlign: "center", border: "1px solid rgba(80, 62, 189, 0.05)" }}>
                      <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(255, 90, 121, 0.1)", display: "flex", alignItems: "center", justify: "center", color: "var(--color-accent-pink)" }}>
                        <ShieldAlert size={26} />
                      </div>
                      <h4 style={{ fontWeight: 700, color: "var(--color-text-dark)", fontSize: "1.1rem" }}>Acceso Restringido</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", maxWidth: "340px", lineHeight: "1.4" }}>
                        El listado completo de transacciones y datos de usuarios está reservado exclusivamente para cuentas con rol <strong>ROOT</strong>.
                      </p>
                      <div style={{ background: "var(--color-purple-light)", color: "var(--color-purple-primary)", padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 600 }}>
                        Tu rol actual: {role ? role : "Invitado (Sin Login)"}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* CONSOLA TERMINAL INTEGRADA A PIE DE PÁGINA */}
        <div className="terminal-console" ref={terminalRef}>
          <div className="terminal-header">
            <span>Terminal de Consola API - Historial de Peticiones</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.65rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Clock size={11} /> logs: {terminalLogs.length}
              </span>
              {terminalLogs.length > 0 && (
                <button
                  onClick={() => { setTerminalLogs([]); setSelectedLog(null); }}
                  style={{
                    background: "rgba(255, 90, 121, 0.12)",
                    border: "1px solid rgba(255, 90, 121, 0.25)",
                    color: "var(--color-accent-pink)",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.5px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.target.style.background = "rgba(255, 90, 121, 0.25)"}
                  onMouseLeave={e => e.target.style.background = "rgba(255, 90, 121, 0.12)"}
                  title="Limpiar historial de la consola"
                >
                  LIMPIAR
                </button>
              )}
            </div>
          </div>
          
          <div className="terminal-layout">
            {/* Lista de logs de peticiones (izquierda) */}
            <div className="terminal-logs-list">
              {terminalLogs.map((log) => (
                <div
                  key={log.id}
                  className={`terminal-line ${selectedLog?.id === log.id ? "active" : ""}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <span className="terminal-time">[{log.time}]</span>
                  <span className="terminal-prompt">admin@fz-db:~$</span>
                  <span className="terminal-text">
                    {log.method} {log.url} &rarr;{" "}
                    <span className={log.status >= 200 && log.status < 300 ? "terminal-status-success" : "terminal-status-error"}>
                      {log.status} {log.statusText}
                    </span>{" "}
                    ({log.duration}ms)
                  </span>
                </div>
              ))}
              {terminalLogs.length === 0 && (
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
                  esperando interacción con la API para registrar operaciones...
                </div>
              )}
            </div>

            {/* Inspector JSON de respuesta (derecha) */}
            <div className="terminal-inspector">
              {selectedLog ? (
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-purple-primary)", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.2rem", marginBottom: "0.3rem", display: "flex", justifyContent: "space-between" }}>
                    <span>RESPUESTA JSON ({selectedLog.method})</span>
                    <span>{selectedLog.status}</span>
                  </div>
                  <pre>{JSON.stringify(selectedLog.data, null, 2)}</pre>
                </div>
              ) : (
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
                  Selecciona una línea de log para inspeccionar
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

    </div>
  );
}

export default App;
