import type { Model } from '$lib/stores';

export type GptHubModality =
	| 'text'
	| 'vision'
	| 'audio'
	| 'image_generation'
	| 'embedding'
	| 'tts';

const MODALITY_ORDER: GptHubModality[] = [
	'text',
	'vision',
	'audio',
	'image_generation',
	'embedding',
	'tts'
];

const normalizeModality = (value: unknown): GptHubModality | null => {
	if (typeof value !== 'string') {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return MODALITY_ORDER.includes(normalized as GptHubModality)
		? (normalized as GptHubModality)
		: null;
};

export const getGptHubModalities = (model?: Model | null): GptHubModality[] => {
	const declared = model?.info?.meta?.gpthub_modalities;
	if (Array.isArray(declared)) {
		const normalized = Array.from(
			new Set(declared.map((value) => normalizeModality(value)).filter(Boolean))
		) as GptHubModality[];

		if (normalized.length > 0) {
			return MODALITY_ORDER.filter((modality) => normalized.includes(modality));
		}
	}

	const capabilities = model?.info?.meta?.capabilities ?? {};
	const inferred: GptHubModality[] = [];

	if (capabilities?.vision) {
		inferred.push('vision');
	}

	if (capabilities?.audio || capabilities?.speech_to_text || capabilities?.transcription) {
		inferred.push('audio');
	}

	if (capabilities?.image_generation) {
		inferred.push('image_generation');
	}

	if (capabilities?.embedding) {
		inferred.push('embedding');
	}

	if (capabilities?.tts || capabilities?.text_to_speech) {
		inferred.push('tts');
	}

	if (inferred.length === 0) {
		inferred.push('text');
	}

	return MODALITY_ORDER.filter((modality) => inferred.includes(modality));
};

export const hasGptHubModality = (model: Model | null | undefined, modality: GptHubModality) =>
	getGptHubModalities(model).includes(modality);
