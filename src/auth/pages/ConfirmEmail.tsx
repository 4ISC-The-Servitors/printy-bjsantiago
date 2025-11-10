import React, { useEffect } from 'react';
import { supabase } from '@lib/supabase';

const ConfirmEmail: React.FC = () => {
	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			// Ensure Supabase has had a chance to process the URL and create a session, if any
			await supabase.auth.getSession();
			// Immediately sign out so the Sign In page doesn't auto-redirect to /customer
			try {
				await supabase.auth.signOut();
			} catch {
				// ignore
			}
			if (!cancelled) {
				// Redirect to Sign In
				window.location.replace('/auth/signin');
			}
		};
		run();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="min-h-screen flex items-center justify-center bg-neutral-50">
			<div className="text-center text-neutral-700">
				<p className="text-lg font-medium">Confirming your email...</p>
				<p className="text-sm text-neutral-500 mt-2">You’ll be redirected to Sign In.</p>
			</div>
		</div>
	);
};

export default ConfirmEmail;


