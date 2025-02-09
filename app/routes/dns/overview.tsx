import type { ActionFunctionArgs } from 'react-router';
import { data, useLoaderData } from 'react-router';

import Code from '~/components/Code';
import Notice from '~/components/Notice';
import { loadContext } from '~/utils/config/headplane';
import { loadConfig, patchConfig } from '~/utils/config/headscale';
import { getSession } from '~/utils/sessions.server';

import DNS from './components/dns';
import Domains from './components/domains';
import MagicModal from './components/magic';
import Nameservers from './components/nameservers';
import RenameModal from './components/rename';

// We do not want to expose every config value
export async function loader() {
	const context = await loadContext();
	if (!context.config.read) {
		throw new Error('No configuration is available');
	}

	const config = await loadConfig();
	const dns = {
		prefixes: config.prefixes,
		magicDns: config.dns.magic_dns,
		baseDomain: config.dns.base_domain,
		nameservers: config.dns.nameservers.global,
		splitDns: config.dns.nameservers.split,
		searchDomains: config.dns.search_domains,
		extraRecords: config.dns.extra_records,
	};

	return {
		...dns,
		...context,
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'));
	if (!session.has('hsApiKey')) {
		return data({ success: false }, { status: 401 });
	}

	const context = await loadContext();
	if (!context.config.write) {
		return data({ success: false }, { status: 403 });
	}

	const textData = await request.text();
	if (!textData) {
		return data({ success: true });
	}

	const patch = JSON.parse(textData) as Record<string, unknown>;
	await patchConfig(patch);

	if (context.integration?.onConfigChange) {
		await context.integration.onConfigChange(context.integration.context);
	}

	return data({ success: true });
}

export default function Page() {
	const data = useLoaderData<typeof loader>();

	const allNs: Record<string, string[]> = {};
	for (const key of Object.keys(data.splitDns)) {
		allNs[key] = data.splitDns[key];
	}

	allNs.global = data.nameservers;

	return (
		<div className="flex flex-col gap-16 max-w-screen-lg">
			{data.config.write ? undefined : (
				<Notice>
					The Headscale configuration is read-only. You cannot make changes to
					the configuration
				</Notice>
			)}
			<RenameModal name={data.baseDomain} disabled={!data.config.write} />
			<Nameservers nameservers={allNs} isDisabled={!data.config.write} />

			<DNS records={data.extraRecords} isDisabled={!data.config.write} />

			<Domains
				baseDomain={data.magicDns ? data.baseDomain : undefined}
				searchDomains={data.searchDomains}
				disabled={!data.config.write}
			/>

			<div className="flex flex-col w-2/3">
				<h1 className="text-2xl font-medium mb-4">Magic DNS</h1>
				<p className="mb-4">
					Automatically register domain names for each device on the tailnet.
					Devices will be accessible at{' '}
					<Code>
						[device].
						{data.baseDomain}
					</Code>{' '}
					when Magic DNS is enabled.
				</p>
				<MagicModal isEnabled={data.magicDns} disabled={!data.config.write} />
			</div>
		</div>
	);
}
