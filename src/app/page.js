"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FiPlusCircle,
  FiCreditCard,
  FiSearch,
  FiBarChart2,
} from "react-icons/fi";

const baseUrl = "https://shak-multas-99076cfe6de7.herokuapp.com";

export default function Home() {
  // New authentication state
  const [token, setToken] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Estado para crear multa
  const [nuevaMulta, setNuevaMulta] = useState({
    id: "",
    valor: "",
    descripcion: "",
  });
  const [resultadoCrear, setResultadoCrear] = useState(null);

  // Estado para buscar multas
  const [identifier, setIdentifier] = useState("");
  const [multasEncontradas, setMultasEncontradas] = useState([]);
  const [errorBuscar, setErrorBuscar] = useState(null);

  // State for payment modal
  const [showModal, setShowModal] = useState(false);
  const [selectedMulta, setSelectedMulta] = useState(null);
  const [modalPago, setModalPago] = useState({
    customer_email: "",
    card_type: "",
    card_holder_name: "",
    card_number: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    currency: "USD",
  });
  const [modalError, setModalError] = useState("");

  // On mount, load token from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (saved) setToken(saved);
  }, []);

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setLoginError("");
      } else {
        setLoginError(data.message || "Error al iniciar sesión");
      }
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setRegisterError("");
      } else {
        setRegisterError(data.message || "Error al registrar usuario");
      }
    } catch (err) {
      setRegisterError(err.message);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    const res = await fetch(`${baseUrl}/multas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: nuevaMulta.id,
        valor: Number(nuevaMulta.valor),
        descripcion: nuevaMulta.descripcion,
      }),
    });
    const data = await res.json();
    setResultadoCrear(data.mensaje || JSON.stringify(data));
  };

  const openModal = (m) => {
    setSelectedMulta(m);
    setModalPago({
      customer_email: "",
      card_type: "",
      card_holder_name: "",
      card_number: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      currency: "USD",
    });
    setModalError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMulta(null);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    // Basic validations
    if (!/^[\w-.]+@[\w-]+\.[a-z]{2,}$/i.test(modalPago.customer_email)) {
      setModalError("Email inválido");
      return;
    }
    if (!modalPago.card_type) {
      setModalError("Tipo de tarjeta requerido");
      return;
    }
    if (!/^[0-9]{13,19}$/.test(modalPago.card_number)) {
      setModalError("Número de tarjeta inválido");
      return;
    }
    if (
      !/^[0-9]{1,2}$/.test(modalPago.expiryMonth) || // sigue validando 1 o 2 dígitos para el mes
      !/^[0-9]{4}$/.test(modalPago.expiryYear) // ahora valida 4 dígitos para el año
    ) {
      setModalError("Fecha de expiración inválida");
      return;
    }
    if (!/^[0-9]{3,4}$/.test(modalPago.cvv)) {
      setModalError("CVV inválido");
      return;
    }
    // Build payment body
    const body = {
      multaId: selectedMulta.id,
      paymentDetails: {
        app_name: "UDLA PORTAL PAGOS",
        service: "Pago de Multas",
        customer_email: modalPago.customer_email,
        card_type: modalPago.card_type,
        card_holder_name: modalPago.card_holder_name,
        card_number: modalPago.card_number,
        expiryMonth: modalPago.expiryMonth,
        expiryYear: modalPago.expiryYear,
        cvv: modalPago.cvv,
        amount: selectedMulta.valor,
        currency: modalPago.currency,
      },
    };
    try {
      const res = await fetch(`${baseUrl}/multas/pagar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      // Update UI and close
      setMultasEncontradas(
        multasEncontradas.map((m) =>
          m.id === selectedMulta.id ? { ...m, pagada: true } : m
        )
      );
      setShowModal(false);
      setResultadoPago(data.mensaje || JSON.stringify(data));
    } catch (err) {
      setModalError(err.message || "Error al procesar el pago");
    }
  };

  const handleBuscar = async (e) => {
    e.preventDefault();
    setErrorBuscar(null);
    try {
      const res = await fetch(`${baseUrl}/multas/${identifier}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error en la petición");
      const data = await res.json();
      setMultasEncontradas(data);
    } catch (err) {
      setErrorBuscar(err.message);
    }
  };

  // Render login or register form if not authenticated
  if (!token) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          {isRegistering ? (
            <>
              <h2 className="text-2xl mb-4 text-[#c10230]">Registrarse</h2>
              {registerError && (
                <p className="text-red-600 mb-2">{registerError}</p>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded focus:ring-[#c10230]"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded focus:ring-[#c10230]"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#c10230] text-white rounded hover:bg-[#a80129] transition"
                >
                  Registrar
                </button>
              </form>
              <p className="mt-4 text-sm text-center">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => setIsRegistering(false)}
                  className="text-[#c10230]"
                >
                  Iniciar Sesión
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl mb-4 text-[#c10230]">Iniciar Sesión</h2>
              {loginError && <p className="text-red-600 mb-2">{loginError}</p>}
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded focus:ring-[#c10230]"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded focus:ring-[#c10230]"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#c10230] text-white rounded hover:bg-[#a80129] transition"
                >
                  Login
                </button>
              </form>
              <p className="mt-4 text-sm text-center">
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => setIsRegistering(true)}
                  className="text-[#c10230]"
                >
                  Regístrate
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#c10230] text-white p-6">
        <div className="flex items-center mb-10">
          <FiCreditCard className="" size={28} />
          <h1 className="ml-3 text-2xl font-bold">Shak Multas</h1>
        </div>
        <nav className="flex flex-col space-y-4">
          <button className="flex items-center p-2 rounded hover:bg-[#a80129] transition">
            <FiBarChart2 className="mr-3" /> Dashboard
          </button>
          <button className="flex items-center p-2 rounded hover:bg-[#a80129] transition">
            <FiPlusCircle className="mr-3" /> Crear Multa
          </button>
          <button className="flex items-center p-2 rounded hover:bg-[#a80129] transition">
            <FiSearch className="mr-3" /> Buscar Multas
          </button>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-8">
        {/* Header móvil */}
        <header className="flex lg:hidden items-center justify-between mb-6 bg-[#c10230] p-4 rounded text-white">
          <h1 className="text-xl font-semibold">Shak Multas Dashboard</h1>
        </header>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card Crear Multa */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4 text-[#c10230]">
              <FiPlusCircle size={28} className="mr-2" />
              <h2 className="text-xl font-semibold">Crear Multa</h2>
            </div>
            <form onSubmit={handleCrear} className="space-y-4">
              <input
                placeholder="ID (ej: PBO1234)"
                value={nuevaMulta.id}
                onChange={(e) =>
                  setNuevaMulta({ ...nuevaMulta, id: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
              />
              <input
                placeholder="Valor"
                type="number"
                value={nuevaMulta.valor}
                onChange={(e) =>
                  setNuevaMulta({ ...nuevaMulta, valor: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
              />
              <input
                placeholder="Descripción"
                value={nuevaMulta.descripcion}
                onChange={(e) =>
                  setNuevaMulta({ ...nuevaMulta, descripcion: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#c10230] text-white rounded hover:bg-[#a80129] transition"
              >
                Crear Multa
              </button>
            </form>
            {resultadoCrear && (
              <p className="mt-4 text-green-600">{resultadoCrear}</p>
            )}
          </div>
          {/* Card Buscar Multas */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4 text-[#c10230]">
              <FiSearch size={28} className="mr-2" />
              <h2 className="text-xl font-semibold">Buscar Multas</h2>
            </div>
            <form onSubmit={handleBuscar} className="space-y-4">
              <input
                placeholder="Identificador"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
              />
              <button
                type="submit"
                className="w-full py-3 bg-[#c10230] text-white rounded hover:bg-[#a80129] transition"
              >
                Buscar
              </button>
            </form>
            {errorBuscar && <p className="mt-4 text-red-600">{errorBuscar}</p>}
            {multasEncontradas.length > 0 && (
              <ul className="mt-6 space-y-4">
                {multasEncontradas.map((m) => (
                  <li
                    key={m.id}
                    className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p>
                        <strong>Placa:</strong> {m.identifier}
                      </p>
                      <p>
                        <strong>Desc:</strong> {m.descripcion}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={
                          m.pagada
                            ? "px-2 py-1 bg-green-100 text-green-800 rounded"
                            : "px-2 py-1 bg-red-100 text-red-800 rounded"
                        }
                      >
                        {m.pagada ? "Pagada" : "Pendiente"}
                      </span>
                      {!m.pagada && (
                        <button
                          onClick={() => openModal(m)}
                          className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Modal de Pago */}
        {showModal && (
          <div className="fixed inset-0 backdrop-blur-md bg-transparent flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-6 text-[#c10230]">
                Pagar Multa {identifier}
              </h2>
              {modalError && <p className="mb-4 text-red-600">{modalError}</p>}
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="customer_email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email del cliente
                  </label>
                  <input
                    id="customer_email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={modalPago.customer_email}
                    onChange={(e) =>
                      setModalPago({
                        ...modalPago,
                        customer_email: e.target.value,
                      })
                    }
                    required
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="card_type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tipo de tarjeta
                  </label>
                  <select
                    id="card_type"
                    value={modalPago.card_type}
                    onChange={(e) =>
                      setModalPago({ ...modalPago, card_type: e.target.value })
                    }
                    required
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
                  >
                    <option value="">Seleccione...</option>
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                    <option value="AMEX">AMEX</option>
                    <option value="DISCOVER">DISCOVER</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="card_holder_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nombre en la tarjeta
                  </label>
                  <input
                    id="card_holder_name"
                    placeholder="Juan Pérez"
                    value={modalPago.card_holder_name}
                    onChange={(e) =>
                      setModalPago({
                        ...modalPago,
                        card_holder_name: e.target.value,
                      })
                    }
                    required
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="card_number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Número de tarjeta
                  </label>
                  <input
                    id="card_number"
                    placeholder="1234 5678 9012 3456"
                    value={modalPago.card_number}
                    onChange={(e) =>
                      setModalPago({
                        ...modalPago,
                        card_number: e.target.value,
                      })
                    }
                    required
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha de expiración
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={modalPago.expiryMonth}
                      onChange={(e) =>
                        setModalPago({
                          ...modalPago,
                          expiryMonth: e.target.value,
                        })
                      }
                      required
                      className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
                    >
                      <option value="">Mes</option>
                      <option value="01">01</option>
                      <option value="02">02</option>
                      <option value="03">03</option>
                      <option value="04">04</option>
                      <option value="05">05</option>
                      <option value="06">06</option>
                      <option value="07">07</option>
                      <option value="08">08</option>
                      <option value="09">09</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </select>
                    <select
                      value={modalPago.expiryYear}
                      onChange={(e) =>
                        setModalPago({
                          ...modalPago,
                          expiryYear: e.target.value,
                        })
                      }
                      required
                      className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
                    >
                      <option value="">Año</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="cvv"
                    className="block text-sm font-medium text-gray-700"
                  >
                    CVV
                  </label>
                  <input
                    id="cvv"
                    placeholder="123"
                    value={modalPago.cvv}
                    onChange={(e) =>
                      setModalPago({ ...modalPago, cvv: e.target.value })
                    }
                    required
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#c10230]"
                  />
                </div>
                <div className="flex justify-end pt-4 space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="py-2 px-4 border border-gray-300 rounded hover:bg-gray-100 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-[#c10230] text-white rounded hover:bg-[#a80129] transition"
                  >
                    Confirmar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
