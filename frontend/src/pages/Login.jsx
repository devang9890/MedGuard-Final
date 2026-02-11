import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";

export default function Login() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			console.log("Attempting login with:", { email, password });
			const res = await loginUser({ email, password });
			console.log("Login response:", res.data);
			const { access_token, user } = res.data;
			localStorage.setItem("token", access_token);
			localStorage.setItem("user", JSON.stringify(user));
			console.log("Login successful, redirecting to dashboard");
			navigate("/dashboard");
		} catch (err) {
			console.error("Login error:", err);
			const errorMessage = err?.response?.data?.message || err?.message || "Login failed";
			setError(errorMessage);
			console.error("Error message set to:", errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white rounded shadow p-6">
				<h1 className="text-2xl font-bold mb-2">MedGuard Login</h1>
				<p className="text-gray-600 mb-6">Use an admin account to manage suppliers.</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">Email</label>
						<input
							type="email"
							className="w-full border p-2 rounded"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">Password</label>
						<input
							type="password"
							className="w-full border p-2 rounded"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && (
						<div className="text-red-600 text-sm">{error}</div>
					)}

					<button
						type="submit"
						className="w-full bg-blue-600 text-white py-2 rounded"
						disabled={loading}
					>
						{loading ? "Signing in..." : "Sign In"}
					</button>
				</form>
			</div>
		</div>
	);
}
