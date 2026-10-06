import { useState } from 'react';
import api from '../api/client';

const roles = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'GUIDE', label: 'Guide' },
  { value: 'COORDINATOR', label: 'Coordinator' }
];

export default function Login({ onLogin }) {
  const [form, setForm] = useState({
    role: 'STUDENT',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      onLogin?.(data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        <section className="hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-500 p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-12 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-xl font-bold">P</div>
              <span className="text-lg font-semibold tracking-wide">ProjectTrack</span>
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">Final-year project tracker</p>
            <h1 className="max-w-md text-5xl font-bold leading-tight">Keep every project milestone on track.</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
              One workspace for teams, guides, reviews, progress, and final submissions.
            </p>
          </div>
          <p className="text-sm text-blue-100">Manage progress with clarity.</p>
        </section>

        <section className="flex items-center bg-white px-6 py-10 text-slate-900 sm:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9 lg:hidden">
              <p className="text-lg font-bold text-indigo-700">ProjectTrack</p>
            </div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="mt-3 text-slate-500">Choose your role to continue to the tracker.</p>

            <form className="mt-8 space-y-5" onSubmit={submit}>
              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="role">Role</label>
                <select id="role" name="role" value={form.role} onChange={updateField} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100">
                  {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" required autoComplete="email" value={form.email} onChange={updateField} placeholder="you@university.edu" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium" htmlFor="password">Password</label>
                  <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Forgot password?</button>
                </div>
                <input id="password" name="password" type="password" required minLength={6} autoComplete="current-password" value={form.password} onChange={updateField} placeholder="Enter your password" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100" />
              </div>

              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button disabled={isSubmitting} className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
