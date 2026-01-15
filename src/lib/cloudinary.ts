import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;

if (!cloudName) throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not set');

export const cld = new Cloudinary({ cloud: { cloudName } });

export function buildCldUrl(
	publicId: string,
	options?: { width?: number; height?: number; alt?: string }
): { src: string; alt: string } {
	const image = cld.image(publicId);
	if (options?.width || options?.height) {
		const resizeAction = fill().gravity(autoGravity());
		if (options.width) resizeAction.width(options.width);
		if (options.height) resizeAction.height(options.height);
		image.resize(resizeAction);
	}
	return { src: image.toURL(), alt: options?.alt ?? publicId };
}
