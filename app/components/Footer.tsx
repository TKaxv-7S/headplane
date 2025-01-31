import { cn } from '~/utils/cn';
import Link from '~/components/Link';
import Tooltip from '~/components/Tooltip';

declare global {
	const __VERSION__: string;
}

interface FooterProps {
	url: string;
	debug: boolean;
}

export default function Footer({ url, debug }: FooterProps) {
	return (
		<footer
			className={cn(
				'fixed bottom-0 left-0 z-40 w-full h-14',
				'flex flex-col justify-center gap-1 shadow-inner',
				'bg-headplane-100 dark:bg-headplane-950',
				'text-headplane-800 dark:text-headplane-200',
				'dark:border-t dark:border-headplane-800',
			)}
		>
			<p className="container text-xs">
				Headplane is entirely free to use. If you find it useful, consider{' '}
				<Link
					to="https://github.com/sponsors/tale"
					name="Aarnav's GitHub Sponsors"
				>
					donating
				</Link>{' '}
				to support development.{' '}
			</p>
			<p className="container text-xs opacity-75">
				Version: {__VERSION__}
				{' — '}
				Connecting to
				{' '}
				<strong className="blur-xs hover:blur-none">
					{url}
				</strong>
				{debug && ' (Debug mode enabled)'}
			</p>
		</footer>
	);
}
