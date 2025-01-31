import { useMemo, useState } from 'react';
import { useSubmit } from 'react-router';

import Code from '~/components/Code';
import Dialog from '~/components/Dialog';
import TextField from '~/components/TextField';
import { cn } from '~/utils/cn';

interface Props {
	records: { name: string; type: 'A'; value: string }[];
}

export default function AddDNS({ records }: Props) {
	const submit = useSubmit();
	const [name, setName] = useState('');
	const [ip, setIp] = useState('');

	const isDuplicate = useMemo(() => {
		if (name.length === 0 || ip.length === 0) return false;
		const lookup = records.find((record) => record.name === name);
		if (!lookup) return false;

		return lookup.value === ip;
	}, [records, name, ip]);

	// TODO: Ditch useSubmit here (non JSON form)
	return (
		<Dialog>
			<Dialog.Button>Add DNS record</Dialog.Button>
			<Dialog.Panel
				onSubmit={(event) => {
					event.preventDefault();
					if (!name || !ip) return;

					setName('');
					setIp('');
					submit(
						{
							'dns.extra_records': [
								...records,
								{
									name,
									type: 'A',
									value: ip,
								},
							],
						},
						{
							method: 'PATCH',
							encType: 'application/json',
						},
					);
				}}
			>
				<Dialog.Title>Add DNS record</Dialog.Title>
				<Dialog.Text>
					Enter the domain and IP address for the new DNS record.
				</Dialog.Text>
				<TextField
					isRequired
					label="Domain"
					placeholder="test.example.com"
					name="domain"
					state={[name, setName]}
					className={cn('mt-2', isDuplicate && 'outline outline-red-500')}
				/>
				<TextField
					isRequired
					label="IP Address"
					placeholder="101.101.101.101"
					name="ip"
					state={[ip, setIp]}
					className={cn(isDuplicate && 'outline outline-red-500')}
				/>
				{isDuplicate ? (
					<p className="text-sm opacity-50">
						A record with the domain name <Code>{name}</Code> and IP address{' '}
						<Code>{ip}</Code> already exists.
					</p>
				) : undefined}
			</Dialog.Panel>
		</Dialog>
	);
}
