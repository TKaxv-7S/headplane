import { readdir, readFile } from 'node:fs/promises';
import { platform } from 'node:os';
import { join, resolve } from 'node:path';
import { kill } from 'node:process';

import { Config, CoreV1Api, KubeConfig } from '@kubernetes/client-node';

import log from '~/utils/log';

import { createIntegration } from './integration';

interface Context {
	pid: number | undefined;
}

export default createIntegration<Context>({
	name: 'Kubernetes (k8s)',
	context: {
		pid: undefined,
	},
	isAvailable: async (context) => {
		if (platform() !== 'linux') {
			log.error('INTG', 'Kubernetes is only available on Linux');
			return false;
		}

		const svcRoot = Config.SERVICEACCOUNT_ROOT;
		try {
			log.debug('INTG', 'Checking Kubernetes service account at %s', svcRoot);
			const files = await readdir(svcRoot);
			if (files.length === 0) {
				log.error('INTG', 'Kubernetes service account not found');
				return false;
			}

			const mappedFiles = new Set(files.map((file) => join(svcRoot, file)));
			const expectedFiles = [
				Config.SERVICEACCOUNT_CA_PATH,
				Config.SERVICEACCOUNT_TOKEN_PATH,
				Config.SERVICEACCOUNT_NAMESPACE_PATH,
			];

			log.debug('INTG', 'Looking for %s', expectedFiles.join(', '));
			if (!expectedFiles.every((file) => mappedFiles.has(file))) {
				log.error('INTG', 'Malformed Kubernetes service account');
				return false;
			}
		} catch (error) {
			log.error('INTG', 'Failed to access %s: %s', svcRoot, error);
			return false;
		}

		log.debug('INTG', 'Reading Kubernetes service account at %s', svcRoot);
		const namespace = await readFile(
			Config.SERVICEACCOUNT_NAMESPACE_PATH,
			'utf8',
		);

		// Some very ugly nesting but it's necessary
		if (process.env.HEADSCALE_INTEGRATION_UNSTRICT === 'true') {
			log.warn('INTG', 'Skipping strict Pod status check');
		} else {
			const pod = process.env.POD_NAME;
			if (!pod) {
				log.error('INTG', 'Missing POD_NAME variable');
				return false;
			}

			if (pod.trim().length === 0) {
				log.error('INTG', 'Pod name is empty');
				return false;
			}

			log.debug(
				'INTG',
				'Checking Kubernetes pod %s in namespace %s',
				pod,
				namespace,
			);

			try {
				log.debug('INTG', 'Attempgin to get cluster KubeConfig');
				const kc = new KubeConfig();
				kc.loadFromCluster();

				const cluster = kc.getCurrentCluster();
				if (!cluster) {
					log.error('INTG', 'Malformed kubeconfig');
					return false;
				}

				log.info(
					'INTG',
					'Service account connected to %s (%s)',
					cluster.name,
					cluster.server,
				);

				const kCoreV1Api = kc.makeApiClient(CoreV1Api);

				log.info(
					'INTG',
					'Checking pod %s in namespace %s (%s)',
					pod,
					namespace,
					kCoreV1Api.basePath,
				);

				log.debug('INTG', 'Reading pod info for %s', pod);
				const { response, body } = await kCoreV1Api.readNamespacedPod(
					pod,
					namespace,
				);

				if (response.statusCode !== 200) {
					log.error(
						'INTG',
						'Failed to read pod info: http %d',
						response.statusCode,
					);
					return false;
				}

				log.debug('INTG', 'Got pod info: %o', body.spec);
				const shared = body.spec?.shareProcessNamespace;
				if (shared === undefined) {
					log.error('INTG', 'Pod does not have spec.shareProcessNamespace set');
					return false;
				}

				if (!shared) {
					log.error(
						'INTG',
						'Pod has set but disabled spec.shareProcessNamespace',
					);
					return false;
				}

				log.info('INTG', 'Pod %s enabled shared processes', pod);
			} catch (error) {
				log.error('INTG', 'Failed to read pod info: %s', error);
				return false;
			}
		}

		log.debug('INTG', 'Looking for namespaced process in /proc');
		const dir = resolve('/proc');
		try {
			const subdirs = await readdir(dir);
			const promises = subdirs.map(async (dir) => {
				const pid = Number.parseInt(dir, 10);

				if (Number.isNaN(pid)) {
					return;
				}

				const path = join('/proc', dir, 'cmdline');
				try {
					log.debug('INTG', 'Reading %s', path);
					const data = await readFile(path, 'utf8');
					if (data.includes('headscale')) {
						return pid;
					}
				} catch (error) {
					log.debug('INTG', 'Failed to read %s: %s', path, error);
				}
			});

			const results = await Promise.allSettled(promises);
			const pids = [];

			for (const result of results) {
				if (result.status === 'fulfilled' && result.value) {
					pids.push(result.value);
				}
			}

			log.debug('INTG', 'Found Headscale processes: %o', pids);
			if (pids.length > 1) {
				log.error(
					'INTG',
					'Found %d Headscale processes: %s',
					pids.length,
					pids.join(', '),
				);
				return false;
			}

			if (pids.length === 0) {
				log.error('INTG', 'Could not find Headscale process');
				return false;
			}

			context.pid = pids[0];
			log.info('INTG', 'Found Headscale process with PID: %d', context.pid);
			return true;
		} catch {
			log.error('INTG', 'Failed to read /proc');
			return false;
		}
	},

	onConfigChange: (context) => {
		if (!context.pid) {
			return;
		}

		log.info('INTG', 'Sending SIGTERM to Headscale');
		kill(context.pid, 'SIGTERM');
	},
});
