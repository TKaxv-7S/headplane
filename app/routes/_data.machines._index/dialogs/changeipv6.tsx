import { Form, useSubmit } from '@remix-run/react'
import { type Dispatch, type SetStateAction } from 'react'

import Code from '~/components/Code'
import Dialog from '~/components/Dialog'
import TextField from '~/components/TextField'
import { type Machine } from '~/types'

interface Changeipv6Props {
	readonly machine: Machine
	readonly state: [boolean, Dispatch<SetStateAction<boolean>>]
	readonly magic?: string
}

export default function Changeipv6({ machine, state }: Changeipv6Props) {
	const submit = useSubmit()

	return (
		<Dialog>
			<Dialog.Panel control={state}>
				{close => (
					<>
						<Dialog.Title>
							Edit machine ipv6 for
						</Dialog.Title>
						{machine.ipAddresses.filter((value) => {
							for (const char of value) {
								if (char === ':') {
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
							Modify the Ipv6 address and fill in the new Ipv6 address.
						</Dialog.Text>
						<Form
							method="POST"
							onSubmit={(e) => {
								submit(e.currentTarget)
							}}
						>
							<input type="hidden" name="_method" value="changeipv6" />
							<input type="hidden" name="id" value={machine.id} />
							<TextField
								label="Machine ipv6 address"
								placeholder="Machine ipv6 address"
								name="ipv6"
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
