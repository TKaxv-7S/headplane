import { Form, useSubmit } from '@remix-run/react'
import { type Dispatch, type SetStateAction } from 'react'

import Code from '~/components/Code'
import Dialog from '~/components/Dialog'
import TextField from '~/components/TextField'
import { type Machine } from '~/types'

interface Changeipv4Props {
	readonly machine: Machine
	readonly state: [boolean, Dispatch<SetStateAction<boolean>>]
	readonly magic?: string
}

export default function Changeipv4({ machine, state }: Changeipv4Props) {
	const submit = useSubmit()

	return (
		<Dialog>
			<Dialog.Panel control={state}>
				{close => (
					<>
						<Dialog.Title>
							Edit machine ipv4 for
						</Dialog.Title>
						{machine.ipAddresses.filter((value) => {
							for (const char of value) {
								if (char === '.') {
									return true
								}
							}
							return false
						}).map(item => (
							<p className="mb-5" key={item}>
								<Code>
									{item}
								</Code>
							</p>
						))}
						<Dialog.Text>
							Modify the IPv4 address and fill in the new IPv4 address.
						</Dialog.Text>
						<Form
							method="POST"
							onSubmit={(e) => {
								submit(e.currentTarget)
							}}
						>
							<input type="hidden" name="_method" value="changeipv4" />
							<input type="hidden" name="id" value={machine.id} />
							<TextField
								label="Machine ipv4 address"
								placeholder="Machine ipv4 address"
								name="ipv4"
								className="my-2"
							/>
							<div className="mt-6 flex justify-end gap-2 mt-6">
								<Dialog.Action
									variant="cancel"
									onPress={close}
								>
									Cancel
								</Dialog.Action>
								<Dialog.Action
									variant="confirm"
									onPress={close}
								>
									Change
								</Dialog.Action>
							</div>
						</Form>
					</>
				)}
			</Dialog.Panel>
		</Dialog>
	)
}
