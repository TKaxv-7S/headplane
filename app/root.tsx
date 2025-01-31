import type { LoaderFunctionArgs, LinksFunction, MetaFunction } from 'react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigation } from 'react-router';
import { loadContext } from '~/utils/config/headplane';
import '@fontsource-variable/inter'

import { ProgressBar } from 'react-aria-components';
import { ErrorPopup } from '~/components/Error';
// TODO: Make this a default export
import { Toaster } from '~/components/Toaster';
import stylesheet from '~/tailwind.css?url';
import { cn } from '~/utils/cn';

export const meta: MetaFunction = () => [
	{ title: 'Headplane' },
	{
		name: 'description',
		content: 'A frontend for the headscale coordination server',
	},
];

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesheet },
];

export function Layout({ children }: { readonly children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="overscroll-none dark:bg-headplane-900 dark:text-headplane-50">
				{children}
				<Toaster />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export function ErrorBoundary() {
	return <ErrorPopup />;
}

export default function App() {
	const nav = useNavigation();

	return (
		<>
			<ProgressBar aria-label="Loading...">
				<div
					className={cn(
						'fixed top-0 left-0 z-50 w-1/2 h-1',
						'bg-blue-500 dark:bg-blue-400 opacity-0',
						nav.state === 'loading' && 'animate-loading opacity-100',
					)}
				/>
			</ProgressBar>
			<Outlet />
		</>
	)
}
