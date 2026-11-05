
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Briefcase } from "lucide-react";
import API from "../api/axios";
import socket from "../socket";
function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await API.post("/auth/login", formData);

      // Save JWT token
      localStorage.setItem("token", response.data.token);

      // Save user information
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.data)
      );
     socket.connect();
     
      // Redirect to dashboard
      navigate("/");

    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">

        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 text-white p-3 rounded-xl mb-3">
            <Briefcase size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            WorkSphere
          </h1>

          <p className="text-slate-500 mt-1">
            Sign in to your account
          </p>
        </div>

        {error && (
          <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>

            <div className="flex items-center border rounded-lg px-3">
              <Mail size={18} className="text-slate-400" />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>

            <div className="flex items-center border rounded-lg px-3">
              <Lock size={18} className="text-slate-400" />

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 font-semibold"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
