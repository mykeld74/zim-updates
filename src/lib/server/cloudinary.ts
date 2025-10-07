import { v2 as cloudinary, type ConfigOptions } from 'cloudinary';
import { env } from '$env/dynamic/private';

const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;

for (const key of required) {
	if (!env[key]) throw new Error(`${key} is not set`);
}

const config: ConfigOptions = {
	cloud_name: env.CLOUDINARY_CLOUD_NAME,
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
	secure: true
};

cloudinary.config(config);

export { cloudinary };

export function getCloudinaryCloudName(): string {
	return config.cloud_name as string;
}

export type SignedUploadParams = {
	timestamp?: number;
	folder?: string;
	tags?: string[];
	public_id?: string;
};

export async function createSignedUpload(params: SignedUploadParams = {}): Promise<{
	signature: string;
	timestamp: number;
	apiKey: string;
	cloudName: string;
}> {
	const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000);
	const toSign: Record<string, unknown> = { timestamp };
	if (params.folder) toSign.folder = params.folder;
	if (params.tags && params.tags.length) toSign.tags = params.tags.join(',');
	if (params.public_id) toSign.public_id = params.public_id;

	const signature = cloudinary.utils.api_sign_request(toSign, config.api_secret as string);

	return {
		signature,
		timestamp,
		apiKey: config.api_key as string,
		cloudName: config.cloud_name as string
	};
}

