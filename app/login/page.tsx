"use client";

// LoginPage for business users

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: { preventDefault(): void }) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const result = await signIn("credentials", {
			username,
			password,
			redirect: false,
		});
		setLoading(false);
		if (result?.error) {
			setError("Invalid username or password");
		} else {
			router.push("/");
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md text-gray-900"
			>
				<h2 className="mb-6 text-center text-2xl font-bold">Login</h2>
				{error && (
					<div className="mb-4 rounded bg-red-100 px-3 py-2 text-red-700">
						{error}
					</div>
				)}
				<div className="mb-4">
					<Label htmlFor="username">Username</Label>
					<Input
						id="username"
						type="text"
						placeholder="baker"
						value={username}
						onChange={e => setUsername(e.target.value)}
						required
						className="mt-1"
					/>
				</div>
				<div className="mb-6">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						type="password"
						placeholder="Your password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
						className="mt-1"
					/>
				</div>
				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "Signing in..." : "Sign In"}
				</Button>
			</form>
		</div>
	);
}
